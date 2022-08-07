import { NextFunction, Request, Response } from "express";
import Logger from "../utils/Logger";
import fs from "fs";
import git from "isomorphic-git";
import HTTPStatusCode from "../constants/HTTPStatusCode";
import { getDefaultRepoDir } from "../utils/RepoUtils";
import { commitAndRetrieveStats } from "../utils/CommitUtils";
import path from "path";
import http from "isomorphic-git/http/node";

const admin = { name: "Admin", email: "hpar461@aucklanduni.ac.nz" };

async function initRepo(req: Request, res: Response, next: NextFunction) {
  Logger.info("initRepo run");

  const { username, scenarioNameId }: { username: string, scenarioNameId: string } = req.body;

  const dir = getDefaultRepoDir(username);

  // Initialise the repo.
  await git.init({
    fs, dir, defaultBranch: "main",
  });

  // copy main.py from scenario to repo
  const srcDir = getDefaultRepoDir(path.join("scenarioDefaults", scenarioNameId));
  fs.copyFileSync(path.join(srcDir, "main.py"), path.join(dir, "main.py"));

  // Add the file and create an initial commit
  await git.add({
    fs, dir, filepath: "main.py"
  });
  await git.commit({
    fs, dir, message: "Initial commit", author: admin
  });

  res.status(HTTPStatusCode.CREATED).json({ message: "init repo success" });
}

async function addRemote(req: Request, res: Response, next: NextFunction) {
  const { username, remoteUrl } = req.body;
  await git.addRemote({
    fs,
    dir: getDefaultRepoDir(username),
    gitdir: getDefaultRepoDir(username) + "\\.git",
    remote: "origin",
    url: remoteUrl
  });
  res.status(HTTPStatusCode.NO_CONTENT).json({ message: "add remote success" });
}

async function getRepoStatus(req: Request, res: Response, next: NextFunction) {
  Logger.info("getStatus run");

  const { username } = req.params;

  // For now, since we know that the only file we have is main.py, we can just check if it is modified or not.
  const status = await git.status({
    fs,
    dir: getDefaultRepoDir(username),
    filepath: "main.py",
  });
  res.json({ status });
}

async function stageFile(req: Request, res: Response, next: NextFunction) {
  Logger.info("stageFile run");

  const { username, fileName }: { username: string; fileName: string } = req.body;

  try {
    await git.add({
      fs,
      dir: getDefaultRepoDir(username),
      filepath: fileName,
    });

    res.sendStatus(HTTPStatusCode.NO_CONTENT);
  } catch (e) {
    Logger.error(e);
    res.status(HTTPStatusCode.NOT_FOUND).json({ fileName });
  }
}

async function stageAllFiles(req: Request, res: Response, next: NextFunction) {
  Logger.info("stageAllFiles run");

  const { username }: { username: string } = req.body;

  try {
    await git.add({
      fs,
      dir: getDefaultRepoDir(username),
      filepath: ".",
    });

    res.sendStatus(HTTPStatusCode.NO_CONTENT);
  } catch (e) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "stage all files failed", error: e });
  }
}

async function commit(req: Request, res: Response, next: NextFunction) {
  Logger.info("commit run");

  const {
    username,
    message,
    author,
  }: {
    username: string;
    message: string;
    author: {
      name: string;
      email: string;
    }
  } = req.body;

  try {
    const dir = getDefaultRepoDir(username);
    const result = await commitAndRetrieveStats(dir, message, author);
    res.status(HTTPStatusCode.CREATED).json(result);
  } catch (e) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "commit failed" });
  }
}

async function stageAllAndCommit(req: Request, res: Response, next: NextFunction) {
  Logger.info("stageAllAndCommit run");

  const {
    username,
    message,
    author,
  }: {
    username: string;
    message: string;
    author: {
      name: string;
      email: string;
    }
  } = req.body;

  try {
    const dir = getDefaultRepoDir(username);

    await git.add({
      fs,
      dir,
      filepath: ".",
    });
    const result = await commitAndRetrieveStats(dir, message, author);

    res.status(HTTPStatusCode.CREATED).json(result);
  } catch (e) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "stage and commit failed" });
  }
}

async function push(req: Request, res: Response, next: NextFunction) {
  Logger.info("push run");

  const {
    username,
    remote,
    branch,
    accessToken
  }: { username: string, remote: string, branch: string, accessToken: string } = req.body;

  try {
    const dir = getDefaultRepoDir(username);
    await git.push({
      fs,
      http,
      dir,
      remote,
      ref: branch,
      force: true,
      onAuth: () => ({
        username: accessToken,
        password: "x-oauth-basic",
      })
    });

    res.sendStatus(HTTPStatusCode.NO_CONTENT);
  } catch (e: any) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: `push failed with error - ${e.data.statusMessage}: ${e.data.response}` });
  }
}

async function branch(req: Request, res: Response, next: NextFunction) {
  Logger.info("branch run");

  const {
    username,
    newBranchName,
  }: { username: string; newBranchName: string } = req.body;

  try {
    const dir = getDefaultRepoDir(username);
    await git.branch({
      fs,
      dir,
      ref: newBranchName,
    });

    res.sendStatus(HTTPStatusCode.CREATED);
  } catch (e: any) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: e.code });
  }
}

async function checkout(req: Request, res: Response, next: NextFunction) {
  Logger.info("checkout run");

  const {
    username,
    branch,
  }: { username: string; branch: string } = req.body;

  try {
    const dir = getDefaultRepoDir(username);
    // TODO: an issue must arise when we try to checkout while having commits and changes. Address this issue.
    await git.checkout({
      fs,
      dir,
      ref: branch,
    });

    res.sendStatus(HTTPStatusCode.NO_CONTENT);
  } catch (e: any) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: e.code });
  }
}

async function rebase(req: Request, res: Response, next: NextFunction) {
  Logger.info("rebase run");

  const {
    username,
    branch,
  }: { username: string; branch: string } = req.body;

  try {
    const dir = getDefaultRepoDir(username);

    // because rebase is not supported, we will simply mimic what impact rebase has on the codebase.
    fs.appendFileSync(path.join(dir, "main.py"), `\n    print("Line added from rebase.")\n`);

    await git.add({
      fs,
      dir,
      filepath: "main.py",
    });
    await commitAndRetrieveStats(dir, `Rebase from ${branch}`, admin);

    res.sendStatus(HTTPStatusCode.NO_CONTENT);
  } catch (e: any) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: `Rebase failed: ${e.code} from ${e.caller}` });
  }
}

async function currentBranch(req: Request, res: Response, next: NextFunction) {
  Logger.info("currentBranch run");

  const { username } = req.params;
  const fullname = req.query.fullname === "true";

  try {
    const dir = getDefaultRepoDir(username);
    const currentBranch = await git.currentBranch({
      fs,
      dir,
      fullname
    });

    res.status(HTTPStatusCode.OK).send(currentBranch);
  } catch (e: any) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: e.code });
  }
}

export default {
  initRepo,
  addRemote,
  getRepoStatus,
  stageFile,
  stageAllFiles,
  stageAllAndCommit,
  commit,
  push,
  branch,
  checkout,
  rebase,
  currentBranch,
};
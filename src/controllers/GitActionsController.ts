import { NextFunction, Request, Response } from "express";
import Logger from "../utils/Logger";
import fs from "fs";
import git from "isomorphic-git";
import HTTPStatusCode from "../constants/HTTPStatusCode";
import { getDefaultRepoDir } from "../utils/RepoUtils";
import { commitAndRetrieveStats } from "../utils/CommitUtils";
import path from "path";
import http from "isomorphic-git/http/node";

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
    fs, dir, message: "Initial commit", author: { name: "Admin", email: "hpar461@aucklanduni.ac.nz" }
  });

  res.status(HTTPStatusCode.CREATED).json({ message: "init repo success" });
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
    branchName,
  }: { username: string; branchName: string } = req.body;

  try {
    const dir = getDefaultRepoDir(username);
    const result = await git.branch({
      fs,
      dir,
      ref: branchName,
    });

    res.status(HTTPStatusCode.CREATED).json(result);
  } catch (e) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "branch failed" });
  }
}

async function checkout(req: Request, res: Response, next: NextFunction) {
  Logger.info("checkout run");

  const {
    username,
    branchName,
  }: { username: string; branchName: string } = req.body;

  try {
    const dir = getDefaultRepoDir(username);
    // TODO: an issue must arise when we try to checkout while having commits and changes. Address this issue.
    const result = await git.checkout({
      fs,
      dir,
      ref: branchName,
    });

    res.status(HTTPStatusCode.CREATED).json(result);
  } catch (e) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "checkout failed" });
  }
}

// TODO: isomorphic-git doesn't have rebase. We need to implement this manually.
// async function rebase(req: Request, res: Response, next: NextFunction) {
//   Logger.info("rebase run");
//
//   const {
//     username,
//     branchName,
//   }: { username: string; branchName: string } = req.body;
//
//   try {
//     const dir = getDefaultRepoDir(username);
//     const result = await git.rebase({
//       fs,
//       dir,
//       ref: branchName,
//     });
//
//     res.status(HTTPStatusCode.CREATED).json(result);
//   } catch (e) {
//     Logger.error(e);
//     res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "rebase failed" });
//   }
// }

export default { initRepo, getRepoStatus, stageFile, stageAllFiles, stageAllAndCommit, commit, push, branch, checkout };

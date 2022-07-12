import { NextFunction, Request, Response } from "express";
import Logger from "../utils/Logger";
import fs from "fs";
import git from "isomorphic-git";
import HTTPStatusCode from "../constants/HTTPStatusCode";
import { getDefaultRepoDir } from "../utils/RepoUtils";
import { commitAndRetrieveStats } from "../utils/CommitUtils";

async function initRepo(req: Request, res: Response, next: NextFunction) {
  Logger.info("initRepo run");
  await git.init({
    fs,
    dir: getDefaultRepoDir("testUser"),
    defaultBranch: "main",
  });

  const setupDummyRepoWithCommit = async () => {
    fs.writeFileSync(getDefaultRepoDir("testUser") + "/test.txt", "test123");
    await git.add({
      fs,
      dir: getDefaultRepoDir("testUser"),
      filepath: "test.txt",
    });
    await git.commit({
      fs,
      dir: getDefaultRepoDir("testUser"),
      message: "Add test file for repo init.",
      author: {
        name: "test",
        email: "hpar461@aucklanduni.ac.nz",
      },
    });
  };
  await setupDummyRepoWithCommit();

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

export default { initRepo, getRepoStatus, stageFile, stageAllFiles, stageAllAndCommit, commit };

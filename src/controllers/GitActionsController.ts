import { NextFunction, Request, Response } from "express";
import Logger from "../utils/Logger";
import fs from "fs";
import git from "isomorphic-git";
import path from "path";
import HTTPStatusCode from "../constants/HTTPStatusCode";

function getDefaultRepoDir(folderName: string) {
  return path.join(process.cwd(), "repos", folderName);
}

async function initRepo(req: Request, res: Response, next: NextFunction) {
  Logger.info("initRepo run");
  await git.init({
    fs,
    dir: getDefaultRepoDir("test1"),
    defaultBranch: "main",
  });

  const setupDummyRepoWithCommit = async () => {
    fs.writeFileSync(getDefaultRepoDir("test1") + "/test.txt", "test123");
    await git.add({
      fs,
      dir: getDefaultRepoDir("test1"),
      filepath: "test.txt",
    });
    await git.commit({
      fs,
      dir: getDefaultRepoDir("test1"),
      message: "Add test file for repo init.",
      author: {
        name: "test",
        email: "hpar461@aucklanduni.ac.nz",
      },
    });
  };
  setupDummyRepoWithCommit();

  res.status(HTTPStatusCode.CREATED).json({ message: "init repo success" });
}

async function stageAllFiles(req: Request, res: Response, next: NextFunction) {
  Logger.info("stageAllFiles run");
  await git.add({
    fs,
    dir: getDefaultRepoDir("test1"),
    filepath: ".",
  });
  res.status(HTTPStatusCode.NO_CONTENT).json({ message: "stage all files success" });
}

async function getRepoCommitLogs(
  req: Request,
  res: Response,
  next: NextFunction
) {
  Logger.info("getRepoCommitLogs run");

  const status = await git.log({
    fs,
    dir: getDefaultRepoDir("test1"),
    ref: "main",
  });
  res.json({ log: status });
}

export default { initRepo, getRepoCommitLogs };

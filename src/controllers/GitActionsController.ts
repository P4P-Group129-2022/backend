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
  await setupDummyRepoWithCommit();

  res.status(HTTPStatusCode.CREATED).json({ message: "init repo success" });
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

async function getRepoStatus(req: Request, res: Response, next: NextFunction) {
  Logger.info("getStatus run");

  const { scenarioNameId }: { scenarioNameId: string } = req.body;

  // For now, since we know that the only file we have is main.py, we can just check if it is modified or not.
  const status = await git.status({
    fs,
    dir: getDefaultRepoDir(scenarioNameId),
    filepath: "main.py",
  });
  res.json({ status });
}

async function stageFile(req: Request, res: Response, next: NextFunction) {
  Logger.info("stageFile run");

  const { scenarioNameId, fileName }: { scenarioNameId: string; fileName: string } = req.body;

  try {
    await git.add({
      fs,
      dir: getDefaultRepoDir(scenarioNameId),
      filepath: fileName,
    });
  } catch {
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "stage file failed" });
  }

  res.status(HTTPStatusCode.NO_CONTENT).json({ message: "stage file success" });
}

async function stageAllFiles(req: Request, res: Response, next: NextFunction) {
  Logger.info("stageAllFiles run");

  const { scenarioNameId }: { scenarioNameId: string } = req.body;

  try {
    await git.add({
      fs,
      dir: getDefaultRepoDir(scenarioNameId),
      filepath: ".",
    });
  } catch {
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "stage all files failed" });
  }

  res.status(HTTPStatusCode.NO_CONTENT).json({ message: "stage all files success" });
}



export default { initRepo, getRepoCommitLogs, getRepoStatus, stageFile, stageAllFiles };

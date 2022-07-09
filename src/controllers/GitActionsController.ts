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

    res.status(HTTPStatusCode.NO_CONTENT).json({ message: "stage file success" });
  } catch (e) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "stage file failed" });
  }
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

    res.status(HTTPStatusCode.NO_CONTENT).json({ message: "stage all files success" });
  } catch (e) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "stage all files failed" });
  }
}

async function commit(req: Request, res: Response, next: NextFunction) {
  Logger.info("commit run");

  const {
    scenarioNameId,
    message,
    author,
  }: {
    scenarioNameId: string;
    message: string;
    author: {
      name: string;
      email: string;
    }
  } = req.body;

  try {
    await git.commit({
      fs,
      dir: getDefaultRepoDir(scenarioNameId),
      message,
      author,
    });

    res.status(HTTPStatusCode.NO_CONTENT).json({ message: "commit success" });
  } catch (e) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "commit failed" });
  }
}

async function stageAllAndCommit(req: Request, res: Response, next: NextFunction) {
  Logger.info("stageAllAndCommit run");

  const {
    scenarioNameId,
    message,
    author,
  }: {
    scenarioNameId: string;
    message: string;
    author: {
      name: string;
      email: string;
    }
  } = req.body;

  try {
    await git.add({
      fs,
      dir: getDefaultRepoDir(scenarioNameId),
      filepath: ".",
    });

    await git.commit({
      fs,
      dir: getDefaultRepoDir(scenarioNameId),
      message,
      author,
    });

    res.status(HTTPStatusCode.NO_CONTENT).json({ message: "stage and commit success" });
  } catch (e) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "stage and commit failed" });
  }
}

export default { initRepo, getRepoStatus, stageFile, stageAllFiles, stageAllAndCommit, commit };

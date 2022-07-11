import { NextFunction, Request, Response } from "express";
import Logger from "../utils/Logger";
import fs from "fs";
import git, { CallbackFsClient, PromiseFsClient, TreeEntry } from "isomorphic-git";
import path from "path";
import HTTPStatusCode from "../constants/HTTPStatusCode";
import { structuredPatch, ParsedDiff } from "diff";

function getDefaultRepoDir(folderName: string) {
  return path.join(process.cwd(), "repos", folderName);
}

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
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ fileName });
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

/* ==================================== */
// Following three functions (traverseCommit(), gitCommitDiff(), and commitStat()) are extracted from
// jcubic/git/js/main.js, and I've made a couple of optimisations for better compatibility with ES6 and TypeScript.
// Link to their repo: https://github.com/jcubic/git

async function traverseCommit({
  fs,
  dir,
  sha,
  callback = async () => {},
}: {
  fs: CallbackFsClient | PromiseFsClient,
  dir: string,
  sha: string,
  callback?: ({ entry, filepath, oid }: { entry: TreeEntry, filepath: string, oid: string }) => Promise<void>
}) {
  const repo = { fs, dir };
  const { commit: { tree } } = await git.readCommit({ ...repo, oid: sha });

  return await (async function readFiles(oid: string, path: string[]) {
    const { tree: entries } = await git.readTree({ ...repo, oid });

    for (const entry of entries) {
      if (entry) {
        if (entry.type === "blob") {
          const filepath = path.concat(entry.path).join("/");
          await callback({ entry, filepath, oid: entry.oid });
        } else if (entry.type === "tree" && entry.path !== ".git") {
          await readFiles(entry.oid, path.concat(entry.path));
        }
      }
    }

    return;
  })(tree, []);
}

async function gitCommitDiff({
  fs,
  dir,
  newSha,
  oldSha
}: {
  fs: CallbackFsClient | PromiseFsClient,
  dir: string,
  newSha: string,
  oldSha: string
}) {
  const result: {
    [filepath: string]: {
      added: boolean,
      deleted: boolean,
      oldFile: string,
      newFile: string,
      diff: ParsedDiff
    }
  } = {};

  function reader(name: "oldFile" | "newFile") {
    return async ({ filepath, oid }: { filepath: string, oid: string }) => {
      try {
        const { blob } = await git.readBlob({ fs, dir, oid });
        result[filepath] = result[filepath] || {};
        result[filepath][name] = Buffer.from(blob).toString("utf8");
      } catch (e) {
        // ignore missing file/object
      }
    };
  }

  await traverseCommit({ fs, dir, sha: oldSha, callback: reader("oldFile") });
  await traverseCommit({ fs, dir, sha: newSha, callback: reader("newFile") });

  Object.keys(result).forEach(key => {
    const diff = structuredPatch(key, key, result[key].oldFile || "", result[key].newFile || "");

    if (typeof result[key].oldFile === "undefined") {
      result[key].added = true;
    } else if (typeof result[key].newFile === "undefined") {
      result[key].deleted = true;
    } else if (!diff.hunks.length) {
      delete result[key];
    }

    if (diff.hunks.length) {
      result[key].diff = diff;
    }
  });

  return result;
}

function diffStats(diffs: ParsedDiff[]) {
  const modifications = diffs.reduce((acc: { minus: number; plus: number; }, { hunks }: ParsedDiff) => {
    for (const { lines } of hunks) {
      for (const [type] of lines) {
        if (type === "-") {
          acc.minus++;
        } else if (type === "+") {
          acc.plus++;
        }
      }
    }

    return acc;
  }, { plus: 0, minus: 0 });

  return { file: diffs.length, ...modifications };
}

/* ================================================================================================ */

async function commitAndRetrieveStats(
  dir: string,
  message: string,
  author: { name: string; email: string },
): Promise<{
  commitId: string,
  stats: { file: number; minus: number; plus: number }
}> {
  const head = await git.resolveRef({ fs, dir, ref: "HEAD" });
  const commitId = await git.commit({
    fs,
    dir,
    message,
    author,
  });

  const diffs = await gitCommitDiff({ fs, dir, newSha: commitId, oldSha: head });
  const stats = diffStats(Object.values(diffs).map(value => value.diff));

  return { commitId, stats };
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

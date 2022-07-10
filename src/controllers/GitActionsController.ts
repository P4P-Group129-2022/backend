import { NextFunction, Request, Response } from "express";
import Logger from "../utils/Logger";
import fs from "fs";
import git, { CallbackFsClient, PromiseFsClient, TreeEntry } from "isomorphic-git";
import path from "path";
import HTTPStatusCode from "../constants/HTTPStatusCode";
import { structuredPatch, ParsedDiff } from "diff";
import logger from "../utils/Logger";

function getDefaultRepoDir(folderName: string) {
  return path.join(process.cwd(), "repos", folderName);
}

async function getDiffBetweenLatestTwoCommits() {
  // Use git log to get the SHA-1 object ids of the previous two commits
  const commits = await git.log({ fs, dir: getDefaultRepoDir("test1"), depth: 2 });
  const oids = commits.map(commit => commit.oid);

  // Make TREE objects for the first and last commits
  const A = git.TREE({ ref: oids[0] });
  const B = git.TREE({ ref: oids[oids.length - 1] });

  // Get a list of the files that changed
  let changes = new Set();
  await git.walk({
    fs,
    dir: getDefaultRepoDir("test1"),
    trees: [A, B],
    map: async (filename, [A, B]) => {
      if (A === null || B === null) return;
      if (await A.type() === "tree") return;

      let Aoid = await A.oid();
      let Boid = await B.oid();

      // Skip pairs where the oids are the same
      if (Aoid === Boid) return;

      changes.add({
        fullpath: filename,
        A: Aoid,
        B: Boid,
        Achange: A.stat
      });
    }
  });

  console.log("changes", changes);
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

  // await getDiffBetweenLatestTwoCommits();

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

    res.sendStatus(HTTPStatusCode.NO_CONTENT);
  } catch (e) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ fileName });
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

    res.sendStatus(HTTPStatusCode.NO_CONTENT);
  } catch (e) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "stage all files failed", error: e });
  }
}

/* ============ Following lines are copied & modified from jcubic/git/main.js ============ */
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
    let i = 0;
    return (async function loop(): Promise<any> {
      const entry = entries[i++];
      if (entry) {
        if (entry.type == "blob") {
          const filepath = path.concat(entry.path).join("/");
          await callback({ entry, filepath, oid: entry.oid });
        } else if (entry.type == "tree" && entry.path !== ".git") {
          await readFiles(entry.oid, path.concat(entry.path));
        }
        return loop();
      }
    })();
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
        const { blob: pkg } = await git.readBlob({ fs, dir, oid });
        result[filepath] = result[filepath] || {};
        result[filepath][name] = Buffer.from(pkg).toString("utf8");
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

function diffStat(diffs: ParsedDiff[]) {
  const modifications = diffs.reduce((acc: { minus: number; plus: number; }, { hunks }: ParsedDiff) => {
    hunks.forEach(hunk => {
      hunk.lines.forEach((line) => {
        if (line[0] === "-") {
          acc.minus++;
        } else if (line[0] === "+") {
          acc.plus++;
        }
      });
    });
    return acc;
  }, { plus: 0, minus: 0 });

  const plural = (n: number) => n == 1 ? "" : "s";
  const stat = [" " + diffs.length + " file" + plural(diffs.length)];
  if (modifications.plus) {
    stat.push(`${modifications.plus} insertion${plural(modifications.plus)}(+)`);
  }
  if (modifications.minus) {
    stat.push(`${modifications.minus} deletions${plural(modifications.minus)}(-)`);
  }
  return stat.join(", ");
}

/* ================================================================================================ */

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

    const dir = getDefaultRepoDir(scenarioNameId);

    const head = await git.resolveRef({ fs, dir, ref: "HEAD" });
    const commitId = await git.commit({
      fs,
      dir,
      message,
      author,
    });

    // ============================================================ //
    const diffs = await gitCommitDiff({ fs, dir, newSha: commitId, oldSha: head });
    const stat = diffStat(Object.values(diffs).map(value => value.diff));
    console.log("stat:", stat);
    // ============================================================ //

    res.status(HTTPStatusCode.CREATED).json({ commitId });
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

    res.status(HTTPStatusCode.CREATED).json({ message: "stage and commit success" });
  } catch (e) {
    Logger.error(e);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).json({ message: "stage and commit failed" });
  }
}

export default { initRepo, getRepoStatus, stageFile, stageAllFiles, stageAllAndCommit, commit };

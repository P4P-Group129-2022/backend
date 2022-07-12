import git, { CallbackFsClient, PromiseFsClient, TreeEntry } from "isomorphic-git";
import { ParsedDiff, structuredPatch } from "diff";
import fs from "fs";

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

export { commitAndRetrieveStats };
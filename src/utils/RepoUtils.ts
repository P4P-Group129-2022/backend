import path from "path";

function getDefaultRepoDir(folderName: string) {
  return path.join(process.cwd(), "repos", folderName);
}

export { getDefaultRepoDir };
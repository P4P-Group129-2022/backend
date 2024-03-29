import { NextFunction, Request, Response } from "express";
import Logger from "../utils/Logger";
import fs from "fs";
import { getDefaultRepoDir } from "../utils/RepoUtils";
import HTTPStatusCode from "../constants/HTTPStatusCode";
import { File } from "../DTOs/ApiTypes";

async function retrieve(req: Request, res: Response, next: NextFunction) {
  Logger.info("retrieve run");

  const { username } = req.query;

  // For now just retrieve index.html in a repos/scenarioDefaults/{scenarioId} directory,
  const dir = getDefaultRepoDir(String(username));
  const content = await fs.promises.readFile(`${dir}/index.html`, "utf8");
  const response: File[] = [{
    name: "index.html",
    isFolder: false,
    contents: content
  }];

  res.status(HTTPStatusCode.OK).json(response);
}

async function modify(req: Request, res: Response, next: NextFunction) {
  Logger.info("modify run");

  const { username, content } = req.body;

  const dir = getDefaultRepoDir(username);

  try {
    await fs.promises.writeFile(`${dir}/index.html`, content);
    res.sendStatus(HTTPStatusCode.NO_CONTENT);
  } catch (err) {
    res.sendStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR);
  }
}

export default { retrieve, modify };
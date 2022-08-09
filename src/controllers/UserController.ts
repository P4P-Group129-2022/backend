import { NextFunction, Request, Response } from "express";
import User from "../models/User";
import HTTPStatusCode from "../constants/HTTPStatusCode";
import Logger from "../utils/Logger";

/**
 * This file contains controller methods for the User model.
 */

/**
 * Retrieves an user given their GitHub username.
 * @param req
 * @param res
 * @param next
 */
const getUserByGitHubUsername = async (req: Request, res: Response, next: NextFunction) => {
  const { gitHubUsername } = req.params;

  const userFromDB = await User.findOne({ gitHubUsername });

  if (userFromDB === null) {
    res.status(404).send("User with GitHub username: " + gitHubUsername + " not found");
    return;
  }

  return res.status(200).json({ userFromDB });
};

/**
 * Retrieves an user given their GitHub username.
 * @param req
 * @param res
 * @param next
 */
const getUserByEmail = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.params;

  const userFromDB = await User.findOne({ email });

  if (userFromDB === null) {
    res.status(404).send("User with email: " + email + " not found");
    return;
  }

  return res.status(HTTPStatusCode.OK).json({ userFromDB });
};

const completePreTest = async (req: Request, res: Response, next: NextFunction) => {
  const { gitHubUsername } = req.params;

  const userFromDB = await User.findOne({ gitHubUsername });

  if (userFromDB === null) {
    res.status(404).send("User with GitHub username: " + gitHubUsername + " not found");
    return;
  }

  userFromDB.completedPreTest = true;
  await userFromDB.save();

  return res.status(HTTPStatusCode.OK).json({ userFromDB });
};

const updateCurrentScenario = async (req: Request, res: Response, next: NextFunction) => {
  const { gitHubUsername, currentScenario } = req.params;

  const userFromDB = await User.findOne({ gitHubUsername });

  if (userFromDB === null) {
    res.status(404).send("User with GitHub username: " + gitHubUsername + " not found");
    return;
  }

  userFromDB.currentScenario = parseInt(currentScenario);
  await userFromDB.save();

  return res.status(HTTPStatusCode.OK).json({ userFromDB });
};

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const {
    githubUsername,
    email,
    displayName
  }: { githubUsername: string, email: string, displayName: string } = req.body;

  Logger.info(githubUsername);
  Logger.info(email);
  Logger.info(displayName);

  const userFromDB = await User.findOne({ githubUsername });

  Logger.info(`user ${JSON.stringify(userFromDB)}`);

  if (userFromDB !== null) {
    res.status(HTTPStatusCode.CREATED).json({ userFromDB });
    return;
  }

  const user = new User({
    githubUsername,
    email,
    displayName,
    completedPreTest: false,
    currentScenario: 0,
  });
  await user.save();

  return res.status(HTTPStatusCode.CREATED).json({ user });
};

export default {
  getUserByGitHubUsername,
  getUserByEmail,
  completePreTest,
  updateCurrentScenario,
  createUser,
};
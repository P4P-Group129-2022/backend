import {NextFunction, Request, Response} from 'express';
import User from "../models/User";
import mongoose from "mongoose";
import HTTPStatusCode from "../constants/HTTPStatusCode";

/**
 * This file contains controller methods for the User model.
 */

/**
 * Create an user given their GitHub username and email.
 * @param req
 * @param res
 * @param next
 */
const createUser = async (req: Request, res: Response, next: NextFunction) => {
    const {username, email, name, avatarUrl, completedPreTest, currentScenario} = req.body;

    const userFromDB = await User.findOne({githubUsername: username});
    if (!userFromDB) {
        const newUser = new User({
            _id: new mongoose.Types.ObjectId(),
            username,
            email,
            name,
            avatarUrl,
            completedPreTest,
            currentScenario,
        });

        return newUser.save()
            .then(() => res.status(201).json({newUser}))
            .catch((error: Error) => res.status(500).json({error}));
    }
    return res.status(HTTPStatusCode.CONFLICT).send("User creation in db failed due to the provided username " +
        "already existing in the database");
};

/**
 * Retrieves an user given their GitHub username.
 * @param req
 * @param res
 * @param next
 */
const getUserByGitHubUsername = async (req: Request, res: Response, next: NextFunction) => {
    const {gitHubUsername} = req.params;

    const userFromDB = await User.findOne({gitHubUsername});

    if (userFromDB === null) {
        res.status(404).send("User with GitHub username: " + gitHubUsername + " not found");
        return;
    }

    return res.status(200).json({userFromDB});
};

export default {
    createUser,
    getUserByGitHubUsername,
};
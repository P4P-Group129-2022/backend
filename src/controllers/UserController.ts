import {NextFunction, Request, Response} from 'express';
import User from "../models/User";
import mongoose from "mongoose";

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
    const { username, email } = req.body;
    const completedPreTest = false;
    const currentScenario = 0;

    const newUser = new User({
        _id : new mongoose.Types.ObjectId(),
        username,
        completedPreTest,
        currentScenario,
    });

    return newUser.save()
        .then(() => res.status(201).json({ newUser }))
        .catch((error: Error) => res.status(500).json({ error }));
};

/**
 * Retrieves an user given their GitHub username.
 * @param req
 * @param res
 * @param next
 */
const getUserByGitHubUsername = async (req: Request, res: Response, next: NextFunction) => {
    const { gitHubUsername } = req.params;

    const userFromDB = await User.findOne({gitHubUsername});

    if (userFromDB === null) {
        res.status(404).send("User with GitHub username: " + gitHubUsername + " not found");
        return;
    }

    return res.status(200).json({userFromDB});
};

/**
 * Retrieves an user given their GitHub username.
 * @param req
 * @param res
 * @param next
 */
const getUserByEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.params;

    const userFromDB = await User.findOne({email});

    if (userFromDB === null) {
        res.status(404).send("User with email: " + email + " not found");
        return;
    }

    return res.status(200).json({userFromDB});
};

export default {
    createUser,
    getUserByGitHubUsername,
    getUserByEmail,
};
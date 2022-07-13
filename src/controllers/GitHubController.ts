import { NextFunction, Request, Response } from "express";
import HTTPStatusCode from "../constants/HTTPStatusCode";
import { Octokit } from "@octokit/rest";
import GitHubDetails from "../models/GitHubDetails";
import logger from "../utils/Logger";

/**
 * This file contains controller methods for the GitHub related actions.
 */

/**
 * Retrieves a colleague given their nameId.
 * @param req
 * @param res
 * @param next
 */
async function checkPR(req: Request, res: Response, next: NextFunction) {
    const {pullNumber} = req.params;

    const gitHubDetailsFromDB = await GitHubDetails.findOne({});

    if (gitHubDetailsFromDB === null) {
        res.status(404).send('There were problems with the existing GitHub details.');
        return;
    }

    const octokit = new Octokit();
    const { data: pullRequest } = await octokit.rest.pulls.get({
        owner: gitHubDetailsFromDB.owner,
        repo: gitHubDetailsFromDB.repo,
        pull_number: parseInt(pullNumber),
    });

    if (pullRequest === null) {
        res.status(HTTPStatusCode.NOT_FOUND)
            .send('PR with the pull request number ' + pullNumber + ' was not found.');
        return;
    }

    const isPRmade = true;
    return res.status(HTTPStatusCode.OK).json({isPRmade});
}

/**
 * Update the GitHub details.
 * @param req
 * @param res
 * @param next
 */
async function updateGitHubDetails(req: Request, res: Response, next: NextFunction) {
    const {owner, repo} = req.params;

    const gitHubDetailsFromDB = await GitHubDetails.findOne({});

    if (gitHubDetailsFromDB === null) {
        res.status(404).send('There were problems with the existing GitHub details.');
        return;
    }

    gitHubDetailsFromDB.owner = owner;
    gitHubDetailsFromDB.repo = repo;

    await gitHubDetailsFromDB.save();

    return res.status(HTTPStatusCode.OK).json({gitHubDetailsFromDB});
}

/**
 * Invites the user to our organization.
 * @param req
 * @param res
 * @param next
 */
async function inviteToOrganization(req: Request, res: Response, next: NextFunction) {
    const {username} = req.params;
    const ORGANIZATION_OWNER_PAT = process.env.ORGANIZATION_OWNER_PAT || "";
    const octokit = new Octokit({
        auth: ORGANIZATION_OWNER_PAT,
    });

    await octokit.repos.addCollaborator({
        owner: "P4P-Group129-2022",
        repo: "backend",
        username: username,
        permission: "push",
    }).catch((msg: any) => {
        logger.error(`Error message: ${msg}`);
        return;
    });

    return res.status(HTTPStatusCode.OK).json("Invitation sent.");
}

export default { checkPR, updateGitHubDetails, inviteToOrganization };

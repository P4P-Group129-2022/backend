import {NextFunction, Request, Response} from "express";
import HTTPStatusCode from "../constants/HTTPStatusCode";
import {Octokit} from "@octokit/rest";
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
        res.status(HTTPStatusCode.NOT_FOUND).send('There were problems with the existing GitHub details.');
        return;
    }

    const octokit = new Octokit();
    const {data: pullRequest} = await octokit.rest.pulls.get({
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
        res.status(HTTPStatusCode.NOT_FOUND).send('There were problems with the existing GitHub details.');
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
    const ORGANIZATION_NAME = "P4P-Group129-2022";
    const REPO_CREATION_DELAY = 3000;

    const octokit = new Octokit({
        auth: ORGANIZATION_OWNER_PAT,
    });
    const repos = await octokit.repos.listForOrg({
        org: ORGANIZATION_NAME,
    })
    if (!repos.data.map((repo) => repo.name).includes(username)) {
        await createRepo(octokit, ORGANIZATION_NAME, username);
    }
    console.log("Creating a new repo for the user...");
    setTimeout(function() {
    }, REPO_CREATION_DELAY);

    await octokit.repos.addCollaborator({
        owner: ORGANIZATION_NAME,
        repo: username,
        username: username,
        permission: "push",
    }).catch((msg: any) => {
        logger.error(`Error message: ${msg}`);
        return;
    });

    return res.status(HTTPStatusCode.OK).json("Invitation sent.");
}

/**
 * Create a new repo in our organization for the user.
 * @param octokit
 * @param org
 * @param name
 */
const createRepo = async (octokit: Octokit, org: string, name: string) => {
    await octokit.repos.createInOrg({org, name, auto_init: true})
}

export default {checkPR, updateGitHubDetails, inviteToOrganization};

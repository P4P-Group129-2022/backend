import { NextFunction, Request, Response } from "express";
import HTTPStatusCode from "../constants/HTTPStatusCode";
import { Octokit } from "@octokit/rest";

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

    const octokit = new Octokit();
    const { data: pullRequest } = await octokit.rest.pulls.get({
        owner: "hiin3d55",
        repo: "octokit-playaround",
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

export default { checkPR };

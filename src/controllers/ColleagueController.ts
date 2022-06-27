import { NextFunction, Request, Response } from 'express';
import Colleague from "../models/Colleague";

/**
 * This file contains controller methods for the Colleague model.
 */

/**
 * Retrieves a colleague given their name.
 * @param req
 * @param res
 * @param next
 */
const getColleague = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const colleagueFromDB = await Colleague.findById(req);

    if (colleagueFromDB === null) {
        res.status(404).send('Colleague not found');
        return;
    }

    return res.status(200).json({ colleagueFromDB });
};

export default {
    getColleague,
};
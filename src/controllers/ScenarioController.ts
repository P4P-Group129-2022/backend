import { NextFunction, Request, Response } from 'express';
import Scenario from "../models/Scenario";

/**
 * This file contains controller methods for the Scenario model.
 */

/**
 * Retrieves a scenario given their nameId.
 * @param req
 * @param res
 * @param next
 */
const getScenarioByNameId = async (req: Request, res: Response, next: NextFunction) => {
    const { nameId } = req.params;
    const scenarioFromDB = await Scenario
      .findOne({nameId})
      .populate('segments.chats')
      .populate('segments.notifications');

    if (scenarioFromDB === null) {
        res.status(404).send('Scenario not found');
        return;
    }

    return res.status(200).json({ scenarioFromDB });
};

export default {
    getScenarioByNameId,
};
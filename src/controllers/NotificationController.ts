import { NextFunction, Request, Response } from 'express';
import Notification from "../models/Notification";

/**
 * This file contains controller methods for the Notification model.
 */

/**
 * Retrieves a notification given their name.
 * @param req
 * @param res
 * @param next
 */
const getNotificationByName = async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;
    const notificationFromDB = await Notification.find({name});

    if (notificationFromDB === null) {
        res.status(404).send('Notification not found');
        return;
    }

    return res.status(200).json({ notificationFromDB });
};

export default {
    getNotificationByName,
};
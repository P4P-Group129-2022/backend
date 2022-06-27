import { NextFunction, Request, Response } from 'express';
import Notification from "../models/Notification";

/**
 * This file contains controller methods for the Notification model.
 */

/**
 * Retrieves a notification given their id.
 * @param req
 * @param res
 * @param next
 */
const getNotification = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const notificationFromDB = await Notification.findById(id);

    if (notificationFromDB === null) {
        res.status(404).send('Notification not found');
        return;
    }

    return res.status(200).json({ notificationFromDB });
};

export default {
    getNotification,
};
import { NextFunction, Request, Response } from 'express';
import Message from "../models/Message";

/**
 * This file contains controller methods for the Message model.
 */

/**
 * Retrieves a message given their id.
 * @param req
 * @param res
 * @param next
 */
const getMessage = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const messageFromDB = await Message.findById(id);

    if (messageFromDB === null) {
        res.status(404).send('Message not found');
        return;
    }

    return res.status(200).json({ messageFromDB });
};

export default {
    getMessage,
};
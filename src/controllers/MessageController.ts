import { NextFunction, Request, Response } from 'express';
import Message from "../models/Message";

/**
 * This file contains controller methods for the Message model.
 */

/**
 * Retrieves a message given their nameId.
 * @param req
 * @param res
 * @param next
 */
const getMessageByNameId = async (req: Request, res: Response, next: NextFunction) => {
    const { nameId } = req.params;

    const messageFromDB = await Message.find({nameId});

    if (messageFromDB === null) {
        res.status(404).send('Message not found');
        return;
    }

    return res.status(200).json({ messageFromDB });
};

export default {
    getMessageByNameId,
};
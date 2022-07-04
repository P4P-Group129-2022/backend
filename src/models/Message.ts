import mongoose, {Document, Schema} from 'mongoose';
import {Colleague} from "../DTOs/ApiTypes";

/**
 * Message model containing the content of the message.
 */
export interface IMessage {
    nameId: string,
    sender: Colleague,
    content: string;
}

export interface IMessageModel extends IMessage, Document {
}

const MessageSchema: Schema = new Schema(
    {
        nameId: {type: String, required: true},
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Colleague"
        },
        content: {type: String, required: true},
    }
);

export default mongoose.model<IMessageModel>('Message', MessageSchema);
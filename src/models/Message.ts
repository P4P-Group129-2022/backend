import mongoose, {Document, Schema} from 'mongoose';

/**
 * Message model containing the content of the message.
 */
export interface IMessage {
    content: string;
}

export interface IMessageModel extends IMessage, Document {
}

const MessageSchema: Schema = new Schema(
    {
        content: {type: String, required: true},
    }
);

export default mongoose.model<IMessageModel>('Message', MessageSchema);
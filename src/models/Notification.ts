import mongoose, {Document, Schema} from 'mongoose';

/**
 * Notification model containing the name and url of the profile img.
 */
export interface INotification {
    title: string;
    message: string;
    imageSrc: string;
}

export interface INotificationModel extends INotification, Document {
}

const NotificationSchema: Schema = new Schema(
    {
        title: {type: String, required: true},
        message: {type: String, required: true},
        imageSrc: {type: String, required: true},
    }
);

export default mongoose.model<INotificationModel>('Notification', NotificationSchema);
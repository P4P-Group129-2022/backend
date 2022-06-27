import mongoose, {Document, Schema} from 'mongoose';

/**
 * Notification model containing the name and url of the profile img.
 */
export interface INotification {
    header: string;
    body: string;
    iconImageUrl: string;
}

export interface INotificationModel extends INotification, Document {
}

const NotificationSchema: Schema = new Schema(
    {
        header: {type: String, required: true},
        body: {type: String, required: true},
        iconImageUrl: {type: String, required: true},
    }
);

export default mongoose.model<INotificationModel>('Notification', NotificationSchema);
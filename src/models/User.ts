import mongoose, {Document, Schema} from 'mongoose';

/**
 * Model class for user that will be using this tool.
 */
export interface IUser {
    username: string;
    email: string,
    name: string,
    avatarUrl: string,
    completedPreTest: boolean;
    currentScenario: number;
}

export interface IUserModel extends IUser, Document {
}

const UserSchema: Schema = new Schema(
    {
        username: {type: String, required: true, unique: true},
        email: {type: String},
        name: {type: String},
        avatarUrl: {type: String},
        completedPreTest: {type: Boolean, required: true},
        currentScenario: {type: Number, required: true},
    });

export default mongoose.model<IUserModel>('User', UserSchema);
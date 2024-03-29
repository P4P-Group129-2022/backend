import mongoose, { Document, Schema } from "mongoose";

/**
 * Model class for user that will be using this tool.
 */
export interface IUser {
  githubUsername: string;
  email: string;
  displayName: string;
  completedPreTest: boolean;
}

export interface IUserModel extends IUser, Document {
}

const UserSchema: Schema = new Schema(
  {
    githubUsername: { type: String, required: true },
    email: { type: String, required: true },
    displayName: { type: String, required: true },
    completedPreTest: { type: Boolean, required: true },
  });

export default mongoose.model<IUserModel>("User", UserSchema);
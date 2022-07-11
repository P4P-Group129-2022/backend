import mongoose, {Document, Schema} from 'mongoose';

/**
 * GitHubDetails model containing the username of the owner and name of the repo.
 */
export interface IGitHubDetails {
    owner: string,
    repo: string;
}

export interface IGitHubDetailsModel extends IGitHubDetails, Document {
}

const GitHubDetailsSchema: Schema = new Schema(
    {
        owner: {type: String},
        repo: {type: String},
    }
);

export default mongoose.model<IGitHubDetailsModel>('GitHubDetails', GitHubDetailsSchema);
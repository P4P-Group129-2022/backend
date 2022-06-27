import mongoose, {Document, Schema} from 'mongoose';

/**
 * Colleague model containing the name and url of the profile img.
 */
export interface IColleague {
    name: string;
    profileImgUrl: string;
}

export interface IColleagueModel extends IColleague, Document {
}

const ColleagueSchema: Schema = new Schema(
    {
        name: {type: String, required: true},
        profileImgUrl: {type: String, required: true},
    }
);

export default mongoose.model<IColleagueModel>('Colleague', ColleagueSchema);
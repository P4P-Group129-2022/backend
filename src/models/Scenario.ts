import mongoose, {Document, Schema} from 'mongoose';
import Message from "./Message";
import {ScenarioSegment} from "../DTOs/ApiTypes";

/**
 * Model class for scenario.
 */
export interface IScenario {
    // nameId: string;
    // name: string;
    // segment: ScenarioSegment[];
}

export interface IScenarioModel extends IScenario, Document {
}

const ScenarioSchema: Schema = new Schema(
    {
        nameId: {type: String, required: true, unique: true},
        name: {type: String, required: true},
        segments: [
            {
                chats: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Colleague",
                    },
                ],
                notifications: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Notification",
                    }
                ],
                endRepoId: {type: Number, required: true},
            }
        ]
    });

export default mongoose.model<IScenarioModel>('Scenario', ScenarioSchema);
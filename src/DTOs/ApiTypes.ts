import mongoose from "mongoose";

/**
 * This file contains the types used by the controllers when sending and receiving data.
 */
export type Colleague = {
    nameId: string,
    name: string;
    profileImgUrl: string;
}

export type Message = {
    nameId: string,
    sender: Colleague,
    content: string;
}

export type Notification = {
    title: string;
    message: string;
    imageSrc: string;
}

export type ScenarioSegment = {
    chats: mongoose.Schema.Types.ObjectId[],
    notifications: mongoose.Schema.Types.ObjectId[];
    endRepoId: number;
}

export type File = {
    name: string;
    isFolder: boolean;
    contents?: string;
    folderContents?: File[];
}
import { Document, ObjectId } from "mongoose";

export interface IPost {
  _id: string;
  userId: string;
  content: string;
  postedAt?: Date;
  media: IMediaDocument[];
  likes: string[];
}

export interface IMedia {
  _id: string;
  postId: string;
  type: string;
  URL: string;
}

export interface IComment {
  _id: string;
  userId: string;
  postId: string;
  content: string;
  media: string[];
  createdAt: Date;
}

export interface ICreatePost extends Omit<IPost, "_id" | "likes" | "media"> {
  media: ICreateMedia[];
}
export interface ICreateMedia extends Omit<IMedia, "_id"> {}
export interface ICreateComment extends Omit<IComment, "_id"> {}

export interface IPostDocument extends Omit<IPost, "_id" | "userId" | "likes"> {
  _id: ObjectId;
  userId: ObjectId;
  likes: ObjectId[];
}

export interface IMediaDocument extends Omit<IMedia, "_id" | "postId"> {
  _id: ObjectId;
  postId: ObjectId;
}

export interface ICommentDocument
  extends Omit<IComment, "_id" | "userId" | "postId" | "media"> {
  _id: ObjectId;
  userId: ObjectId;
  postId: ObjectId;
  media: ObjectId[];
}

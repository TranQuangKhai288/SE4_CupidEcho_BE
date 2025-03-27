import mongoose, { ObjectId, Document } from "mongoose";

export interface INotification extends Document {
  userId: string;
  type: string;
  content: string;
  isRead: boolean;
  link?: string;
  createdAt?: Date;
}

export interface INotificationDocument extends Omit<INotification, "userId"> {
  userId: ObjectId;
}

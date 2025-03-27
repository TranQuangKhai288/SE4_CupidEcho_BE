import { Document, ObjectId } from "mongoose";

export interface IConversation extends Document {
  participants: string[]; // Chuẩn hóa thành string[]
  createdAt: Date; // Không optional vì timestamps: true
  updatedAt: Date; // Không optional vì timestamps: true
  lastMessage?: string; // Chuẩn hóa thành string
}

export interface IMessage extends Document {
  _id: string; // Chỉ dùng string
  conversationId: string; // Chỉ dùng string
  senderId: string; // Chỉ dùng string
  content: string;
  isRead: boolean;
  createdAt: Date; // Không optional vì timestamps: { createdAt: true }
  updatedAt?: never; // Không có updatedAt trong schema
}

export interface IMessageDocument
  extends Omit<IMessage, "_id" | "conversationId" | "senderId"> {
  _id: ObjectId;
  conversationId: ObjectId;
  senderId: ObjectId;
}

export interface ICreateMessage
  extends Omit<IMessage, "_id" | "isRead" | "createdAt"> {}

import mongoose, { Schema } from "mongoose";
import {
  IMessage,
  IMessageDocument,
} from "../interfaces/conversation.interface";

const messageSchema = new Schema<IMessageDocument>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toObject: {
      transform: (doc, ret) => {
        ret._id = ret._id.toString();
        ret.conversationId = ret.conversationId.toString();
        ret.senderId = ret.senderId.toString();
        return ret as IMessage; // Ép kiểu về IMessage
      },
    },
    toJSON: {
      transform: (doc, ret) => {
        ret._id = ret._id.toString();
        ret.conversationId = ret.conversationId.toString();
        ret.senderId = ret.senderId.toString();
        return ret as IMessage; // Ép kiểu về IMessage
      },
    },
  }
);

const Message = mongoose.model<IMessageDocument>("Message", messageSchema);
export default Message;

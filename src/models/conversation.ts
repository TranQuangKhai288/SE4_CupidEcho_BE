import mongoose, { Schema } from "mongoose";
import { IConversation } from "../interfaces/conversation.interface";

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
  },
  {
    timestamps: true,
    toObject: {
      transform: (doc, ret) => {
        ret.participants = ret.participants.map((id: mongoose.Types.ObjectId) =>
          id.toString()
        );
        if (ret.lastMessage) {
          ret.lastMessage = ret.lastMessage.toString();
        }
        return ret as IConversation; // Ép kiểu về IConversation
      },
    },
    toJSON: {
      transform: (doc, ret) => {
        ret.participants = ret.participants.map((id: mongoose.Types.ObjectId) =>
          id.toString()
        );
        if (ret.lastMessage) {
          ret.lastMessage = ret.lastMessage.toString();
        }
        return ret as IConversation; // Ép kiểu về IConversation
      },
    },
  }
);

const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);
export default Conversation;

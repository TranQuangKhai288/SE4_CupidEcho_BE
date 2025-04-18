import { IUser } from "../interfaces/user.interface";
import { ObjectId } from "mongoose";
import {
  IMessageRepository,
  IConversationRepository,
} from "../repositories/interfaces";
import { ICreateMessage, IMessage } from "../interfaces/conversation.interface";

class MessageService {
  constructor(
    private messageRepository: IMessageRepository,
    private convRepository: IConversationRepository
  ) {}

  async getMessagesInConversation(
    convId: string,
    userId: string,
    page: number,
    limit: number
  ): Promise<any> {
    try {
      // check is conversation exist
      const conversation = await this.convRepository.findById(convId);
      if (!conversation) {
        return "Conversation not found";
      }
      console.log(conversation, "conversation");
      // check is user in conversation
      if (
        !conversation.participants.some(
          (participant: string | ObjectId) =>
            participant.toString() === userId.toString()
        )
      ) {
        return "User not in conversation";
      }

      const result = await this.messageRepository.findAllByConversation(
        convId,
        page,
        limit
      );
      return result;
    } catch (e) {
      console.log(
        e,
        "Lỗi khi lấy danh sách tin nhắn getMessagesInConversation"
      );
      return "Lỗi khi lấy danh sách tin nhắn";
    }
  }

  async createMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<any> {
    try {
      const conversation = await this.convRepository.findById(conversationId);
      if (!conversation) {
        return "Conversation not found";
      }

      if (
        !conversation.participants.some(
          (participant: string) =>
            participant.toString() === senderId.toString()
        )
      ) {
        return "User not in conversation";
      }

      const message = await this.messageRepository.create({
        conversationId,
        senderId,
        content,
      } as ICreateMessage);
      return message;
    } catch (e) {
      console.log(e, "Error when creating message");
      return "Error when creating message";
    }
  }
}

export default MessageService;

import { Message, Conversation } from "../../models";
import {
  IMessage,
  IConversation,
  ICreateMessage,
} from "../../interfaces/conversation.interface";
import { IMessageRepository } from "../interfaces";

export class MessageMongoRepository implements IMessageRepository {
  async create(message: ICreateMessage): Promise<IMessage> {
    // Tạo message mới
    try {
      const createdMessage = await Message.create(message);
      //cập nhật lastMessage của conversation
      await Conversation.findByIdAndUpdate(message.conversationId, {
        lastMessage: createdMessage._id,
      });
      return createdMessage.toObject() as unknown as IMessage;
    } catch (error) {
      throw new Error("Error when creating message");
    }
  }

  async findAllByConversation(
    conversationId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<{
    messages: IMessage[];
    pagination: { page: number; limit: number };
  }> {
    // Tìm conversation theo ID
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return { messages: [], pagination: { page, limit } };
    }

    // Tìm message theo conversation
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      messages: messages.map(
        (message) => message.toObject() as unknown as IMessage
      ),
      pagination: { page, limit },
    };
  }

  async update(id: string, data: Partial<IMessage>): Promise<IMessage | null> {
    throw new Error("Method not implemented.");
  }
  async delete(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  // Tìm conversation theo ID
  async findById(id: string): Promise<IMessage | null> {
    const message = await Message.findById(id);
    return message ? (message.toObject() as unknown as IMessage) : null;
  }
}

export default new MessageMongoRepository();

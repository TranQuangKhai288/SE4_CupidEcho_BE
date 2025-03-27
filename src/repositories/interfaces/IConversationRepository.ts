import {
  IConversation,
  IMessage,
  ICreateMessage,
} from "../../interfaces/conversation.interface";
import { ObjectId } from "mongoose";

export interface IConversationRepository {
  // Tìm conversation theo ID
  findById(id: string): Promise<IConversation | null>;

  // Tìm conversation theo danh sách người tham gia
  findByParticipants(
    participants: (string | ObjectId)[]
  ): Promise<IConversation | null>;

  // Lấy danh sách conversation của một người dùng, có phân trang
  findAllByUser(
    userId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<{
    conversations: IConversation[];
    pagination: { page: number; limit: number };
  }>;

  // Tạo một conversation mới
  create(conversation: IConversation): Promise<IConversation>;

  // Cập nhật thông tin conversation
  update(
    id: string,
    data: Partial<IConversation>
  ): Promise<IConversation | null>;

  // Xóa một conversation
  delete(id: string): Promise<void>;
}

export interface IMessageRepository {
  // Tìm message theo ID
  findById(id: string): Promise<IMessage | null>;

  // Lấy danh sách message của một conversation, có phân trang
  findAllByConversation(
    conversationId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<{
    messages: IMessage[];
    pagination: { page: number; limit: number };
  }>;

  // Tạo một message mới
  create(message: ICreateMessage): Promise<IMessage>;

  // Cập nhật thông tin message
  update(id: string, data: Partial<IMessage>): Promise<IMessage | null>;

  // Xóa một message
  delete(id: string): Promise<void>;
}

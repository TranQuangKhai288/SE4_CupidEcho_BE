import { ObjectId } from "mongoose";
import { IConversation } from "../interfaces/conversation.interface";
import { IConversationRepository } from "../repositories/interfaces";

class ConversationService {
  constructor(private conRepository: IConversationRepository) {}
  async accessConversation(
    data: Partial<IConversation>
  ): Promise<IConversation | string> {
    if (!data.participants || data.participants.length < 2) {
      return "Conversation must have at least 2 participants";
    }
    const existingConversation = await this.conRepository.findByParticipants(
      data.participants as unknown as (string | ObjectId)[]
    );

    if (existingConversation) {
      return existingConversation;
    }
    return await this.conRepository.create(data as IConversation);
  }

  async getConversationById(id: string): Promise<any> {
    try {
      const conv = await this.conRepository.findById(id);
      return conv;
    } catch (e) {
      console.error(e, "Lỗi khi lấy thông tin cuộc trò chuyện");
      throw new Error("Lỗi khi lấy thông tin cuộc trò chuyện");
    }
  }

  async getConversationsByUser(
    userId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<any> {
    try {
      const result = await this.conRepository.findAllByUser(
        userId,
        page,
        limit,
        search
      );

      return result;
    } catch (e) {
      console.error(e, "Lỗi khi lấy danh sách cuộc trò chuyện");
      throw new Error("Lỗi khi lấy danh sách cuộc trò chuyện");
    }
  }

  async updateConversation(
    id: string,
    data: Partial<IConversation>
  ): Promise<any> {
    try {
      const updatedConv = await this.conRepository.update(id, data);
      return updatedConv;
    } catch (e) {
      console.error(e, "Lỗi khi cập nhật cuộc trò chuyện");
      throw new Error("Lỗi khi cập nhật cuộc trò chuyện");
    }
  }

  async deleteConversation(id: string, userId: string): Promise<any> {
    try {
      // Check if the conversation exists
      const conversation = await this.conRepository.findById(id);
      if (!conversation) {
        return "Conversation not found";
      }
      // Check if the user is in the conversation
      if (
        !conversation.participants.map((p) => p.toString()).includes(userId)
      ) {
        return "User is not in the conversation";
      }
      await this.conRepository.delete(id);
    } catch (e) {
      console.error(e, "Lỗi khi xóa cuộc trò chuyện");
      throw new Error("Lỗi khi xóa cuộc trò chuyện");
    }
  }
}

export default ConversationService;

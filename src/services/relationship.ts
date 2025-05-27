import { IRelationship } from "../interfaces/relationship.interface";
import { IRelationshipRepository } from "../repositories/interfaces";
type RelationshipStatus = "pending" | "accepted" | "rejected" | "ignored";

class RelationshipService {
  constructor(private relationshipRepository: IRelationshipRepository) {}

  async createRelationshipRequest(
    senderId: string,
    receiverId: string,
    type: string,
    status: RelationshipStatus
  ): Promise<any> {
    try {
      const existingRequest = await this.relationshipRepository.findByUsers(
        senderId,
        receiverId
      );
      if (existingRequest) {
        return "2 người đã có mối quan hệ";
      }

      if (senderId === receiverId) {
        return "Không thể gửi yêu cầu cho chính mình";
      }

      //check type
      if (type !== "friend-request" && type !== "crush" && type !== "block") {
        return "Loại tương tác không hợp lệ";
      }
      if (
        !["pending", "accepted", "rejected", "ignored"].includes(status) ||
        !status
      ) {
        return "Status không hợp lệ";
      }

      const newRequest: IRelationship = {
        senderId,
        receiverId,
        type: type,
        status: status,
        createdAt: new Date(),
      };

      const createdRequest = await this.relationshipRepository.create(
        newRequest
      );
      return createdRequest;
    } catch (e) {
      console.log(e, "Lỗi khi gửi yêu cầu");
      return "Lỗi khi gửi yêu cầu";
    }
  }

  async changeRelationshipRequest(
    pendingId: string,
    status: RelationshipStatus
  ): Promise<any> {
    try {
      const request = await this.relationshipRepository.findById(pendingId);
      if (!request) {
        return "Yêu cầu cho mối quan hệ không tồn tại";
      }

      if (request.status !== "pending") {
        return "Yêu cầu cho mối quan hệ không ở trạng thái chờ xử lý";
      }

      const updatedRequest = await this.relationshipRepository.update(
        pendingId,
        { status: status }
      );
      return updatedRequest;
    } catch (e) {
      console.log(e, "Lỗi khi chấp nhận cho mối quan hệ");
      return "Lỗi khi chấp nhận cho mối quan hệ";
    }
  }

  async rejectRelationshipRequest(pendingId: string): Promise<any> {
    try {
      const request = await this.relationshipRepository.findById(pendingId);
      if (!request) {
        return "Yêu cầu cho mối quan hệ không tồn tại";
      }

      if (request.status !== "pending") {
        return "Yêu cầu cho mối quan hệ không ở trạng thái chờ xử lý";
      }

      await this.relationshipRepository.delete(pendingId);
      return { message: "Yêu cầu cho mối quan hệ đã được từ chối và xóa" };
    } catch (e) {
      console.log(e, "Lỗi khi từ chối yêu cầu mối quan hệ");
      return "Lỗi khi từ chối yêu cầu mối quan hệ";
    }
  }

  async getAllRelationships(
    direction: "sent" | "received" | "both",
    userId: string,
    type: string,
    status: string,
    page: number,
    limit: number
  ): Promise<any> {
    try {
      //check type:
      // if (type === "crush") {
      //   //cơ chế nạp tiền mới được xem crush
      //   return "Bạn cần có Cupid Premium để xem ai đang crush bạn";
      // }
      if (status && status === "accepted") {
        console.log("page", page);
        console.log("limit", limit);
        const requests = await this.relationshipRepository.findAcceptedByUserId(
          userId,
          type,
          Number(page),
          Number(limit)
        );
        return requests;
      }

      if (direction === "received") {
        console.log("page", page);
        console.log("limit", limit);
        const requests =
          await this.relationshipRepository.findPendingByReceiver(
            userId,
            type,
            Number(page),
            Number(limit)
          );
        return requests;
      }
      if (direction === "sent") {
        console.log("page", page);
        console.log("limit", limit);
        const requests = await this.relationshipRepository.findBySender(
          userId,
          type,
          Number(page),
          Number(limit)
        );
        return requests;
      }
    } catch (e) {
      console.log(e, "Lỗi khi lấy danh sách yêu cầu");
      return "Lỗi khi lấy danh sách yêu cầu";
    }
  }

  async checkRelationshipStatus(
    requesterId: string,
    targetUserId: string
  ): Promise<any> {
    try {
      const request = await this.relationshipRepository.findByUsers(
        requesterId,
        targetUserId
      );
      if (!request) {
        return { status: "none" };
      }

      return { type: request.type, status: request.status };
    } catch (e) {
      console.log(e, "Lỗi khi kiểm tra trạng thái bạn bè");
      return "Lỗi khi kiểm tra trạng thái bạn bè";
    }
  }
}

export default RelationshipService;

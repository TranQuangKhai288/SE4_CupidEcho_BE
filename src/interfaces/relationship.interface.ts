import { ObjectId } from "mongoose";

export interface IRelationship {
  _id?: ObjectId | string; // ID tự động từ MongoDB, tùy chọn khi tạo mới
  __v?: number; // Version key từ MongoDB, tùy chọn
  senderId: ObjectId | string; // ID của người gửi tương tác
  receiverId: ObjectId | string; // ID của người nhận tương tác
  type: "friend-request" | "crush" | "block"; // Loại tương tác, bắt buộc
  status: "pending" | "accepted" | "rejected" | "ignored" | "waiting"; // Trạng thái, bắt buộc
  metadata?: Map<string, string>; // Thông tin bổ sung, tùy chọn
  createdAt?: Date; // Thời gian tạo, tự động từ timestamps
  updatedAt?: Date; // Thời gian cập nhật, tự động từ timestamps
}

import mongoose, { Schema } from "mongoose";

const relationshipSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["friend-request", "crush", "block"], // Các loại tương tác
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "ignored"],
      default: "pending",
    },
    metadata: {
      type: Map,
      of: String,
      default: {}, // Lưu trữ thông tin bổ sung nếu cần, ví dụ: lý do từ chối
    },
  },
  { timestamps: true }
);

// Đảm bảo không có hai tương tác trùng lặp (ví dụ: không gửi lại friend_request khi đã có)
relationshipSchema.index(
  { senderId: 1, receiverId: 1, type: 1 },
  { unique: true }
);

const Interaction = mongoose.model("Relationship", relationshipSchema);
export default Interaction;

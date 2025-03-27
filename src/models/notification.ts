import mongoose, { Schema, Document } from "mongoose";
import {
  INotification,
  INotificationDocument,
} from "../interfaces/notification.interface";
const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Ai nhận thông báo
    type: {
      type: String,
      enum: ["message", "like", "post", "comment"],
      required: true,
    }, // Loại thông báo
    content: { type: String, required: true }, // Nội dung thông báo
    link: { type: String }, // Link điều hướng (nếu có)
    isRead: { type: Boolean, default: false }, // Đã đọc hay chưa
  },
  {
    timestamps: true,
    toObject: {
      transform: (doc, ret) => {
        ret.userId = ret.userId.toString(); // Chuyển userId thành string
        return ret;
      },
    },
    toJSON: {
      transform: (doc, ret) => {
        ret.userId = ret.userId.toString(); // Chuyển userId thành string
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Notification", NotificationSchema);

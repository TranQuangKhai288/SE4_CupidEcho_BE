import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId; // Ai nhận thông báo
  type: "like" | "comment" | "relationship_request" | "relationship_accepted";
  content: string; // Nội dung thông báo (có thể tự động hoặc lưu custom)
  link?: string; // Link điều hướng (nếu có)
  isRead: boolean;
  relatedUserId?: mongoose.Types.ObjectId; // Ai là người tạo ra thông báo này
  objectId?: mongoose.Types.ObjectId; // Đối tượng liên quan (post, relationship, comment)
  objectType?: "post" | "comment" | "relationship"; // Loại đối tượng liên quan
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "like",
        "comment",
        "relationship_request",
        "relationship_accepted",
      ],
      required: true,
    },
    content: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },

    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    objectId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    objectType: {
      type: String,
      enum: ["post", "comment", "relationship"],
    },
  },
  {
    timestamps: true,
    toObject: {
      transform: (doc, ret) => {
        ret.userId = ret.userId?.toString?.();
        ret.relatedUserId = ret.relatedUserId?.toString?.();
        ret.objectId = ret.objectId?.toString?.();
        return ret;
      },
    },
    toJSON: {
      transform: (doc, ret) => {
        ret.userId = ret.userId?.toString?.();
        ret.relatedUserId = ret.relatedUserId?.toString?.();
        ret.objectId = ret.objectId?.toString?.();
        return ret;
      },
    },
  }
);
const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);

export default Notification;

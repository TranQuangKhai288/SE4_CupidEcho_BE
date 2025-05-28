import mongoose, { Schema } from "mongoose";
import { IUser } from "../interfaces/user.interface"; // Đảm bảo import đúng đường dẫn
interface IUserDocument extends Document, IUser {}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    phone: { type: String },
    bio: { type: String },
    isAdmin: { type: Boolean, required: true, default: false },
    fcmToken: { type: String, default: null }, // Lưu FCM Token
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toObject: {
      transform: (doc, ret) => {
        ret._id = ret._id.toString();
        return ret;
      },
    }, // Chuyển _id thành string
    toJSON: {
      transform: (doc, ret) => {
        ret._id = ret._id.toString();
        return ret;
      },
    }, // Chuyển _id thành string
  }
);
const User = mongoose.model<IUserDocument>("User", userSchema);
export default User;

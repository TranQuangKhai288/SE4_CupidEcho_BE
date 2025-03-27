import mongoose, { Schema } from "mongoose";

const mediaSchema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: "Post", required: true }, // Tham chiếu đến bài viết mà phương tiện đó thuộc về
  type: { type: String, enum: ["image", "video", "audio"] }, // Loại của phương tiện: hình ảnh hoặc video
  URL: { type: String }, // URL hoặc đường dẫn đến phương tiện
});

const commentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Tham chiếu đến người dùng bình luận
  postId: { type: Schema.Types.ObjectId, ref: "Post", required: true }, // Tham chiếu đến bài viết mà bình luận đó thuộc về
  content: { type: String, required: true }, // Nội dung của bình luận
  media: [{ type: Schema.Types.ObjectId, ref: "Media" }], // Mảng chứa các hình ảnh và video
  createdAt: { type: Date, default: Date.now }, // Thời gian tạo bình luận
});

// Định nghĩa schema cho bài viết
const postSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Tham chiếu đến người dùng đăng bài
    content: { type: String, required: true }, // Nội dung của bài viết
    postedAt: { type: Date, default: Date.now }, // Thời gian người dùng đăng bài
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true, // Tự động tạo các trường createdAt và updatedAt
  }
);

// Đăng ký model với mongoose
export const Post = mongoose.model("Post", postSchema);
// Đăng ký model với mongoose
export const Comment = mongoose.model("Comment", commentSchema);
// Đăng ký model với mongoose
export const Media = mongoose.model("Media", mediaSchema);

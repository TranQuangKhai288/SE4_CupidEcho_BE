import { ObjectId } from "mongoose";

// Interface cho Media
export interface IMedia {
  postId: string; // ID của bài viết liên kết
  type: "image" | "video" | "audio"; // Loại phương tiện
  URL: string; // Đường dẫn đến tệp
  fileSize?: number; // Kích thước tệp (byte)
  duration?: number; // Thời lượng (cho video/audio)
}

// Interface cho Media trong MongoDB (sử dụng ObjectId)
export interface IMediaDocument extends Omit<IMedia, "postId"> {
  postId: ObjectId;
}

// Interface cho CreateMedia
export interface ICreateMedia {
  type: "image" | "video" | "audio"; // Loại phương tiện
  postId: string; // ID của bài viết liên kết
  URL: string; // Đường dẫn đến tệp
  fileSize?: number; // Kích thước tệp (byte)
  duration?: number; // Thời lượng (cho video/audio)
}

// Interface cho Comment
export interface IComment {
  userId: string; // ID của người dùng bình luận
  postId: string; // ID của bài viết liên kết
  content: string; // Nội dung bình luận
  media?: ObjectId[]; // Danh sách ID của media liên kết
  parentId?: ObjectId | null; // ID của bình luận cha (cho nested comments)
  createdAt?: Date; // Thời gian tạo
}

// Interface cho Comment trong MongoDB (sử dụng ObjectId)
export interface ICommentDocument
  extends Omit<IComment, "userId" | "postId" | "media" | "parentId"> {
  userId: ObjectId;
  postId: ObjectId;
  media?: ObjectId[]; // Tham chiếu đến Media
  parentId?: ObjectId | null; // Tham chiếu đến Comment cha
}

// Interface cho Post
export interface IPost {
  userId: string; // ID của người dùng đăng bài
  content: string; // Nội dung bài viết
  media?: string[]; // Danh sách ID của media liên kết
  likes?: string[]; // Danh sách ID của người dùng thích bài viết
  createdAt?: Date; // Thời gian tạo
  updatedAt?: Date; // Thời gian cập nhật
}

// Interface cho CreatePost
export interface ICreatePost {
  userId: string; // ID của người dùng đăng bài
  content: string; // Nội dung bài viết
  media?: ICreateMedia[]; // Danh sách media liên kết
}

// Interface cho Post trong MongoDB (sử dụng ObjectId)
export interface IPostDocument
  extends Omit<IPost, "userId" | "media" | "likes"> {
  userId: ObjectId;
  media?: ObjectId[]; // Tham chiếu đến Media
  likes: ObjectId[]; // Tham chiếu đến User
}

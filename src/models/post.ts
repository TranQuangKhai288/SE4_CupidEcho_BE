import mongoose, { Schema, Document } from "mongoose";
import {
  IPostDocument,
  ICommentDocument,
  IMediaDocument,
} from "../interfaces/post.interface";

// Schema cho Media
const mediaSchema = new Schema<IMediaDocument>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video", "audio"],
      required: true,
    },
    URL: {
      type: String,
      required: true,
      // match: /^(https?:\/\/[^\s]+)/, // Kiểm tra định dạng URL
    },
    fileSize: { type: Number },
    duration: { type: Number },
  },
  {
    timestamps: true,
    toObject: {
      transform: (doc, ret) => {
        ret.postId = ret.postId.toString();
        return ret;
      },
    },
    toJSON: {
      transform: (doc, ret) => {
        ret.postId = ret.postId.toString();
        return ret;
      },
    },
  }
);

// Schema cho Comment
const commentSchema = new Schema<ICommentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500, // Giới hạn độ dài bình luận
    },
    // media: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "Media",
    //     default: [],
    //   },
    // ],
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null, // Hỗ trợ nested comments
    },
  },
  {
    timestamps: true,
    toObject: {
      transform: (doc, ret) => {
        ret.userId = ret.userId.toString();
        ret.postId = ret.postId.toString();
        if (ret.media) {
          ret.media = ret.media.map((id: mongoose.Types.ObjectId) =>
            id.toString()
          );
        }
        ret.parentId = ret.parentId ? ret.parentId.toString() : null;
        return ret;
      },
    },
    toJSON: {
      transform: (doc, ret) => {
        ret.userId = ret.userId.toString();
        ret.postId = ret.postId.toString();
        if (ret.media) {
          ret.media = ret.media.map((id: mongoose.Types.ObjectId) =>
            id.toString()
          );
        }
        ret.parentId = ret.parentId ? ret.parentId.toString() : null;
        return ret;
      },
    },
  }
);

// Schema cho Post
const postSchema = new Schema<IPostDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    // media: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "Media",
    //     default: [],
    //   },
    // ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
    toObject: {
      transform: (doc, ret) => {
        ret.userId = ret.userId.toString();
        if (ret.media) {
          ret.media = ret.media.map((id: mongoose.Types.ObjectId) =>
            id.toString()
          );
        }
        if (ret.likes) {
          ret.likes = ret.likes.map((id: mongoose.Types.ObjectId) =>
            id.toString()
          );
        }
        return ret;
      },
    },
    toJSON: {
      transform: (doc, ret) => {
        ret.userId = ret.userId.toString();
        if (ret.media) {
          ret.media = ret.media.map((id: mongoose.Types.ObjectId) =>
            id.toString()
          );
        }
        if (ret.likes) {
          ret.likes = ret.likes.map((id: mongoose.Types.ObjectId) =>
            id.toString()
          );
        }
        return ret;
      },
    },
  }
);

// Thêm index để tối ưu hóa truy vấn
mediaSchema.index({ postId: 1 });
commentSchema.index({ postId: 1, createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });

// Đăng ký models
const Media = mongoose.model<IMediaDocument>("Media", mediaSchema);
const Comment = mongoose.model<ICommentDocument>("Comment", commentSchema);
const Post = mongoose.model<IPostDocument>("Post", postSchema);

export { Media, Comment, Post };

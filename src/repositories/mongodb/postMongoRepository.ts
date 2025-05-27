import { IPostRepository } from "../interfaces";
import {
  IPostDocument,
  // ICreatePost,
  IPost,
  ICreatePost,
  ICreateMedia,
  ICommentDocument,
  IComment,
} from "../../interfaces/post.interface";
import { Post, Media, User, Comment, Notification } from "../../models";
import { ObjectId, Types } from "mongoose";

export class PostMongoRepository implements IPostRepository {
  async findAll(
    userId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<{
    posts: IPostDocument[];
    pagination: { page: number; limit: number };
  }> {
    try {
      const skip = (page - 1) * limit;

      // Lấy keyword từ các post user đã like (1 truy vấn duy nhất)
      const likedContents = await Post.find(
        { likes: userId },
        { content: 1 }
      ).lean();
      const userKeywords = likedContents.map((p) => p.content).join(" ");

      // Tạo truy vấn
      const query: any = search
        ? { $text: { $search: search } }
        : {
            $or: [
              { userId },
              { content: { $regex: userKeywords, $options: "i" } },
            ],
          };

      // Lấy post kèm populate user, đếm likes ngay trên MongoDB (không xử lý thủ công)
      const posts = await Post.aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        // Join user
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        // Join media
        {
          $lookup: {
            from: "media",
            localField: "_id",
            foreignField: "postId",
            as: "media",
          },
        },
        // Đếm comment
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "postId",
            as: "comments",
          },
        },
        {
          $addFields: {
            commentCount: { $size: "$comments" },
            likeCount: { $size: { $ifNull: ["$likes", []] } },
            isLiked: { $in: [userId, { $ifNull: ["$likes", []] }] },
          },
        },
        {
          $project: {
            content: 1,
            createdAt: 1,
            media: 1,
            likeCount: 1,
            isLiked: 1,
            commentCount: 1,
            user: { _id: 1, name: 1, avatar: 1, email: 1 },
          },
        },
      ]);

      // Nếu thiếu post, bổ sung bằng bài phổ biến (vẫn dùng aggregate để đồng bộ)
      if (posts.length < limit) {
        const filled = limit - posts.length;

        const popularPosts = await Post.aggregate([
          { $sort: { likes: -1 } },
          { $limit: filled },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          {
            $lookup: {
              from: "media",
              localField: "_id",
              foreignField: "postId",
              as: "media",
            },
          },
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "postId",
              as: "comments",
            },
          },
          {
            $addFields: {
              commentCount: { $size: "$comments" },
              likeCount: { $size: { $ifNull: ["$likes", []] } },
              isLiked: { $in: [userId, { $ifNull: ["$likes", []] }] },
            },
          },
          {
            $project: {
              content: 1,
              createdAt: 1,
              media: 1,
              likeCount: 1,
              isLiked: 1,
              commentCount: 1,
              user: { _id: 1, name: 1, avatar: 1, email: 1 },
            },
          },
        ]);

        // Gộp và loại trùng post theo _id
        const postMap = new Map<string, any>();
        [...posts, ...popularPosts].forEach((p) => {
          postMap.set(p._id.toString(), p);
        });

        return {
          posts: Array.from(postMap.values()).slice(0, limit),
          pagination: { page, limit },
        };
      }

      return {
        posts: posts as unknown as IPostDocument[],
        pagination: { page, limit },
      };
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message);
    }
  }

  async findById(id: string): Promise<IPostDocument | null> {
    try {
      const postWithDetails = await Post.aggregate([
        { $match: { _id: new Types.ObjectId(id) } },

        // Join user info
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },

        // Join media
        {
          $lookup: {
            from: "media",
            localField: "_id",
            foreignField: "postId",
            as: "media",
          },
        },

        // Join comments to count
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "postId",
            as: "comments",
          },
        },

        // Add fields: likeCount, commentCount
        {
          $addFields: {
            likeCount: { $size: { $ifNull: ["$likes", []] } },
            commentCount: { $size: "$comments" },
          },
        },

        // Chỉ chọn các trường cần thiết
        {
          $project: {
            content: 1,
            createdAt: 1,
            media: 1,
            likeCount: 1,
            commentCount: 1,
            user: { _id: 1, name: 1, avatar: 1, email: 1 },
          },
        },
      ]);

      return (postWithDetails[0] as IPostDocument) || null;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message);
    }
  }

  async findAllByUser(
    userId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<{
    posts: IPostDocument[];
    pagination: { page: number; limit: number };
  }> {
    try {
      const skip = (page - 1) * limit;

      // Tạo điều kiện truy vấn
      const matchStage: any = {
        userId: new Types.ObjectId(userId),
      };

      if (search) {
        matchStage.content = { $regex: search, $options: "i" };
      }

      const result = await Post.aggregate([
        { $match: matchStage },

        // Sort và phân trang
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },

        // Join user
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },

        // Join media
        {
          $lookup: {
            from: "media",
            localField: "_id",
            foreignField: "postId",
            as: "media",
          },
        },

        // Join comments để đếm
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "postId",
            as: "comments",
          },
        },

        // Tính toán likeCount, commentCount
        {
          $addFields: {
            likeCount: { $size: { $ifNull: ["$likes", []] } },
            commentCount: { $size: "$comments" },
          },
        },

        // Chọn trường cần thiết
        {
          $project: {
            content: 1,
            createdAt: 1,
            media: 1,
            likeCount: 1,
            commentCount: 1,
            user: { _id: 1, name: 1, avatar: 1, email: 1 },
          },
        },
      ]);

      return {
        posts: result as IPostDocument[],
        pagination: { page, limit },
      };
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message);
    }
  }

  async create(post: ICreatePost): Promise<IPostDocument> {
    try {
      const createdPost = await Post.create({
        //post create without media first
        ...post,
        media: undefined,
      });
      console.log("Created post here: ", createdPost);
      // tạo media nếu có
      if (post.media) {
        //gán postId cho media

        await Promise.all(
          post.media.map(async (media: ICreateMedia) => {
            media.postId = createdPost._id.toString();
            await Media.create(media);
          })
        );
      }

      return createdPost as unknown as IPostDocument;
    } catch (err: any) {
      console.log("err when create post", err);
      return err.messsage;
    }
  }
  async update(
    userId: string,
    data: Partial<any>
  ): Promise<IPostDocument | null | string> {
    try {
      console.log("Update Post", data);
      //check xem post có thuộc về user không
      const post = await Post.findById(data.postId);
      if (!post) return "Post not found";
      if (post.userId.toString() !== userId.toString())
        return "This post is not yours";

      //update post
      const updatedPost = await Post.findByIdAndUpdate(
        data.postId,
        { ...data },
        { new: true, runValidators: true }
      );
      if (!updatedPost) return "Something went wrong when updating post";
      // xóa media của post
      if (data.media) {
        await Media.deleteMany({ postId: updatedPost._id });
        await Promise.all(
          data.media.map(async (media: ICreateMedia) => {
            media.postId = updatedPost._id.toString();
            await Media.create(media);
          })
        );
      }
      return updatedPost as unknown as IPostDocument;
    } catch (err: any) {
      console.log(err);
      return err.message;
    }
  }
  async delete(id: string): Promise<IPostDocument | null> {
    try {
      const post = await Post.findByIdAndDelete(id);
      if (!post) return null;
      // xóa media của post
      await Media.findByIdAndDelete({
        postId: post._id,
      });
      return post as unknown as IPostDocument;
    } catch (err: any) {
      console.log(err);
      return err.message;
    }
  }
  async findAllCommentsByPost(
    postId: string,
    page: number,
    limit: number
  ): Promise<{
    comments: ICommentDocument[];
    pagination: { page: number; limit: number };
  }> {
    try {
      console.log("Find all comments by postId", postId);
      const skip = (page - 1) * limit;
      console.log("Skip: ", skip);
      // --- Lấy comment theo post ---
      const comments = await Comment.find({
        postId,
      })
        // .sort({ createdAt: -1 })
        // .skip(skip)
        // .limit(limit)
        .lean();
      // .populate

      if (!comments.length) {
        return { comments: [], pagination: { page, limit } };
      }

      // const commentIds = comments.map((c) => c._id);
      const userIds = comments.map((c) => c.userId);

      // --- Gắn media nếu có (giả sử media gắn với commentId) ---
      // const mediaList = await Media.find(
      //   { commentId: { $in: commentIds } },
      //   { url: 1, commentId: 1 }
      // ).lean();
      // const mediaMap = new Map<string, any[]>();
      // for (const media of mediaList) {
      //   const key = media..toString();
      //   if (!mediaMap.has(key)) mediaMap.set(key, []);
      //   mediaMap.get(key)!.push(media);
      // }

      // --- Gắn thông tin user nếu muốn (avatar, name,...) ---
      const users = await User.find(
        { _id: { $in: userIds } },
        { name: 1, avatar: 1 }
      ).lean();
      const userMap = new Map<string, any>();
      users.forEach((user) => userMap.set(user._id.toString(), user));

      // --- Trả về danh sách comment có media + user ---
      const enrichedComments = comments.map((comment) => ({
        ...comment,
        // media: mediaMap.get(comment._id.toString()) || [],
        user: userMap.get(comment.userId.toString()) || null,
      }));

      return {
        comments: enrichedComments,
        pagination: { page, limit },
      };
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message);
    }
  }

  async createComment(
    comment: IComment
  ): Promise<ICommentDocument | null | string> {
    try {
      console.log("Create Comment heheehe", comment);
      const { postId, userId, content } = comment;
      const post = await Post.findById(postId);
      const user = await User.findById(userId);
      if (!post) return "Post not found";
      //check post

      const createdComment = await Comment.create(comment);
      if (post.userId.toString() !== userId.toString()) {
        const resNoti = await Notification.create({
          userId: post.userId, // người nhận thông báo là chủ post
          type: "comment",
          content: `${user?.name} đã bình luận bài viết của bạn.`,
          link: `/posts/${post._id}`,
          relatedUserId: userId,
          objectId: post._id,
          objectType: "post",
        });

        console.log(resNoti, "resNoti");
      } else {
        console.log("Comment on your post");
      }
      return createdComment as unknown as ICommentDocument;
    } catch (err: any) {
      console.log(err);
      return err.message;
    }
  }

  async updateComment(
    id: string,
    data: Partial<IComment>
  ): Promise<ICommentDocument | null | string> {
    try {
      console.log("Update Comment", data);

      // Truy vấn và cập nhật trong 1 bước: id + userId để đảm bảo quyền
      const updatedComment = await Comment.findOneAndUpdate(
        { _id: id, userId: data.userId },
        { ...data },
        { new: true, runValidators: true }
      ).lean(); // Có thể bỏ `.lean()` nếu bạn cần phương thức instance

      if (!updatedComment) return "Not your comment or not found";

      return updatedComment as ICommentDocument;
    } catch (err: any) {
      console.error(err);
      return err.message;
    }
  }

  async deleteComment(
    id: string,
    userId: string
  ): Promise<ICommentDocument | null | string> {
    console.log("Delete Comment", id);
    try {
      const comment = await Comment.findOneAndDelete({
        _id: id,
        userId: userId,
      }).lean(); // Có thể bỏ `.lean()` nếu bạn cần phương thức instance

      if (!comment) return "Comment not found or not yours";
      return comment as unknown as ICommentDocument;
    } catch (err: any) {
      console.log(err);
      return err.message;
    }
  }
  async likePost(
    postId: string,
    userId: string
  ): Promise<IPostDocument | null> {
    try {
      const post = await Post.findById(postId);
      const user = await User.findById(userId);

      if (!post) return null;

      // Kiểm tra xem người dùng đã thích bài viết chưa
      const isLiked = post.likes.find(
        (like) => like.toString() === userId.toString()
      );
      if (isLiked) {
        // Nếu đã thích, bỏ thích
        post.likes = post.likes.filter(
          (like) => like.toString() !== userId.toString()
        );
      } else {
        // Nếu chưa thích, thêm vào danh sách thích
        post.likes.push(user?._id as unknown as ObjectId);
        if (post.userId.toString() !== userId.toString()) {
          await Notification.create({
            userId: post.userId, // người nhận thông báo là chủ post
            type: "like",
            content: `${user?.name} đã thích bài viết của bạn.`,
            link: `/posts/${post._id}`,
            relatedUserId: userId,
            objectId: post._id,
            objectType: "post",
          });
        }
      }
      const updatedPost = await post.save();
      console.log("Updated post after like: ", updatedPost);
      return updatedPost as unknown as IPostDocument;
    } catch (err: any) {
      console.log(err);
      return err.message;
    }
  }
}

export default new PostMongoRepository();

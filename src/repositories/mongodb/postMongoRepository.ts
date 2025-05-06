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
import { Post, Media, User, Comment } from "../../models";
import { O } from "@faker-js/faker/dist/airline-CBNP41sR";
import { ObjectId } from "mongoose";

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

      // --- Tạo keyword dựa trên các bài đã like ---
      const likedPosts = await Post.find(
        { likes: userId },
        { content: 1 }
      ).lean();
      const userKeywords = likedPosts.map((p) => p.content).join(" ");

      // --- Tạo query ---
      let query: any = {};

      if (search) {
        // Dùng full-text search nếu có từ khóa
        query.$text = { $search: search };
      } else {
        query.$or = [
          { userId },
          { content: { $regex: userKeywords, $options: "i" } },
        ];
      }

      // --- Lấy bài viết chính (ưu tiên lean + projection) ---
      let posts = await Post.find(query, {
        content: 1,
        userId: 1,
        createdAt: 1,
        likes: 1,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // --- Nếu thiếu bài, bổ sung bài phổ biến ---
      if (posts.length < limit) {
        const filled = limit - posts.length;
        const popularPosts = await Post.find(
          {},
          { content: 1, userId: 1, createdAt: 1, likes: 1 }
        )
          .sort({ likes: -1 })
          .limit(filled)
          .lean();
        posts = [...posts, ...popularPosts];
      }

      // --- Lấy media cho tất cả post trong 1 query ---
      const postIds = posts.map((p) => p._id);
      const mediaList = await Media.find(
        { postId: { $in: postIds } }
        // { url: 1, postId: 1 }
      ).lean();
      const mediaMap = new Map<string, any[]>();
      for (const media of mediaList) {
        const key = media.postId.toString();
        if (!mediaMap.has(key)) mediaMap.set(key, []);
        mediaMap.get(key)!.push(media);
      }

      const postsWithMedia = posts.map((post) => ({
        ...post,
        media: mediaMap.get(post._id.toString()) || [],
      }));

      // --- Random posts chỉ khi có thể cần thêm độ đa dạng (và nên cache ngoài Mongo) ---
      const randomLimit = Math.ceil(limit * 0.2);
      const randomPosts = await Post.aggregate([
        { $sample: { size: randomLimit } },
        { $project: { content: 1, userId: 1, createdAt: 1 } },
      ]);

      // --- Gộp, loại bỏ trùng ---
      const finalMap = new Map<string, any>();
      [...postsWithMedia, ...randomPosts].forEach((post) => {
        finalMap.set(post._id.toString(), post);
      });

      const paginatedPosts = Array.from(finalMap.values()).slice(0, limit);

      return {
        posts: paginatedPosts as unknown as IPostDocument[],
        pagination: { page, limit },
      };
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message);
    }
  }

  async findById(id: string): Promise<IPostDocument | null> {
    try {
      const post = await Post.findById(id);
      // lấy media của post
      const media = await Media.find({ postId: id });
      const postData = { ...post?.toObject(), media };
      return postData as unknown as IPostDocument;
    } catch (err: any) {
      console.log(err);
      return err.message;
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

      // --- Tạo truy vấn ---
      const query: any = { userId };
      if (search) {
        query.content = { $regex: search, $options: "i" }; // hoặc dùng $text nếu đã tạo chỉ mục
      }

      // --- Truy vấn post ---
      const posts = await Post.find(query, {
        content: 1,
        userId: 1,
        createdAt: 1,
        likes: 1,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // --- Nếu không có bài viết, return sớm ---
      if (!posts.length) {
        return {
          posts: [],
          pagination: { page, limit },
        };
      }

      // --- Truy vấn media cho tất cả post ---
      const postIds = posts.map((p) => p._id);
      const mediaList = await Media.find(
        { postId: { $in: postIds } }
        // { url: 1, postId: 1 }
      ).lean();

      const mediaMap = new Map<string, any[]>();
      for (const media of mediaList) {
        const key = media.postId.toString();
        if (!mediaMap.has(key)) mediaMap.set(key, []);
        mediaMap.get(key)!.push(media);
      }

      // --- Gắn media vào từng post ---
      const postsWithMedia = posts.map((post) => ({
        ...post,
        media: mediaMap.get(post._id.toString()) || [],
      }));

      return {
        posts: postsWithMedia as unknown as IPostDocument[],
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
      await Media.findByIdAndDelete(id);
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

      console.log("Comments here: ", comments);

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

  async createComment(comment: IComment): Promise<ICommentDocument> {
    try {
      console.log("Create Comment", comment);
      const createdComment = await Comment.create(comment);
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
      }
      const updatedPost = await post.save();
      return updatedPost as unknown as IPostDocument;
    } catch (err: any) {
      console.log(err);
      return err.message;
    }
  }
}

export default new PostMongoRepository();

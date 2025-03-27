import { IPostRepository } from "../interfaces";
import {
  IPostDocument,
  ICreatePost,
  IPost,
  ICreateMedia,
} from "../../interfaces/post.interface";
import { Post, Media } from "../../models";

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

      // Lấy các bài viết mà người dùng đã tương tác (ví dụ: đã thích)
      const userInteractions = await Post.find({ likes: userId });
      const userKeywords = userInteractions
        .map((post) => post.content)
        .join(" "); // Tổng hợp nội dung bài viết thành từ khóa

      // Nếu có từ khóa tìm kiếm
      if (search) {
        console.log("Search posts by user with keyword: ", search);
        const postsRelated = await Post.find({
          $or: [
            { content: { $regex: search, $options: "i" } }, // Tìm theo từ khóa
            // { content: { $regex: userKeywords, $options: "i" } }, // Tìm theo sở thích người dùng
          ],
        })
          .skip(skip)
          .limit(limit);

        return {
          posts: postsRelated as unknown as IPostDocument[],
          pagination: { page, limit },
        };
      }

      // Nếu không có từ khóa tìm kiếm, ưu tiên gợi ý dựa trên sở thích
      const recommendedPosts = await Post.find({
        $or: [
          { userId }, // Bài viết của chính người dùng
          { content: { $regex: userKeywords, $options: "i" } }, // Bài viết tương tự sở thích
        ],
      })
        .skip(skip)
        .limit(limit);

      // Nếu không đủ bài gợi ý, lấy thêm bài viết phổ biến
      if (recommendedPosts.length < limit) {
        const remaining = limit - recommendedPosts.length;
        const popularPosts = await Post.find({})
          .sort({ likes: -1 }) // Sắp xếp theo lượt thích
          .skip(skip)
          .limit(remaining);
        recommendedPosts.push(...popularPosts);
      }

      const randomLimit = Math.ceil(limit * 0.2); // 20% của limit
      const randomPosts = await Post.aggregate([
        { $sample: { size: randomLimit } }, // Lấy ngẫu nhiên
      ]);

      const finalPosts = [...recommendedPosts, ...randomPosts];
      // Loại bỏ bài trùng lặp
      const uniquePosts = Array.from(
        new Set(finalPosts.map((post) => post._id))
      ).map((id) => finalPosts.find((post) => post._id === id));

      // Áp dụng phân trang cho kết quả cuối cùng
      const paginatedPosts = uniquePosts.slice(skip, skip + limit);
      return {
        posts: paginatedPosts as unknown as IPostDocument[],
        pagination: { page, limit },
      };
    } catch (err: any) {
      console.log(err);
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
      if (search) {
        console.log("Search posts by user with keyword: ", search);
        const postsRelated = await Post.find({
          userId,
          content: { $regex: search, $options: "i" },
        })
          .skip(skip)
          .limit(limit);
        return {
          posts: postsRelated as unknown as IPostDocument[],
          pagination: { page, limit },
        };
      }
      const posts = await Post.find({ userId }).skip(skip).limit(limit);
      return {
        posts: posts as unknown as IPostDocument[],
        pagination: { page, limit },
      };
    } catch (err: any) {
      console.log(err);
      return err.message;
    }
  }
  async create(post: ICreatePost): Promise<IPostDocument> {
    try {
      const createdPost = await Post.create(post);
      // tạo media nếu có
      if (post.media) {
        //gán postId cho media

        await Promise.all(
          post.media.map(async (media) => {
            media.postId = createdPost._id.toString();
            await Media.create(media);
          })
        );
      }

      return createdPost as unknown as IPostDocument;
    } catch (err: any) {
      console.log(err);
      return err.messsage;
    }
  }
  async update(
    userId: string,
    data: Partial<IPost>
  ): Promise<IPostDocument | null> {
    throw new Error("Method not implemented.");
  }
}

export default new PostMongoRepository();

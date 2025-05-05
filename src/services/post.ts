import { IUser } from "../interfaces/user.interface";
import { ObjectId } from "mongoose";
import { IPostRepository } from "../repositories/interfaces";
import { ICreateMedia } from "../interfaces/post.interface";

class PostService {
  constructor(private postRepository: IPostRepository) {}

  async createPost(
    userId: string,
    content: string,
    media: ICreateMedia[]
  ): Promise<any> {
    try {
      console.log("Create Post");
      if (!content) {
        return "Content is required";
      }
      const data = {
        userId,
        content,
        media,
      };
      const response = await this.postRepository.create(data);
      console.log("Response createPost here: ", response);
      if (typeof response === "string" || response === undefined) {
        return "Error when creating message";
      }
      return response;
    } catch (e) {
      console.log(e, "Error when creating message");
      return "Error when creating message";
    }
  }

  async getPostById(id: string): Promise<any> {
    try {
      console.log("Get Post by ID");
      const response = await this.postRepository.findById(id);
      if (!response) {
        return "Post not found";
      }
      return response;
    } catch (e) {
      console.log(e, "Error when getting post by ID");
      return "Error when getting post by ID";
    }
  }

  async getListPosts({
    page,
    limit,
    search,
    userId,
  }: {
    page: number;
    limit: number;
    search?: string;
    userId: string;
  }): Promise<any> {
    try {
      const response = await this.postRepository.findAll(
        userId,
        page,
        limit,
        search
      );

      return response;
    } catch (e) {
      console.log(e, "Error when getting list posts");
      return "Error when getting list posts";
    }
  }

  async getListPostsByUserId({
    page,
    limit,
    search,
    userId,
  }: {
    page: number;
    limit: number;
    search?: string;
    userId: string;
  }): Promise<any> {
    try {
      const response = await this.postRepository.findAllByUser(
        userId,
        page,
        limit,
        search
      );

      return response;
    } catch (e) {
      console.log(e, "Error when getting list posts");
      return "Error when getting list posts";
    }
  }
}

export default PostService;

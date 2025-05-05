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

  async updatePost(
    userId: string,
    postId: string,
    content: string,
    media: ICreateMedia[]
  ): Promise<any> {
    try {
      console.log("Update Post");
      if (!content) {
        return "Content is required";
      }
      const data = {
        userId,
        postId,
        content,
        media, // Assuming 'url' is the string property in ICreateMedia
      };
      const response = await this.postRepository.update(userId, data);
      console.log("Response updatePost here: ", response);
      if (typeof response === undefined) {
        return "Error when updating post";
      }
      if (typeof response === "string") {
        return response;
      }
      return response;
    } catch (e) {
      console.log(e, "Error when updating post");
      return "Error when updating post";
    }
  }

  async deletePost(postId: string): Promise<any> {
    try {
      console.log("Delete Post");
      const response = await this.postRepository.delete(postId);
      if (typeof response === "string" || response === undefined) {
        return "Error when deleting message";
      }
      return response;
    } catch (e) {
      console.log(e, "Error when deleting message");
      return "Error when deleting message";
    }
  }

  async createComment(
    userId: string,
    postId: string,
    content: string
  ): Promise<any> {
    try {
      console.log("Create Comment", userId, postId, content);
      if (!content) {
        return "Content is required";
      }
      const data = {
        postId,
        userId,
        content,
      };
      const response = await this.postRepository.createComment(data);
      console.log("Response createComment here: ", response);
      if (typeof response === "string" || response === undefined) {
        return "Error when creating comment";
      }
      return response;
    } catch (e) {
      console.log(e, "Error when creating comment");
      return "Error when creating comment";
    }
  }
  async getCommentByPostId(
    postId: string,
    page: number,
    limit: number
  ): Promise<any> {
    try {
      console.log("Get Comment by Post ID");
      const response = await this.postRepository.findAllCommentsByPost(
        postId,
        page,
        limit
      );
      if (!response) {
        return "Comment not found";
      }
      return response;
    } catch (e) {
      console.log(e, "Error when getting comment by Post ID");
      return "Error when getting comment by Post ID";
    }
  }
  async updateComment(
    commentId: string,
    userId: string,
    content: string
  ): Promise<any> {
    try {
      console.log("Update Comment");
      if (!content) {
        return "Content is required";
      }
      const data = {
        commentId,
        userId,
        content,
      };
      const response = await this.postRepository.updateComment(commentId, data);
      console.log("Response updateComment here: ", response);
      if (typeof response === undefined) {
        return "Error when updating comment";
      }
      if (typeof response === "string") {
        return response;
      }
      return response;
    } catch (e) {
      console.log(e, "Error when updating comment");
      return "Error when updating comment";
    }
  }
  async deleteComment(commentId: string): Promise<any> {
    try {
      console.log("Delete Comment");
      const response = await this.postRepository.deleteComment(commentId);
      if (typeof response === "string" || response === undefined) {
        return "Error when deleting comment";
      }
      return response;
    } catch (e) {
      console.log(e, "Error when deleting comment");
      return "Error when deleting comment";
    }
  }
  async likePost(postId: string, userId: string): Promise<any> {
    try {
      console.log("Like Post");
      const response = await this.postRepository.likePost(postId, userId);
      if (typeof response === "string" || response === undefined) {
        return "Error when liking post";
      }
      return response;
    } catch (e) {
      console.log(e, "Error when liking post");
      return "Error when liking post";
    }
  }
  async getListPostsByUserIdAndPostId({
    page,
    limit,
    search,
    userId,
    postId,
  }: {
    page: number;
    limit: number;
    search?: string;
    userId: string;
    postId: string;
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

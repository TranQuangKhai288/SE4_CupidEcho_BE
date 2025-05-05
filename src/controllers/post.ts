import { Request, Response } from "express";

import { postService } from "../services";
import { IPost } from "../interfaces/post.interface";
import { IApiResponse } from "../interfaces/response.interface";

const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Create Post");
    const userId = req.user?._id;
    const { content, media } = req.body;
    console.log("Content: ", content);
    console.log("Media: ", media);

    if (!content) {
      res.status(400).json({
        status: "ERR",
        message: "Content is required",
      } as IApiResponse<null>);
      return;
    }
    const response = await postService.createPost(
      userId as string,
      content,
      media
    );
    console.log("Response createPost: ", response);
    if (typeof response === "string" || response === undefined) {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Create Post successfully",
      data: response,
    } as IApiResponse<IPost>);
    console.log("Create Post successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Lỗi khi tạo Post",
    } as IApiResponse<null>);
  }
};

const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Get Post by ID");
    const { postId } = req.params;
    const response = await postService.getPostById(postId);
    if (!response) {
      res.status(404).json({
        status: "ERR",
        message: "Post not found",
      } as IApiResponse<null>);
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "Get post successfully",
      data: response,
    } as IApiResponse<IPost>);
    console.log("Get post successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Error when getting post by ID",
    } as IApiResponse<null>);
  }
};

const getListPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    // nếu không có userId thì lấy tất cả bài viết
    console.log("Get List Posts");
    const userId = req.user?._id;
    const { page = 1, limit = 10, search } = req.query;
    const response = await postService.getListPosts({
      page: Number(page),
      limit: Number(limit),
      search: typeof search === "string" ? search : undefined,
      userId: userId as string,
    });
    res.status(200).json({
      status: "OK",
      message: "Get list posts successfully",
      data: response,
    } as IApiResponse<IPost[]>);
    console.log("Get list posts successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Error when getting list posts",
    } as IApiResponse<null>);
  }
};

const getListPostsByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // nếu không có userId thì lấy tất cả bài viết
    console.log("Get List Posts Of User");
    const { userId } = req.params;
    const { page = 1, limit = 10, search } = req.query;
    const response = await postService.getListPostsByUserId({
      page: Number(page),
      limit: Number(limit),
      search: typeof search === "string" ? search : undefined,
      userId,
    });
    res.status(200).json({
      status: "OK",
      message: "Get list posts successfully",
      data: response,
    } as IApiResponse<IPost[]>);
    console.log("Get list posts successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Error when getting list posts",
    } as IApiResponse<null>);
  }
};

const updatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Update Post");
    const { postId } = req.params;
    const { content, media } = req.body;
    const userId = req.user?._id;
    if (!userId) {
      res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      } as IApiResponse<null>);
      return;
    }

    if (!content) {
      res.status(400).json({
        status: "ERR",
        message: "Content is required",
      } as IApiResponse<null>);
      return;
    }
    const response = await postService.updatePost(
      userId,
      postId,
      content,
      media
    );
    if (typeof response === "string" || response === undefined) {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Update Post successfully",
      data: response,
    } as IApiResponse<IPost>);
    console.log("Update Post successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Lỗi khi cập nhật Post",
    } as IApiResponse<null>);
  }
};

const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Delete Post");
    const { postId } = req.params;
    const userId = req.user?._id;
    if (!userId) {
      res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      } as IApiResponse<null>);
      return;
    }
    const response = await postService.deletePost(postId);
    if (typeof response === "string" || response === undefined) {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Delete Post successfully",
      data: response,
    } as IApiResponse<IPost>);
    console.log("Delete Post successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Lỗi khi xóa Post",
    } as IApiResponse<null>);
  }
};

const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    // console.log("Create Comment");
    const { id } = req.params;
    const userId = req.user?._id;
    const { content } = req.body;
    if (!userId) {
      res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      } as IApiResponse<null>);
      return;
    }
    console.log("User ID: ", userId);
    if (!content) {
      res.status(400).json({
        status: "ERR",
        message: "Content is required",
      } as IApiResponse<null>);
      return;
    }
    const response = await postService.createComment(
      userId as string,
      id,
      content
    );
    if (typeof response === "string" || response === undefined) {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Create Comment successfully",
      data: response,
    } as IApiResponse<IPost>);
    console.log("Create Comment successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Lỗi khi tạo Comment",
    } as IApiResponse<null>);
  }
};

const getCommentByPostId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Get Comment by Post ID");
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const response = await postService.getCommentByPostId(
      id,
      page as number,
      limit as number
    );
    if (!response) {
      res.status(404).json({
        status: "ERR",
        message: "Comment not found",
      } as IApiResponse<null>);
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "Get comment successfully",
      data: response,
    } as IApiResponse<IPost>);
    console.log("Get comment successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Error when getting comment by Post ID",
    } as IApiResponse<null>);
  }
};

const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Update Comment");
    const { commentId } = req.params;
    const userId = req.user?._id;
    const { content } = req.body;
    if (!userId) {
      res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      } as IApiResponse<null>);
      return;
    }
    if (!content) {
      res.status(400).json({
        status: "ERR",
        message: "Content is required",
      } as IApiResponse<null>);
      return;
    }
    const response = await postService.updateComment(
      userId as string,
      commentId,
      content
    );
    if (typeof response === "string" || response === undefined) {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Update Comment successfully",
      data: response,
    } as IApiResponse<IPost>);
    console.log("Update Comment successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Lỗi khi cập nhật Comment",
    } as IApiResponse<null>);
  }
};

const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Delete Comment");
    const { commentId } = req.params;
    const userId = req.user?._id;
    if (!userId) {
      res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      } as IApiResponse<null>);
      return;
    }
    const response = await postService.deleteComment(commentId);
    if (typeof response === "string" || response === undefined) {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Delete Comment successfully",
      data: response,
    } as IApiResponse<IPost>);
    console.log("Delete Comment successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Lỗi khi xóa Comment",
    } as IApiResponse<null>);
  }
};

export default {
  createPost,
  getPostById,
  getListPosts,
  getListPostsByUserId,
  updatePost,
  deletePost,
  createComment,
  getCommentByPostId,
  updateComment,
  deleteComment,
};

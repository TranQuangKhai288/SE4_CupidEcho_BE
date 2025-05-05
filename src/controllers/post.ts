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

export default {
  createPost,
  getPostById,
  getListPosts,
  getListPostsByUserId,
};

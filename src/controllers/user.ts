import { Request, Response } from "express";

import { userServices } from "../services";
import { IUser } from "../interfaces/user.interface";
import { IApiResponse } from "../interfaces/response.interface";
import { refreshAccessToken } from "../services/JWTService";

const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ status: "ERR", message: "User is not define" });
      return;
    }
    const userId = req.user?._id;
    const data = req.body;

    const response = await userServices.updateUser(userId as string, data);
    if (typeof response === "string") {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "User updated successfully",
      data: response,
    } as unknown as IApiResponse<IUser>);
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while updating the user",
    } as IApiResponse<null>);
  }
};

const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({
        status: "ERR",
        message: "Yêu cầu ID người dùng",
      } as IApiResponse<null>);
      return;
    }

    const response = await userServices.deleteUser(userId);
    if (typeof response === "string") {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Xóa người dùng thành công",
    } as IApiResponse<IUser>);
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Lỗi khi xóa người dùng",
    } as IApiResponse<null>);
  }
};

const getDetailsUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      } as IApiResponse<null>);
      return;
    }

    const response = await userServices.getDetailsUser(userId);
    if (typeof response === "string") {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Get user profile successfully",
      data: response,
    } as IApiResponse<IUser>);
    console.log("Get user profile successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Lỗi khi lấy chi tiết người dùng",
    } as IApiResponse<null>);
  }
};

const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const response = await userServices.getUsers(Number(page), Number(limit));
    if (typeof response === "string") {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Get list users successfully",
      data: response,
    } as IApiResponse<{ users: IUser[] }>);
    console.log("Get list users successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Lỗi khi lấy danh sách người dùng",
    } as IApiResponse<null>);
  }
};

const getRecommendUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      } as IApiResponse<null>);
      return;
    }
    const limit = Number(req.query.limit) || 10;

    const response = await userServices.getRecommendUsers(userId, limit);
    if (typeof response === "string") {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Get recommend users successfully",
      data: response,
    } as IApiResponse<{ users: IUser[] }>);
    console.log("Get recommend users successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while getting recommend users",
    } as IApiResponse<null>);
  }
};

const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({
        status: "ERR",
        message: "Refresh token is required",
      } as IApiResponse<null>);
      return;
    }

    const newAccessToken = await refreshAccessToken(refreshToken);
    if (!newAccessToken) {
      res.status(401).json({
        status: "ERR",
        message: "Invalid refresh token",
      } as IApiResponse<null>);
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "Refresh token successfully",
      data: {
        access_token: newAccessToken.accessToken,
        refresh_token: newAccessToken.refreshToken,
        payload: newAccessToken.payload,
      },
    } as IApiResponse<{ access_token: string; refresh_token: string; payload: any }>);
    return;
  } catch (error) {
    console.log(error, "Error when refreshing token");
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while refreshing token",
    } as IApiResponse<null>);
  }
};

export default {
  updateUser,
  deleteUser,
  getDetailsUser,
  getUsers,
  getRecommendUsers,
  refreshToken,
};

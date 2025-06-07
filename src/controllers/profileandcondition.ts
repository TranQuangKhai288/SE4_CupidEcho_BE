import { Request, Response } from "express";

import { profileAndConditionServices } from "../services";
import { IProfile, IProfileDocument } from "../interfaces/profile.interface";
import { IApiResponse } from "../interfaces/response.interface";
import { ICondition } from "../interfaces/condition.interface";

const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ status: "ERR", message: "User not authenticated" });
      return;
    }
    // const userId = req.user._id;
    const userId = req.user?._id;
    const data = req.body;
    if (!userId) {
      res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      } as IApiResponse<{ users: IProfile[] }>);
      return;
    }
    const response = await profileAndConditionServices.updateProfile(
      userId as string,
      data
    );
    if (typeof response === "string") {
      res.status(400).json({
        status: "ERR",
        message: response,
      } as IApiResponse<null>);
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "User profile updated successfully",
      data: response,
    } as unknown as IApiResponse<IProfile>);
    console.log("User profile updated successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while updating the user",
    } as IApiResponse<null>);
  }
};

const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      } as IApiResponse<null>);
      return;
    }
    const response = await profileAndConditionServices.getProfile(userId);
    if (typeof response === "string") {
      res.status(400).json({
        status: "ERR",
        message: response,
      } as IApiResponse<null>);
      return;
    }
    console.log(response.interests, "response");
    res.status(200).json({
      status: "OK",
      message: "Get user profile successfully",
      data: response,
    } as IApiResponse<IProfileDocument>);
    console.log("Get user profile successfully", response);
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while getting the user",
    } as IApiResponse<null>);
  }
};

const getCondition = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      } as IApiResponse<null>);
      return;
    }
    const response = await profileAndConditionServices.getCondition(userId);
    if (typeof response === "string") {
      res.status(400).json({
        status: "ERR",
        message: response,
      } as IApiResponse<null>);
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "Get user condition successfully",
      data: response,
    } as unknown as IApiResponse<IProfile>);
    console.log("Get user condition successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while getting the user",
    } as IApiResponse<null>);
  }
};

const updateCondition = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ status: "ERR", message: "User not authenticated" });
      return;
    }
    const userId = req.user?._id;
    const data = req.body as ICondition;
    if (!userId) {
      res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      } as IApiResponse<{ users: IProfile[] }>);
      return;
    }

    const response = await profileAndConditionServices.updateCondition(
      userId as string,
      data
    );
    if (typeof response === "string") {
      res.status(400).json({
        status: "ERR",
        message: response,
      } as IApiResponse<null>);
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "User condition updated successfully",
      data: response,
    } as unknown as IApiResponse<IProfile>);
    console.log("User condition updated successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while updating the user",
    } as IApiResponse<null>);
  }
};

export default {
  updateProfile,
  getProfile,

  getCondition,
  updateCondition,
};

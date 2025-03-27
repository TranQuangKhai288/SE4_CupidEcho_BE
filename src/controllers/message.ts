import { Request, Response } from "express";

import { messageService } from "../services";
import { IMessage } from "../interfaces/conversation.interface";
import { IApiResponse } from "../interfaces/response.interface";

const getMessagesInConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user?._id;
    const convId = req.params.convId;

    const response = await messageService.getMessagesInConversation(
      convId,
      userId as string,
      Number(page),
      Number(limit)
    );
    if (typeof response === "string") {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Get list messages successfully",
      data: response,
    } as IApiResponse<{ message: IMessage[] }>);
    console.log("Get list users successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Lỗi khi lấy danh sách người dùng",
    } as IApiResponse<null>);
  }
};

const createMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const convId = req.params.convId;
    const { content } = req.body;
    if (!content) {
      res.status(400).json({
        status: "ERR",
        message: "Content is required",
      } as IApiResponse<null>);
      return;
    }
    const response = await messageService.createMessage(
      convId,
      userId as string,
      content
    );
    if (typeof response === "string") {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Create message successfully",
      data: response,
    } as IApiResponse<IMessage>);
    console.log("Create message successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Lỗi khi tạo tin nhắn",
    } as IApiResponse<null>);
  }
};

export default {
  getMessagesInConversation,
  createMessage,
};

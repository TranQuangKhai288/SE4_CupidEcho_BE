import { Request, Response } from "express";
import { conversationService } from "../services";
import { IConversation } from "../interfaces/conversation.interface";
import { IApiResponse } from "../interfaces/response.interface";

const accessConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        status: "ERR",
        message: "User is not defined",
      } as IApiResponse<null>);
      return;
    }

    const { participants } = req.body;

    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length < 2
    ) {
      res.status(400).json({
        status: "ERR",
        message:
          "At least two participants are required to create a conversation",
      } as IApiResponse<null>);
      return;
    }

    // Đảm bảo người dùng hiện tại nằm trong danh sách participants
    const userId = req.user._id.toString();
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    const conversationData: Partial<IConversation> = { participants };
    const response = await conversationService.accessConversation(
      conversationData
    );

    if (typeof response === "string") {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(201).json({
      status: "OK",
      message: "Conversation access successfully",
      data: response,
    } as IApiResponse<IConversation>);
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while access the conversation",
    } as IApiResponse<null>);
  }
};

const getConversationDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const conversationId = req.params.id;
    if (!conversationId) {
      res.status(400).json({
        status: "ERR",
        message: "Conversation ID is required",
      } as IApiResponse<null>);
      return;
    }

    const response = await conversationService.getConversationById(
      conversationId
    );
    if (typeof response === "string") {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Get conversation details successfully",
      data: response,
    } as IApiResponse<IConversation>);
    console.log("Get conversation details successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while fetching conversation details",
    } as IApiResponse<null>);
  }
};

const getUserConversations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        status: "ERR",
        message: "User is not defined",
      } as IApiResponse<null>);
      return;
    }

    const userId = req.user._id.toString();
    const { page = 1, limit = 10, search = "" } = req.query;

    const response = await conversationService.getConversationsByUser(
      userId,
      Number(page),
      Number(limit),
      search as string
    );
    if (typeof response === "string") {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Get user conversations successfully",
      data: response,
    } as IApiResponse<{ conversations: IConversation[] }>);
    console.log("Get user conversations successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while fetching user conversations",
    } as IApiResponse<null>);
  }
};

const updateConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const conversationId = req.params.id;
    if (!conversationId) {
      res.status(400).json({
        status: "ERR",
        message: "Conversation ID is required",
      } as IApiResponse<null>);
      return;
    }

    const data = req.body;
    const response = await conversationService.updateConversation(
      conversationId,
      data
    );

    if (typeof response === "string") {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Conversation updated successfully",
      data: response,
    } as IApiResponse<IConversation>);
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while updating the conversation",
    } as IApiResponse<null>);
  }
};

const deleteConversation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const conversationId = req.params.id;
    const userId = req.user?._id;
    if (!conversationId) {
      res.status(400).json({
        status: "ERR",
        message: "Conversation ID is required",
      } as IApiResponse<null>);
      return;
    }
    if (!userId) {
      res.status(401).json({
        status: "ERR",
        message: "User is not defined",
      } as IApiResponse<null>);
      return;
    }

    const response = await conversationService.deleteConversation(
      conversationId,
      userId as string
    );
    if (typeof response === "string") {
      res
        .status(400)
        .json({ status: "ERR", message: response } as IApiResponse<null>);
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Conversation deleted successfully",
    } as IApiResponse<null>);
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while deleting the conversation",
    } as IApiResponse<null>);
  }
};

export default {
  accessConversation,
  getConversationDetails,
  getUserConversations,
  updateConversation,
  deleteConversation,
};

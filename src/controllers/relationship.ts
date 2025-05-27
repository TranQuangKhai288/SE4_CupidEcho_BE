import { Request, Response } from "express";

import { relationshipService } from "../services";
// import { IUser } from "../interfaces/user.interface";
import { IApiResponse } from "../interfaces/response.interface";

const createRelationshipRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const senderId = req.user?._id;
    const { receiverId, type, status } = req.body;

    if (!senderId || !receiverId) {
      res
        .status(400)
        .json({ status: "ERR", message: "Yêu cầu ID người gửi và người nhận" });
      return;
    }

    if (!type) {
      res.status(400).json({ status: "ERR", message: "Yêu cầu loại quan hệ" });
      return;
    }
    if (
      !["pending", "accepted", "rejected", "ignored"].includes(status) ||
      !status
    ) {
      res.status(400).json({ status: "ERR", message: "Yêu cầu status hợp lệ" });
      return;
    }
    const response = await relationshipService.createRelationshipRequest(
      senderId.toString(),
      receiverId,
      type,
      status
    );
    if (typeof response === "string") {
      res.status(400).json({ status: "ERR", message: response });
      return;
    }

    res.status(201).json({
      status: "OK",
      message: "Yêu cầu được gửi thành công",
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while updating the user",
    } as IApiResponse<null>);
  }
};

const getAllRelationships = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(400).json({ status: "ERR", message: "Yêu cầu ID người nhận" });
      return;
    }
    //get type relationship
    const {
      type,
      page = 1,
      limit = 10,
      direction = "both",
      status,
    } = req.query;

    // Ensure direction is of the correct type
    const allowedDirections = ["both", "sent", "received"];
    const directionValue =
      typeof direction === "string" && allowedDirections.includes(direction)
        ? (direction as "both" | "sent" | "received")
        : "both";
    // Ensure type is of the correct type

    const response = await relationshipService.getAllRelationships(
      directionValue,
      userId.toString(),
      type as string,
      status as string,
      page as unknown as number,
      limit as unknown as number
    );
    if (typeof response === "string") {
      res.status(400).json({ status: "ERR", message: response });
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Thành Công",
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while updating the user",
    } as IApiResponse<null>);
  }
};

const changeRelationshipRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const pendingId = req.params.id;
    const { status } = req.body;
    if (!pendingId) {
      res
        .status(400)
        .json({ status: "ERR", message: "Yêu cầu ID của mối quan hệ" });
      return;
    }
    if (
      !["pending", "accepted", "rejected", "ignored"].includes(status) ||
      !status
    ) {
      res.status(400).json({ status: "ERR", message: "Yêu cầu status hợp lệ" });
      return;
    }
    const response = await relationshipService.changeRelationshipRequest(
      pendingId,
      status
    );
    if (typeof response === "string") {
      res.status(400).json({ status: "ERR", message: response });
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Yêu cầu chấp nhận thành công",
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while updating the user",
    } as IApiResponse<null>);
  }
};

// const rejectRelationshipRequest = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const pendingId = req.params.id;
//     if (!pendingId) {
//       res
//         .status(400)
//         .json({ status: "ERR", message: "Yêu cầu ID của mối quan hệ" });
//       return;
//     }
//     const response = await relationshipService.rejectRelationshipRequest(
//       pendingId
//     );
//     if (typeof response === "string") {
//       res.status(400).json({ status: "ERR", message: response });
//       return;
//     }

//     res.status(200).json({
//       status: "OK",
//       message: "Yêu cầu đã được từ chối và xóa",
//       data: response,
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: "ERR",
//       message: "An error occurred while updating the user",
//     } as IApiResponse<null>);
//   }
// };

const checkRelationshipStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const senderId = req.user?._id;
    const targetUserId = req.params.id;
    if (!senderId || !targetUserId) {
      res
        .status(400)
        .json({ status: "ERR", message: "Yêu cầu ID người gửi và người nhận" });
      return;
    }
    const response = await relationshipService.checkRelationshipStatus(
      senderId.toString(),
      targetUserId
    );
    if (typeof response === "string") {
      res.status(400).json({ status: "ERR", message: response });
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Trạng thái bạn bè",
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while updating the user",
    } as IApiResponse<null>);
  }
};

export default {
  createRelationshipRequest,
  changeRelationshipRequest,
  // rejectRelationshipRequest,
  getAllRelationships,
  checkRelationshipStatus,
};

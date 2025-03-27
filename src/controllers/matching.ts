import { Request, Response } from "express";
// import { io } from '../server';
import {
  startUserMatching,
  stopUserMatching,
} from "../services/galeShapley/matching";

export const startMatching = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id; // Giả sử có middleware xác thực

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await startUserMatching(userId);

    if (!result.success) {
      res.status(400).json({ message: result.message });
    }

    // io.to(userId).emit('matching:status', { status: 'searching' });

    res.status(200).json({ message: "Đã bắt đầu tìm kiếm ghép đôi" });
  } catch (error) {
    console.error("Error starting matching:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi" });
  }
};

export const stopMatching = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await stopUserMatching(userId);
    // io.to(userId).emit('matching:status', { status: 'offline' });

    return res.status(200).json({ message: "Đã dừng tìm kiếm ghép đôi" });
  } catch (error) {
    console.error("Error stopping matching:", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi" });
  }
};

import { Request, Response } from "express";
import { Notification } from "../models";
import { IApiResponse } from "../interfaces/response.interface";

/**
 * Lấy danh sách thông báo của user (có phân trang)
 * GET /api/notifications?page=1&limit=10
 */
export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: "ERR", message: "Unauthorized" });
      return;
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId }),
    ]);

    res.status(200).json({
      status: "OK",
      message: "Fetched notifications successfully",
      data: {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    } as IApiResponse<any>);
  } catch (error) {
    res
      .status(500)
      .json({ status: "ERR", message: "Error fetching notifications" });
  }
};

/**
 * Đánh dấu 1 thông báo là đã đọc
 * PATCH /api/notifications/:id/read
 */
export const markNotificationAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const notificationId = req.params.id;
    if (!userId) {
      res.status(401).json({ status: "ERR", message: "Unauthorized" });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notification) {
      res
        .status(404)
        .json({ status: "ERR", message: "Notification not found" });
      return;
    }

    res.status(200).json({
      status: "OK",
      message: "Notification marked as read",
      data: notification,
    } as IApiResponse<any>);
  } catch (error) {
    res
      .status(500)
      .json({ status: "ERR", message: "Error updating notification" });
  }
};

/**
 * Đánh dấu tất cả thông báo là đã đọc
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: "ERR", message: "Unauthorized" });
      return;
    }

    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({
      status: "OK",
      message: "All notifications marked as read",
    } as IApiResponse<null>);
  } catch (error) {
    res
      .status(500)
      .json({ status: "ERR", message: "Error updating notifications" });
  }
};

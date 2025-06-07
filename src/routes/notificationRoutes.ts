import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notification";
import { authMiddlewareAuthentication } from "../middlewares";

const router = express.Router();

// Lấy danh sách thông báo (có phân trang)
router.get("/", authMiddlewareAuthentication, getNotifications);

// Đánh dấu 1 thông báo là đã đọc
router.patch("/:id/read", authMiddlewareAuthentication, markNotificationAsRead);

// Đánh dấu tất cả thông báo là đã đọc
router.patch(
  "/read-all",
  authMiddlewareAuthentication,
  markAllNotificationsAsRead
);

export default router;

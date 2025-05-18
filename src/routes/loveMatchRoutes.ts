import express from "express";
import { LoveMatch } from "../controllers";
import { authMiddlewareAuthentication } from "../middlewares";

const router = express.Router();

// Lấy toàn bộ matches (chỉ admin có thể xem nếu bạn muốn hạn chế)
router
  .route("/")
  .get(authMiddlewareAuthentication, LoveMatch.getAllLoveMatches);

// Tạo một love match (fromUser là user đang login, toUser từ body)
router.route("/").post(authMiddlewareAuthentication, LoveMatch.createLoveMatch);

// Truy xuất, cập nhật, xóa theo ID
router
  .route("/:id")
  .get(authMiddlewareAuthentication, LoveMatch.getLoveMatchById)
  .put(authMiddlewareAuthentication, LoveMatch.updateLoveMatch)
  .delete(authMiddlewareAuthentication, LoveMatch.deleteLoveMatch);

// Lấy các like do user gửi
router
  .route("/sent/:userId")
  .get(authMiddlewareAuthentication, LoveMatch.getLikesSentByUser);

// Lấy các like đến user
router
  .route("/received/:userId")
  .get(authMiddlewareAuthentication, LoveMatch.getLikesReceivedByUser);

// Lấy các match thực sự (mutual match)
router
  .route("/matched/:userId")
  .get(authMiddlewareAuthentication, LoveMatch.getMatchedUsers);

export default router;

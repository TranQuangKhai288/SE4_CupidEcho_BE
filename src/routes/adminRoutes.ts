import express from "express";
import { UserController } from "../controllers";
import { authMiddlewareAdmin } from "../middlewares/index";

const router = express.Router();

router
  .route("/matching/queue") // 	Xem danh sách người đang tìm ghép
  .get(authMiddlewareAdmin, UserController.getUsers);

router
  .route("/matching/pair") // 	Xem danh sách cặp đã được ghép
  .get(authMiddlewareAdmin, UserController.getDetailsUser);

router
  .route("/matching/status") // 	Thống kê số người trong hàng đợi, số cặp ghép, v.v
  .get(authMiddlewareAdmin, UserController.getDetailsUser);

router
  .route("/matching/algorithm") // 	Xóa toàn bộ hàng đợi ghép
  .post(authMiddlewareAdmin, UserController.getUsers);

export default router;

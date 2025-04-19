import express from "express";
import { UserController, AdminController } from "../controllers";
import { authMiddlewareAdmin } from "../middlewares/index";

const router = express.Router();

router
  .route("/matching/queue") // 	Xem danh sách người đang tìm ghép
  .get(authMiddlewareAdmin, AdminController.getMatchingQueue);

router
  .route("/matching/history") // 	Xem danh sách cặp đã được ghép
  .get(authMiddlewareAdmin, AdminController.getMatchingHistory);

router.route("/zodiac").get(authMiddlewareAdmin, AdminController.getZodiac); // 	Xem danh sách cung hoàng đạo
router
  .route("/algorithm") // 	Xem thông số thuật toán ghép đôi
  .get(authMiddlewareAdmin, AdminController.getAlgorithmConstant); // 	Xem thông số thuật toán ghép đôi
// .post(authMiddlewareAdmin, AdminController.updateAlgorithmConstant); // 	Cập nhật thông số thuật toán ghép đôi
export default router;

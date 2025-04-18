import express from "express";
import { startMatching, stopMatching } from "../controllers/matching";
import {
  authMiddlewareAdmin,
  authMiddlewareAuthentication,
} from "../middlewares/index";
const router = express.Router();

// API Stream gửi thông tin ghép đôi mới
router.post("/start", authMiddlewareAuthentication, startMatching);
// API Stream dừng ghép đôi
router.post("/stop", authMiddlewareAuthentication, stopMatching);

export default router;

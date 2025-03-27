import express from "express";
import { startMatching } from "../controllers/matching";
import {
  authMiddlewareAdmin,
  authMiddlewareAuthentication,
} from "../middlewares/index";
const router = express.Router();

// API Stream gửi thông tin ghép đôi mới
router.post("/start", authMiddlewareAuthentication, startMatching);

export default router;

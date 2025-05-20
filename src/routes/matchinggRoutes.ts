import express from "express";
import { startMatching, stopMatching } from "../controllers/matching";
import { galeShapley } from "../services/galeShapley/matchingAlgorithm";
import {
  authMiddlewareAdmin,
  authMiddlewareAuthentication,
} from "../middlewares/index";
const router = express.Router();

// API Stream gửi thông tin ghép đôi mới
router.post("/start", authMiddlewareAuthentication, startMatching);
// API Stream dừng ghép đôi
router.post("/stop", authMiddlewareAuthentication, stopMatching);

router.post("/test", (req, res) => {
  const { maleSide, femaleSide } = req.body;
  const result = galeShapley(maleSide, femaleSide);
  const resultObj = Object.fromEntries(result);
  res.json({
    status: "OK",
    message: "Đã dừng tìm kiếm ghép đôi",
    data: resultObj,
  });
});

export default router;

import express from "express";
import { InterestController } from "../controllers";
import { authMiddlewareAdmin } from "../middlewares";

const router = express.Router();

router
  .route("/")
  .get(InterestController.getAllInterests)
  .post(authMiddlewareAdmin, InterestController.createInterest);

router
  .route("/:id")
  .get(InterestController.getInterestById)
  .put(authMiddlewareAdmin, InterestController.updateInterest)
  .delete(authMiddlewareAdmin, InterestController.deleteInterest);

export default router;

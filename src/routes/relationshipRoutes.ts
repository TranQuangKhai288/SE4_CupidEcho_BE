import express from "express";
import {
  UserController,
  auth,
  ProfileAndConditionController,
  RelationshipController,
} from "../controllers";
import {
  authMiddlewareAdmin,
  authMiddlewareAuthentication,
} from "../middlewares/index";

const router = express.Router();

// Gửi yêu cầu tạo mối quan hệ
router
  .route("/")
  .get(authMiddlewareAuthentication, RelationshipController.getAllRelationships)
  .post(
    authMiddlewareAuthentication,
    RelationshipController.createRelationshipRequest
  ); // Gửi lời mời kết bạn

router
  .route("/requests/:id")
  .delete(
    authMiddlewareAuthentication,
    RelationshipController.rejectRelationshipRequest
  ) // Từ chối lời mời
  .put(
    authMiddlewareAuthentication,
    RelationshipController.acceptRelationshipRequest
  ); // Chấp nhận lời mời

router
  .route("/:id")
  .get(
    authMiddlewareAuthentication,
    RelationshipController.checkRelationshipStatus
  );

export default router;

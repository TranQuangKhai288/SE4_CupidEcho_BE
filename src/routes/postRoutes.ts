import express from "express";
import { PostController } from "../controllers";
import {
  authMiddlewareAdmin,
  authMiddlewareAuthentication,
} from "../middlewares/index";

const router = express.Router();
// Routes cho bài viết chung
router
  .route("/")
  .get(authMiddlewareAuthentication, PostController.getListPosts)
  .post(authMiddlewareAuthentication, PostController.createPost);

router.route("/users/:userId").get(PostController.getListPostsByUserId);

// Route lấy bài viết theo postId
router.route("/:postId").get(PostController.getPostById);
// .post(authMiddlewareAuthentication, MessageController.createMessage);
//   .put(authMiddlewareAuthentication, ConversationController.updateConversation)
//   .delete(
//     authMiddlewareAuthentication,
//     ConversationController.deleteConversation
//   );

export default router;

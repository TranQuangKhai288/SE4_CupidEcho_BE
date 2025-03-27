import express from "express";
import { ConversationController } from "../controllers";
import {
  authMiddlewareAdmin,
  authMiddlewareAuthentication,
} from "../middlewares/index";

const router = express.Router();

// Access to the conversation controller

router
  .route("/")
  .post(authMiddlewareAuthentication, ConversationController.accessConversation)
  .get(
    authMiddlewareAuthentication,
    ConversationController.getUserConversations
  );

router
  .route("/:id")
  .get(
    authMiddlewareAuthentication,
    ConversationController.getConversationDetails
  )
  .put(authMiddlewareAuthentication, ConversationController.updateConversation)
  .delete(
    authMiddlewareAuthentication,
    ConversationController.deleteConversation
  );

export default router;

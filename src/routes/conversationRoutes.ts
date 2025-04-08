import express from "express";
import { ConversationController } from "../controllers";
import {
  authMiddlewareAdmin,
  authMiddlewareAuthentication,
} from "../middlewares/index";
import { MessageController } from "../controllers";

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
    MessageController.getMessagesInConversation
  )
  .put(authMiddlewareAuthentication, ConversationController.updateConversation)
  .delete(
    authMiddlewareAuthentication,
    ConversationController.deleteConversation
  );

// router
//   .route("/:convId")
//   .get(
//     authMiddlewareAuthentication,
//     MessageController.getMessagesInConversation
//   );

export default router;

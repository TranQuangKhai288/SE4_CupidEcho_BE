import express from "express";
import { MessageController } from "../controllers";
import {
  authMiddlewareAdmin,
  authMiddlewareAuthentication,
} from "../middlewares/index";

const router = express.Router();
router
  .route("/:convId")
  .get(
    authMiddlewareAuthentication,
    MessageController.getMessagesInConversation
  );
// .post(authMiddlewareAuthentication, MessageController.createMessage);
//   .put(authMiddlewareAuthentication, ConversationController.updateConversation)
//   .delete(
//     authMiddlewareAuthentication,
//     ConversationController.deleteConversation
//   );

export default router;

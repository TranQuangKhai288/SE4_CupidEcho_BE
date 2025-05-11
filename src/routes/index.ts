// Init all routes
import UserRouter from "./userRoutes";
import Relationship from "./relationshipRoutes";
import Conversation from "./conversationRoutes";
import MessageRouter from "./messageRoutes";
import PostRouter from "./postRoutes";
import InterestRouter from "./interestRoutes";
import MatchingRouter from "./matchinggRoutes";
import AdminRouter from "./adminRoutes";

const routes = (app: { use: (arg0: string, arg1: any) => void }) => {
  app.use("/api/user", UserRouter);
  app.use("/api/conv", Conversation);
  app.use("/api/message", MessageRouter);
  app.use("/api/post", PostRouter);
  app.use("/api/matching", MatchingRouter);
  app.use("/api/relationship", Relationship);
  app.use("/api/admin", AdminRouter);
  app.use("/api/interest", InterestRouter);

  //   app.use("/api/interest", InterestRouter);
};

export default routes;

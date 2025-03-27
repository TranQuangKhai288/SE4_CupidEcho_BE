import UserService from "./user";
import ProfileAndConditionService from "./profileAndcondition";
import RelationshipService from "./relationship";
import ConversationService from "./conversation";
import MessageService from "./message";
import PostService from "./post";
import {
  ConditionMongoRepository,
  ProfileMongoRepository,
  UserMongoRepository,
  RelationshipMongoRepository,
  conversationMongoRepository,
  messageMongoRepository,
  postMongoRepository,
} from "../repositories/mongodb";

const userServices = new UserService(
  UserMongoRepository,
  ProfileMongoRepository,
  ConditionMongoRepository
);

const profileAndConditionServices = new ProfileAndConditionService(
  ProfileMongoRepository,
  ConditionMongoRepository
);

const relationshipService = new RelationshipService(
  RelationshipMongoRepository
);

const conversationService = new ConversationService(
  conversationMongoRepository
);

const postService = new PostService(postMongoRepository);

const messageService = new MessageService(
  messageMongoRepository,
  conversationMongoRepository
);

export {
  userServices,
  profileAndConditionServices,
  relationshipService,
  postService,
  conversationService,
  messageService,
};

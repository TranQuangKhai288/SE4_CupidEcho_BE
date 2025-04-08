import express from "express";
import {
  UserController,
  auth,
  ProfileAndConditionController,
} from "../controllers";
import {
  authMiddlewareAdmin,
  authMiddlewareAuthentication,
} from "../middlewares/index";

const router = express.Router();

// Auth routes
router.get(
  "/recommend",
  authMiddlewareAuthentication,
  UserController.getRecommendUsers
);
router.post("/register", auth.createUser);
router.post("/login", auth.loginUser);
// router.post("/log-out", UserController.logoutUser);
router.post("/refresh-token", UserController.refreshToken);
router.post("/forgot-password", UserController.updateUser);
// router.get("/verify-email", auth.verifyEmail);

// User routes
router
  .route("/")
  .put(authMiddlewareAuthentication, UserController.updateUser)
  .get(authMiddlewareAdmin, UserController.getUsers);

router
  .route("/:id")
  .get(authMiddlewareAuthentication, UserController.getDetailsUser)
  .delete(authMiddlewareAdmin, UserController.deleteUser);

// // Profile routes
router
  .route("/profile")
  .put(
    authMiddlewareAuthentication,
    ProfileAndConditionController.updateProfile
  );

router.get("/profile/:id", ProfileAndConditionController.getProfile);

// // Condition routes
router
  .route("/condition")
  .put(
    authMiddlewareAuthentication,
    ProfileAndConditionController.updateCondition
  );

router.get("/condition/:id", ProfileAndConditionController.getCondition);

export default router;

import express from "express";
import {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/signin", authUser);
router.get("/me", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

export default router;

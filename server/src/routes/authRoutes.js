import express from "express";
import {
  register,
  login,
  verifyOtp,
  getProfile,
  createStaffUser,
  updateProfile,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.post("/admin/create-staff", authMiddleware, isAdmin, createStaffUser);

export default router;
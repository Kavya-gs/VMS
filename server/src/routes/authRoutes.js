import express from "express";
import {
  register,
  login,
  verifyOtp,
  getProfile,
  createStaffUser,
  updateProfile,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";
import { forgotPasswordRateLimiter, loginRateLimiter, otpRateLimiter, registerRateLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/register", registerRateLimiter, register);
router.post("/login", loginRateLimiter, login);
router.post("/verify-otp", otpRateLimiter, verifyOtp);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.post("/admin/create-staff", authMiddleware, isAdmin, createStaffUser);

router.post("/forgot-password/request", forgotPasswordRateLimiter, requestPasswordReset);
router.post("/forgot-password/verify", otpRateLimiter, verifyPasswordResetOtp);
router.post("/forgot-password/reset", forgotPasswordRateLimiter, resetPassword);

export default router;
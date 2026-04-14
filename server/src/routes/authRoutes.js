import express from "express";
import {
  register,
  login,
  getProfile,
  createStaffUser,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.post("/admin/create-staff", authMiddleware, isAdmin, createStaffUser);

export default router;
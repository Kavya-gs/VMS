import express from "express";
import {
  approveVisitor,
  checkoutVisitor,
  createVisitor,
  getVisitors,
  getVisitorStats,
  rejectVisitor,
  getMyVisits
} from "../controllers/visitor.controller.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { isAdmin, roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ✅ Visitor creates request
router.post("/checkin", authMiddleware, createVisitor);

// ✅ Admin/Security view all visitors
router.get("/", authMiddleware, roleMiddleware("admin", "security"), getVisitors);

// ✅ Security checkout
router.put("/checkout/:id", authMiddleware, roleMiddleware("visitor"), checkoutVisitor);

// ✅ Admin stats
router.get("/stats", authMiddleware, isAdmin , getVisitorStats);

// ✅ Admin approvals
router.put("/approve/:id", authMiddleware, roleMiddleware("admin"), approveVisitor);
router.put("/reject/:id", authMiddleware, roleMiddleware("admin"), rejectVisitor);

router.get(
  "/my-visits",
  authMiddleware,
  roleMiddleware("visitor"),
  getMyVisits
);

export default router;
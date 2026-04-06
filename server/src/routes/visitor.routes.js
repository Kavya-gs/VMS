import express from "express";
import {
  approveVisitor,
  checkoutVisitor,
  createVisitor,
  getVisitors,
  getVisitorStats,
  rejectVisitor,
  getMyVisits,
  getNotifications,
  getVisitorByDate
} from "../controllers/visitor.controller.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { isAdmin, roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/checkin", authMiddleware, createVisitor);

router.get("/", authMiddleware, roleMiddleware("admin", "security"), getVisitors);

router.put("/checkout/:id", authMiddleware, roleMiddleware("visitor", "security"), checkoutVisitor);

router.get("/stats", authMiddleware, isAdmin , getVisitorStats);

router.put("/approve/:id", authMiddleware, roleMiddleware("admin"), approveVisitor);
router.put("/reject/:id", authMiddleware, roleMiddleware("admin"), rejectVisitor);

router.get(
  "/my-visits",
  authMiddleware,
  roleMiddleware("visitor"),
  getMyVisits
);

router.get(
  "/notifications",
  authMiddleware,
  roleMiddleware("admin", "security", "visitor"),
  getNotifications
);

router.get("/reports",
  authMiddleware,
  roleMiddleware("admin"),
  getVisitorByDate
)

export default router;
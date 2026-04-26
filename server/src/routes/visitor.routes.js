import express from "express";
import {
  approveVisitor,
  checkoutVisitor,
  createVisitor,
  getVisitors,
  getVisitorStats,
  rejectVisitor,
  getMyVisits,
  getVisitorByDate,
  uploadVisitorPhoto,
  getVisitorById,
  securityCheckoutVisitor,
  requestCheckout,
  verifyCheckInOtp,
} from "../controllers/visitor.controller.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { isAdmin, roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/checkin", authMiddleware, createVisitor);

router.get("/", authMiddleware, roleMiddleware("admin", "security"), getVisitors);

router.put("/checkout/:id", authMiddleware, roleMiddleware("security"), checkoutVisitor);
router.post("/request-checkout/:id", authMiddleware, roleMiddleware("visitor"), requestCheckout);
router.post("/checkout/security-scan", authMiddleware, roleMiddleware("security"), securityCheckoutVisitor);

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
  "/details/:id",
  authMiddleware,
  roleMiddleware("visitor", "security", "admin"),
  getVisitorById
);

router.put(
  "/photo/:id",
  authMiddleware,
  roleMiddleware("visitor", "security", "admin"),
  uploadVisitorPhoto
);

router.post(
  "/verify-checkin-otp/:id",
  authMiddleware,
  roleMiddleware("visitor", "security", "admin"),
  verifyCheckInOtp
);

router.get("/reports",
  authMiddleware,
  roleMiddleware("admin"),
  getVisitorByDate
)

export default router;
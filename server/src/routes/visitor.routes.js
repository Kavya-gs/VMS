import express from "express";
import { approveVisitor, checkoutVisitor, createVisitor, getVisitors, getVisitorStats, rejectVisitor } from "../controllers/visitor.controller.js";

const router = express.Router();

// api routes
router.post("/checkin", createVisitor);
router.get("/", getVisitors);
router.put("/checkout/:id", checkoutVisitor);
router.get("/stats", getVisitorStats);
router.put("/approve/:id", approveVisitor);
router.put("/reject/:id", rejectVisitor);

export default router;
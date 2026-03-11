import express from "express";
import { checkoutVisitor, createVisitor, getVisitors, getVisitorStats } from "../controllers/visitor.controller.js";

const router = express.Router();
// api routes
router.post("/checkin", createVisitor);
router.get("/", getVisitors);
router.put("/checkout/:id", checkoutVisitor);
router.get("/stats", getVisitorStats);


export default router;
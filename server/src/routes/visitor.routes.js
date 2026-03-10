import express from "express";
import { checkoutVistior, createVisitor, getVisitors } from "../controllers/visitor.controller.js";

const router = express.Router();
// api routes
router.post("/checkin", createVisitor);
router.get("/", getVisitors);
router.put("/checkout/:id", checkoutVistior);


export default router;
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getNotificationsForUser,
  markAsRead,
  markAllAsRead,
} from "../controllers/notifications.controller.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { unreadOnly, since } = req.query;
    const notifications = await getNotificationsForUser(req.user.id, {
      unreadOnly: unreadOnly === "true",
      since,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

router.put("/mark-all/read", authMiddleware, async (req, res) => {
  try {
    await markAllAsRead(req.user.id);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error marking all notifications as read" });
  }
});

router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Error marking notification as read" });
  }
});

export default router;

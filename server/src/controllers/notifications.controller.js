import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const createNotificationForRoles = async (
  roles = ["admin", "security"],
  notificationData
) => {
  try {
    const users = await User.find({ role: { $in: roles } });

    if (users.length === 0) return [];

    const notifications = users.map((user) => ({
      userId: user._id,
      audience: user.role === "visitor" ? "visitor" : "staff",
      ...notificationData,
    }));

    return await Notification.insertMany(notifications);
  } catch (error) {
    console.error("Error creating notifications:", error);
    return [];
  }
};

export const createNotificationForUser = async (userId, notificationData) => {
  try {
    if (!userId) return null;

    const user = await User.findById(userId).select("_id role");
    if (!user) return null;

    return await Notification.create({
      userId,
      audience: user.role === "visitor" ? "visitor" : "staff",
      ...notificationData,
    });
  } catch (error) {
    console.error("Error creating user notification:", error);
    return null;
  }
};

export const getNotificationsForUser = async (
  userId,
  { unreadOnly = false, since } = {}
) => {
  try {
    const query = { userId };

    if (unreadOnly) {
      query.read = false;
    }

    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        query.createdAt = { $gt: sinceDate };
      }
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

export const markAsRead = async (notificationId, userId) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
    return updated;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return null;
  }
};

export const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
};

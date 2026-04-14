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
      ...notificationData,
    }));

    return await Notification.insertMany(notifications);
  } catch (error) {
    console.error("Error creating notifications:", error);
    return [];
  }
};

export const getNotificationsForUser = async (userId) => {
  try {
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);
    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const updated = await Notification.findByIdAndUpdate(
      notificationId,
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

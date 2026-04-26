import { useCallback, useEffect, useRef, useState } from "react";
import API from "../services/api";

export const useNotifications = ({ pollIntervalMs = 10000 } = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const lastFetchRef = useRef(null);

  const fetchNotifications = useCallback(async ({ force = true } = {}) => {
    try {
      setLoadingNotifications(true);
      setNotificationError(null);

      const query = [];
      if (!force && lastFetchRef.current) {
        query.push(`since=${encodeURIComponent(lastFetchRef.current)}`);
      }

      const queryString = query.length > 0 ? `?${query.join("&")}` : "";
      const response = await API.get(`/notifications${queryString}`, { showLoader: false });
      const notificationList = response.data || [];

      setNotifications((prev) => {
        if (force || !lastFetchRef.current) return notificationList;

        const existingIds = new Set(prev.map((item) => item._id));
        const merged = [...prev];

        notificationList.forEach((item) => {
          if (!existingIds.has(item._id)) {
            merged.unshift(item);
          }
        });

        return merged.slice(0, 50);
      });

      lastFetchRef.current = new Date().toISOString();

      const unread = notificationList.filter((n) => !n.read).length;
      if (force) {
        setUnreadCount(unread);
      } else {
        setUnreadCount((prev) => prev + unread);
      }
    } catch (error) {
      setNotificationError(error);
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await API.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await API.put("/notifications/mark-all/read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications({ force: false });
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [fetchNotifications, pollIntervalMs]);

  return {
    notifications,
    unreadCount,
    loadingNotifications,
    notificationError,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../../assets/image.png";
import {
  Person,
  Menu,
  Close,
  Dashboard,
  People,
  CheckCircle,
  Assessment,
  ExitToApp,
  Notifications as NotificationsIcon,
  Done,
  DoneAll,
} from "@mui/icons-material";
import { useNotifications } from "../../../hooks/useNotifications";
import { useAuth } from "../../../contexts/useAuth";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const { role, isAuthenticated, logout } = useAuth();

  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: Dashboard, roles: ["admin", "security", "visitor"] },
    { label: "Visitors", path: "/visitors", icon: People, roles: ["admin", "security"] },
    { label: "Check-in", path: "/checkin", icon: CheckCircle, roles: ["visitor", "security"] },
    { label: "Reports", path: "/reports", icon: Assessment, roles: ["admin"] },
    { label: "Approvals", path: "/approvals", icon: CheckCircle, roles: ["admin"]},
    { label: "CheckOut", path: "/checkout", icon: ExitToApp, roles: ["visitor", "security"] }
  ];

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications({ force: true });
  }, [isAuthenticated, fetchNotifications]);

  const handleNotificationClick = (notificationId, isRead) => {
    if (!isRead) {
      markAsRead(notificationId);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNavClick = (path) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  if (!isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-50">
              <img src={logo} alt="logo" className="h-8 w-8 rounded-md" />
            </div>
            <p className="font-semibold text-gray-800">
              Visitor Management
            </p>
          </div>

          <button
            className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileNavOpen ? <Close fontSize="small" /> : <Menu fontSize="small" />}
          </button>

          <div className="hidden lg:flex items-center gap-2">
            {navItems
              .filter((item) => item.roles.includes(role))
              .map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                    isActive(item.path)
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
                  }`}
                >
                  <item.icon fontSize="small" />
                  {item.label}
                </button>
              ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              >
                <NotificationsIcon fontSize="small" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-[90vw] max-w-sm sm:max-w-md bg-white border border-gray-200 rounded-xl shadow-2xl p-4 max-h-96 overflow-y-auto"
                  onMouseLeave={() => setNotificationsOpen(false)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-gray-800">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <DoneAll fontSize="small" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4 text-center">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n._id, n.read)}
                        className={`p-3 mb-2 rounded-lg cursor-pointer transition ${
                          n.read
                            ? "bg-gray-50 opacity-60"
                            : "bg-indigo-50 border border-indigo-200"
                        } hover:shadow-sm`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{n.title}</p>
                              {!n.read && (
                                <span className="inline-flex h-2 w-2 rounded-full bg-indigo-600"></span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{n.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(n.createdAt).toLocaleString("en-GB")}
                            </p>
                          </div>
                          {!n.read && (
                            <Done fontSize="small" className="text-indigo-600 mt-1" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              >
                <Person fontSize="small" />
                <span className="hidden sm:inline text-sm">Account</span>
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <button
                    onClick={() => navigate("/profile")}
                    className="flex w-full px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {mobileNavOpen && (
          <div className="lg:hidden pb-4 border-t border-gray-100 mt-2 pt-3">
            <div className="grid grid-cols-1 gap-2">
              {navItems
                .filter((item) => item.roles.includes(role))
                .map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      isActive(item.path)
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon fontSize="small" />
                    {item.label}
                  </button>
                ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
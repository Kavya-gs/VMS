import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../../assets/image.png";
import {
  Person,
  Logout,
  Dashboard,
  People,
  CheckCircle,
  Assessment,
  ExitToApp,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import API from "../../../services/api";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: Dashboard, roles: ["admin", "security", "visitor"] },
    { label: "Visitors", path: "/visitors", icon: People, roles: ["admin", "security"] },
    { label: "Check-in", path: "/checkin", icon: CheckCircle, roles: ["visitor", "security"] },
    { label: "Reports", path: "/reports", icon: Assessment, roles: ["admin"] },
    { label: "Approvals", path: "/approvals", icon: CheckCircle, roles: ["admin"]},
    { label: "CheckOut", path: "/checkout", icon: ExitToApp, roles: ["visitor", "security"] }
  ];

  const isActive = (path) => location.pathname === path;

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await API.get("/visitors/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  if (!token) return null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
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

          {/* Nav */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems
              .filter((item) => item.roles.includes(role))
              .map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
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

          {/* Right Side */}
          <div className="flex items-center gap-3">

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              >
                <NotificationsIcon fontSize="small" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-4"
                  onMouseLeave={() => setNotificationsOpen(false)}
                >
                  <p className="font-semibold mb-2">Notifications</p>

                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-sm">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 mb-2 rounded-lg bg-gray-50">
                        <p className="text-sm font-medium">{n.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(n.createdAt).toLocaleString("en-GB")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* User */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              >
                <Person fontSize="small" />
                <span className="text-sm">Account</span>
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
      </nav>
    </header>
  );
};

export default Header;
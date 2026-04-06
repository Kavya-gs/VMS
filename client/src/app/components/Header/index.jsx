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
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

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
    setNotificationsLoading(true);
    setNotificationsError("");

    try {
      const res = await API.get("/visitors/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      setNotificationsError("Failed to load notifications");
      console.error("Notification fetch error", err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  }

  if(!token) return null;
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-md">
      {/* Main Navbar */}
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div onClick={() => navigate("/dashboard")} className="flex items-center gap-3 cursor-pointer">
          <img src={logo} alt="logo" className="h-10 w-10" />

          <div className="leading-tight">
          <p className="text-xs text-gray-500">Visitor Management System</p>
          </div>
        </div>

          {/* Desktop Navigation */}
          <div className="flex items-center gap-1">
            {navItems.filter((item) => item.roles.includes(role)).map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium smooth-transition ${
                  isActive(item.path)
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <item.icon fontSize="small" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative flex items-center gap-1 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 smooth-transition"
              >
                <NotificationsIcon fontSize="small" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-lg bg-white shadow-lg border border-gray-200 z-50"
                  onMouseLeave={() => setNotificationsOpen(false)}
                >
                  <div className="px-4 py-3 border-b font-semibold">Notifications</div>
                  <div className="px-4 py-2">
                    {notificationsLoading && <div>Loading...</div>}
                    {notificationsError && <div className="text-red-600">{notificationsError}</div>}
                    {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                      <div className="text-gray-600">No notifications</div>
                    )}
                    {!notificationsLoading && !notificationsError && notifications.length > 0 && (
                      <ul className="space-y-2">
                        {notifications.map((note) => (
                          <li key={note.id} className="border rounded-lg p-2">
                            <div className="font-medium">{note.message}</div>
                            <div className="text-xs text-gray-500">
                              {note.name} • {note.status}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(note.updatedAt || note.createdAt).toLocaleString()}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 smooth-transition"
              >
                <Person fontSize="small" />
                <span>▼</span>
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border border-gray-200 animate-fadeIn"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 smooth-transition first:rounded-t-lg"
                  >
                    <Person fontSize="small" />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 smooth-transition last:rounded-b-lg"
                  >
                    <Logout fontSize="small" />
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
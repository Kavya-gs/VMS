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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-sm">
      {/* Main Navbar */}
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div onClick={() => navigate("/dashboard")} className="flex items-center gap-3 cursor-pointer rounded-2xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm transition hover:shadow-md">
            <img src={logo} alt="logo" className="h-10 w-10 rounded-xl" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Visitor Management</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-2 lg:flex">
            {navItems.filter((item) => item.roles.includes(role)).map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition duration-300 ${
                  isActive(item.path)
                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon fontSize="small" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-2 text-slate-600 transition hover:bg-slate-100"
              >
                <NotificationsIcon fontSize="small" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-3xl border border-slate-200 bg-white shadow-lg z-50"
                  onMouseLeave={() => setNotificationsOpen(false)}
                >
                  <div className="px-5 py-4 border-b border-slate-200 text-sm font-semibold text-slate-900">Notifications</div>
                  <div className="space-y-3 p-4">
                    {notificationsLoading && <div className="text-slate-600">Loading...</div>}
                    {notificationsError && <div className="text-rose-600">{notificationsError}</div>}
                    {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                      <div className="rounded-2xl bg-slate-50 p-4 text-slate-600">No notifications yet.</div>
                    )}
                    {!notificationsLoading && !notificationsError && notifications.length > 0 && (
                      <ul className="space-y-3">
                        {notifications.map((note) => (
                          <li key={note.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="font-semibold text-slate-900">{note.message}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {note.name} • {note.status}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
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
                className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-2 text-slate-700 transition hover:bg-slate-100"
              >
                <Person fontSize="small" />
                <span className="text-xs">Account</span>
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg z-50"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Person fontSize="small" />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-rose-600 hover:bg-rose-50 transition"
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
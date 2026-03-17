import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import logo from "../../../assets/image.png";
import {
  Person,
  Logout,
  Dashboard,
  People,
  CheckCircle,
  Assessment,
  ExitToApp,
} from "@mui/icons-material";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: Dashboard },
    { label: "Visitors", path: "/visitors", icon: People },
    { label: "Check-in", path: "/checkin", icon: CheckCircle },
    { label: "Reports", path: "/reports", icon: Assessment },
    { label: "Approvals", path: "/approvals", icon: CheckCircle},
  ];

  const isActive = (path) => location.pathname === path;
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  }

  const role = localStorage.getItem("role");
  
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
            {navItems.map((item) => (
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
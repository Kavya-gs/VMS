import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: "📊" },
    { label: "Visitors", path: "/visitors", icon: "👥" },
    { label: "Check-in", path: "/checkin", icon: "📝" },
    { label: "Reports", path: "/reports", icon: "📈" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-md">
      {/* Main Navbar */}
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            className="flex cursor-pointer items-center gap-3 hover:opacity-80 smooth-transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-md">
              <span className="text-lg font-bold text-white">📋</span>
            </div>
            <h1 className="font-display text-2xl font-bold gradient-text hidden sm:block">
              VMS
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
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
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Desktop User Menu */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 smooth-transition"
              >
                <User size={20} />
                <ChevronDown size={16} />
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
                    <User size={18} />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/");
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 smooth-transition last:rounded-b-lg"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 smooth-transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white py-3 animate-slideInDown md:hidden">
            <div className="space-y-1 pb-3">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left font-medium rounded-lg smooth-transition flex items-center gap-3 ${
                    isActive(item.path)
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mobile User Menu */}
            <div className="border-t border-gray-200 pt-3 mt-3 space-y-1">
              <button
                onClick={() => {
                  navigate("/profile");
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-gray-600 hover:bg-gray-100 flex items-center gap-2 rounded-lg smooth-transition"
              >
                <User size={18} />
                Profile
              </button>
              <button
                onClick={() => {
                  navigate("/");
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-lg smooth-transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
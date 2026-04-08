import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  Phone,
  Email,
  LocationOn,
  ArrowForward,
} from "@mui/icons-material";
import logo from "../../../assets/image.png";

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Visitors", path: "/visitors" },
    { label: "Reports", path: "/reports" },
    { label: "Profile", path: "/profile" },
  ];

  const supportLinks = [
    { label: "Help Center", path: "/help" },
    { label: "Contact", path: "/contact" },
  ];

  const footerLinks = [
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Terms of Service", path: "/terms" },
    { label: "Cookie Policy", path: "/cookies" },
  ];

  return (
    <footer className="w-full bg-white border-t border-gray-200 shadow-sm mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Company */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-indigo-50">
                <img src={logo} alt="logo" className="h-10 w-10 rounded-lg" />
              </div>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed">
              Streamline visitor access with a secure and professional check-in experience.
            </p>

            {/* Social */}
            <div className="flex gap-3">
              {[Facebook, Twitter, LinkedIn, Instagram].map((Icon, idx) => (
                <div
                  key={idx}
                  className="h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
                >
                  <Icon fontSize="small" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="group flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition"
                  >
                    {link.label}
                    <ArrowForward
                      fontSize="small"
                      className="transition group-hover:translate-x-1"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Support
            </h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="group flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition"
                  >
                    {link.label}
                    <ArrowForward
                      fontSize="small"
                      className="transition group-hover:translate-x-1"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Contact Info
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="text-indigo-600 mt-1" />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm text-gray-600">+91 6679366761</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <Email className="text-indigo-600 mt-1" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-gray-600">support@vms.com</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <LocationOn className="text-indigo-600 mt-1" />
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="text-sm text-gray-600">Udyog Vihar, Gurugram</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-gray-200"></div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500">
          <p className="text-sm">
            &copy; {currentYear} Visitor Management System. All rights reserved.
          </p>

          <div className="flex gap-4">
            {footerLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="text-sm hover:text-indigo-600 transition"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
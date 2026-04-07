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
    <footer className="w-full border-t border-slate-800 bg-slate-950 text-slate-100">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 shadow-inner">
                <img src={logo} alt="logo" className="h-10 w-10 rounded-xl" />
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Streamline visitor access with a secure, polished check-in experience.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3 pt-2">
              {[
                { Icon: Facebook, href: "https://facebook.com" },
                { Icon: Twitter, href: "https://twitter.com" },
                { Icon: LinkedIn, href: "https://linkedin.com" },
                { Icon: Instagram, href: "https://instagram.com" },
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-slate-900 text-slate-400 transition hover:bg-indigo-600 hover:text-white"
                >
                  <item.Icon fontSize="small" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="group flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                  >
                    {link.label}
                    <ArrowForward
                      fontSize="small"
                      className="transform transition duration-300 group-hover:translate-x-1"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Support
            </h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="group flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                  >
                    {link.label}
                    <ArrowForward
                      fontSize="small"
                      className="transform transition duration-300 group-hover:translate-x-1"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Contact Info
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-indigo-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <a
                    href="tel:+15551234567"
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    +91 6679366761
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Email className="h-5 w-5 flex-shrink-0 text-indigo-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <a
                    href="mailto:support@vms.com"
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    support@vms.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <LocationOn className="h-5 w-5 flex-shrink-0 text-indigo-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="text-sm text-slate-400">Udyog Vihar, Gurugram</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 sm:my-10 border-t border-slate-800"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <p className="text-sm">&copy; {currentYear} Visitor Management System. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {footerLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="text-xs sm:text-sm transition hover:text-white"
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

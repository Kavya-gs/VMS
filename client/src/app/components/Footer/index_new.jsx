import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Visitors", path: "/visitors" },
    { label: "Reports", path: "/reports" },
    { label: "Settings", path: "/settings" },
  ];

  const supportLinks = [
    { label: "Help Center", path: "/help" },
    { label: "Documentation", path: "/docs" },
    { label: "Contact", path: "/contact" },
    { label: "FAQ", path: "/faq" },
  ];

  const footerLinks = [
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Terms of Service", path: "/terms" },
    { label: "Cookie Policy", path: "/cookies" },
  ];

  return (
    <footer className="w-full border-t border-gray-200 bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                <span className="text-xl font-bold text-white">📋</span>
              </div>
              <h3 className="font-display text-xl font-bold gradient-text">VMS</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Streamline your visitor check-in process with our secure and efficient platform.
            </p>
            <div className="flex gap-3 pt-2">
              {[
                { Icon: Facebook, href: "https://facebook.com" },
                { Icon: Twitter, href: "https://twitter.com" },
                { Icon: Linkedin, href: "https://linkedin.com" },
                { Icon: Instagram, href: "https://instagram.com" },
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gray-800 text-gray-400 hover:bg-indigo-600 hover:text-white hover:-translate-y-1 smooth-transition"
                >
                  <item.Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-200">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white smooth-transition"
                  >
                    {link.label}
                    <ArrowRight size={14} className="group-hover:translate-x-1 smooth-transition" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-200">Support</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white smooth-transition"
                  >
                    {link.label}
                    <ArrowRight size={14} className="group-hover:translate-x-1 smooth-transition" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-200">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <a href="tel:+15551234567" className="text-sm text-gray-400 hover:text-white smooth-transition">
                    +1 (555) 123-4567
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a href="mailto:support@vms.com" className="text-sm text-gray-400 hover:text-white smooth-transition">
                    support@vms.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 flex-shrink-0 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm text-gray-400">123 Main St, City, State</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="my-8 border-t border-gray-800"></div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} Visitor Management System. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {footerLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="text-xs sm:text-sm text-gray-400 hover:text-white smooth-transition"
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

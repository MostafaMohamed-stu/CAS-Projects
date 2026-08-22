"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../ui/Button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50" dir="ltr">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center" onClick={scrollToTop}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <img src="/sewedyLogo.png" alt="Sewedy Logo" className="w-full h-full object-contain" />
            </div>
            <div className="ml-3">
              <span className="text-xl font-bold text-gray-900">El Sewedy</span>
              <div className="text-xs text-gray-600 -mt-1 hidden sm:block">
                International School
              </div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              onClick={scrollToTop}
              className={`font-medium transition-colors relative ${
                isActive("/")
                  ? "text-[#ef3131] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#ef3131]"
                  : "text-gray-700 hover:text-[#ef3131]"
              }`}
            >
              Home
            </Link>
            <Link
              to="/contact"
              onClick={scrollToTop}
              className={`font-medium transition-colors relative ${
                isActive("/contact")
                  ? "text-[#ef3131] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#ef3131]"
                  : "text-gray-700 hover:text-[#ef3131]"
              }`}
            >
              Contact
            </Link>
            <Link to="/admin/login">
              <Button
                variant="outline"
                className="border-[#ef3131] text-[#ef3131] hover:bg-[#ef3131] hover:text-white bg-transparent font-medium"
              >
                Admin Login
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700"
            >
              {isMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className={`block px-3 py-2 font-medium transition-colors relative ${
                  isActive("/")
                    ? "text-[#ef3131] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#ef3131]"
                    : "text-gray-700 hover:text-[#ef3131]"
                }`}
                onClick={() => {
                  setIsMenuOpen(false);
                  scrollToTop();
                }}
              >
                Home
              </Link>
              <Link
                to="/contact"
                className={`block px-3 py-2 font-medium transition-colors relative ${
                  isActive("/contact")
                    ? "text-[#ef3131] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#ef3131]"
                    : "text-gray-700 hover:text-[#ef3131]"
                }`}
                onClick={() => {
                  setIsMenuOpen(false);
                  scrollToTop();
                }}
              >
                Contact
              </Link>
              <Link to="/admin/login" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full mt-2 border-[#ef3131] text-[#ef3131] hover:bg-[#ef3131] hover:text-white bg-transparent font-medium"
                >
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;

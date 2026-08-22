import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
import {
  IoDocumentTextOutline,
  IoLogOutOutline,
  IoMenuOutline,
  IoCloseOutline,
} from "react-icons/io5";

import "./Styles/SidebarLayout.css";
import "./Styles/StaffDashboard.css";
import logo from "../../Assets/logos.png";
import specialistAvatar from "../../Assets/manger.png";

const SpecialistSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsSidebarOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isSidebarOpen]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const navItems = [
    {
      path: "/specialist/report",
      label: "Submit Report",
      icon: <IoDocumentTextOutline className="nav-icon" />,
    },
  ];

  const handleNavigate = (path) => {
    setIsSidebarOpen(false);
    setTimeout(() => {
      navigate(path);
    }, 10);
  };

  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // logout() redirects to CAS directly — no navigate needed
  };

  return (
    <>
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsSidebarOpen(true)}
      >
        <IoMenuOutline />
      </button>

      <div
        className={`sidebar-backdrop ${isSidebarOpen ? "open" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="logo-container">
          <img src={logo} alt="Sewedy Electrometry" className="logo" />
          <div className="brand-text">
            <div className="brand-main">SEWEDY</div>
            <div className="brand-sub">ELECTROMETRY</div>
          </div>
          <IoCloseOutline
            className="sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
          />
        </div>
        <div className="user-profile">
          <img
            src={specialistAvatar}
            alt="Specialist"
            className="profile-pic-small"
          />
          <div>
            <p className="user-name">{user.name || "Specialist"}</p>
            <p className="user-role">Specialist</p>
          </div>
        </div>
        <nav className="nav-menu">
          <ul className="nav-submenu">
            {navItems.map((item) => (
              <li
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={location.pathname === item.path ? "active" : ""}
              >
                {item.icon} {item.label}
              </li>
            ))}
            <li style={{ listStyle: 'none' }}>
              <button
                type="button"
                onClick={handleLogout}
                className="logout-btn"
                aria-label="Logout"
              >
                <IoLogOutOutline className="nav-icon" /> Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default SpecialistSidebar;

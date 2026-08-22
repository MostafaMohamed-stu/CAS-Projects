import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  IoCalendarOutline,
  IoCreateOutline,
  IoListOutline,
  IoPersonOutline,
} from "react-icons/io5";

const items = [
  { to: "/dashboard", label: "Attendance", icon: IoCalendarOutline },
  { to: "/absence-entry", label: "Entry", icon: IoCreateOutline },
  { to: "/attendance-view", label: "Absence", icon: IoListOutline },
  { to: "/profile", label: "Profile", icon: IoPersonOutline },
];

const MobileBottomNav = () => {
  const location = useLocation();

  const isActive = (to) => {
    if (to === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname === to;
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.to);

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={active ? "mobile-bottom-nav__item is-active" : "mobile-bottom-nav__item"}
          >
            <span className="mobile-bottom-nav__icon" aria-hidden="true">
              <Icon />
            </span>
            <span className="mobile-bottom-nav__label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;

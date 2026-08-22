import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SessionManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminToken, logoutAdmin } = useAuth();

  useEffect(() => {
    const checkSessionAndRedirect = () => {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        // No token found, redirect to login if on admin pages
        if (
          location.pathname.includes("/admin") ||
          location.pathname.includes("/super-admin") ||
          location.pathname.includes("/board-admin") ||
          location.pathname.includes("/student-affair")
        ) {
          navigate("/admin/login");
        }
        return;
      }

      try {
        // Decode JWT token to get role
        const payload = JSON.parse(atob(token.split(".")[1]));
        const role = payload.role || payload.Role;

        // Check if user is on the correct dashboard for their role
        const currentPath = location.pathname;

        if (role === "SuperAdmin") {
          const allowedSuperAdminPaths = [
            "/super-admin/dashboard",
            "/admin/excel-upload",
          ];

          if (!allowedSuperAdminPaths.includes(currentPath)) {
            navigate("/super-admin/dashboard");
          }
        } else if (role === "Board") {
          if (currentPath !== "/board-admin/dashboard") {
            navigate("/board-admin/dashboard");
          }
        } else if (role === "Interviewer") {
          if (currentPath !== "/admin/dashboard") {
            navigate("/admin/dashboard");
          }
        } else if (role === "StudentAffair") {
          if (!currentPath.startsWith("/student-affair")) {
            navigate("/student-affair/search");
          }
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        // Invalid token, clear it and redirect to login
        logoutAdmin();
        navigate("/admin/login");
      }
    };

    checkSessionAndRedirect();
  }, [location.pathname, navigate, logoutAdmin, adminToken]);

  return null; // This component doesn't render anything
};

export default SessionManager;

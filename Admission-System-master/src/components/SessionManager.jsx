import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SessionManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminToken, logoutAdmin } = useAuth();

  useEffect(() => {
    const checkSessionAndRedirect = () => {
      const currentPath = location.pathname;

      if (
        currentPath === "/sso-callback" ||
        currentPath === "/admin/login" ||
        currentPath === "/reception-coordinator/login"
      ) {
        return;
      }

      const token = localStorage.getItem("adminToken");

      if (!token) {
        // No token found, redirect to login if on admin pages
        if (
          currentPath.includes("/admin") ||
          currentPath.includes("/super-admin") ||
          currentPath.includes("/board-admin") ||
          currentPath.includes("/student-affair")
        ) {
          navigate("/admin/login");
        }
        return;
      }

      try {
        // Decode JWT token to get role
        const payload = JSON.parse(atob(token.split(".")[1]));
        const role =
          payload.Role ||
          payload.role ||
          payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
          "";

        const normRole = role.toLowerCase();

        if (normRole === "superadmin") {
          const allowedSuperAdminPaths = [
            "/super-admin/dashboard",
            "/admin/excel-upload",
          ];

          if (!allowedSuperAdminPaths.includes(currentPath)) {
            navigate("/super-admin/dashboard");
          }
        } else if (normRole === "board") {
          if (currentPath !== "/board-admin/dashboard") {
            navigate("/board-admin/dashboard");
          }
        } else if (normRole === "interviewer") {
          if (currentPath !== "/admin/dashboard") {
            navigate("/admin/dashboard");
          }
        } else if (normRole === "studentaffair") {
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

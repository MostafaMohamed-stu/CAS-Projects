import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CAS_LOGIN_URL = import.meta.env.VITE_CAS_LOGIN_URL || "http://localhost:5174";
const BUSINESS_ENTITY_ID = 2;

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Already authenticated — go straight to the app
    const token = localStorage.getItem("token");
    if (token) {
      const role = (localStorage.getItem("userRole") || "").toLowerCase().replace(/\s+/g, "");
      navigate(role === "student" ? "/profile" : "/dashboard", { replace: true });
      return;
    }

    // Redirect to CAS for authentication
    const callbackUrl = `${window.location.origin}/sso-callback`;
    const casUrl = new URL(CAS_LOGIN_URL);
    casUrl.searchParams.set("redirect", callbackUrl);
    casUrl.searchParams.set("businessEntity", "Attendance");
    casUrl.searchParams.set("businessEntityId", String(BUSINESS_ENTITY_ID));

    window.location.href = casUrl.toString();
  }, [navigate]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <p style={{ color: "#64748b" }}>Redirecting to sign-in...</p>
    </div>
  );
};

export default LoginPage;

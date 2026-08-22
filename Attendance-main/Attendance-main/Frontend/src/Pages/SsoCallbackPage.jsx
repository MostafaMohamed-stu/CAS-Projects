import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Landing page for CAS SSO redirect.
 * CAS redirects here with: ?token=<jwt>&role=<role>&name=<name>&email=<email>
 * We store the token and user info in localStorage, then navigate to the app.
 */
const SsoCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    const name = params.get("name");
    const email = params.get("email");

    if (!token) {
      setError("Authentication failed: no token received. Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
      return;
    }

    try {
      // Decode and validate the JWT payload
      const parts = token.split(".");
      if (parts.length !== 3) throw new Error("Malformed token");
      const payload = JSON.parse(atob(parts[1]));

      // CAS tokens use "Role" and "AccountId" as claim names
      const userRole = (role || payload.Role || payload.role || "").toLowerCase().replace(/\s+/g, "");
      const userId = payload.AccountId || payload.accountId || "";

      if (!userRole || !userId) throw new Error("Token missing required claims");

      // Store in the same keys the rest of the app already uses
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: userId,
          name: name || payload.FullNameEn || payload.fullNameEn || "User",
          email: email || payload.Email || payload.email || "",
          role: userRole,
        })
      );

      // Clean the token out of the address bar
      window.history.replaceState(null, "", window.location.pathname);

      const target = userRole === "student" ? "/profile" : "/dashboard";
      navigate(target, { replace: true });
    } catch (e) {
      console.error("SSO callback error:", e);
      setError("Authentication failed: invalid token. Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    }
  }, [navigate]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: "12px" }}>
      {error ? (
        <p style={{ color: "#dc2626" }}>{error}</p>
      ) : (
        <p style={{ color: "#64748b" }}>Completing sign-in, please wait...</p>
      )}
    </div>
  );
};

export default SsoCallbackPage;

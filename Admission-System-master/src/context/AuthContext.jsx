"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// This module intentionally exports the provider and its paired hook.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(null);
  const [receptionCoordinatorToken, setReceptionCoordinatorToken] = useState(null);
  useEffect(() => {
    const storedAdminToken = localStorage.getItem("adminToken");
    const storedReceptionCoordinatorToken = localStorage.getItem("receptionCoordinatorToken");
    if (storedAdminToken) {
      setAdminToken(storedAdminToken);
    }
    if (storedReceptionCoordinatorToken) {
      setReceptionCoordinatorToken(storedReceptionCoordinatorToken);
    }
  }, []);

  const loginAdmin = (token) => {
    localStorage.setItem("adminToken", token);
    setAdminToken(token);
  };

  const loginReceptionCoordinator = (token) => {
    localStorage.setItem("receptionCoordinatorToken", token);
    setReceptionCoordinatorToken(token);
  };
  const logoutAdmin = () => {
    localStorage.removeItem("adminToken");
    setAdminToken(null);
  };

  const logoutReceptionCoordinator = () => {
    localStorage.removeItem("receptionCoordinatorToken");
    setReceptionCoordinatorToken(null);
  };
  const value = {
    adminToken,
    receptionCoordinatorToken,

    loginAdmin,
    loginReceptionCoordinator,

    logoutAdmin,
    logoutReceptionCoordinator,

    isAdminAuthenticated: !!adminToken,
    isReceptionCoordinatorAuthenticated: !!receptionCoordinatorToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

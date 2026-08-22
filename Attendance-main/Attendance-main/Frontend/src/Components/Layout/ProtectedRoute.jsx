import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRoleRaw = localStorage.getItem('userRole');
  const userRole = userRoleRaw ? userRoleRaw.toLowerCase().replace(/\s+/g, '') : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userRole === "superadmin") {
    return <Outlet />;
  }

  const normalizedAllowed = (allowedRoles || []).map(r => r.toLowerCase().replace(/\s+/g, ''));
  if (allowedRoles && !normalizedAllowed.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

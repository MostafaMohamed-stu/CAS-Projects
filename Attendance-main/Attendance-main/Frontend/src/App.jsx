import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import SsoCallbackPage from "./Pages/SsoCallbackPage";
import DashboardPage from "./Pages/DashboardPage";
import AbsenceViewPage from "./Pages/AbsenceViewPage";
import AbsenceRecordPage from "./Pages/AbsenceRecordPage";
import ProfilePage from "./Pages/ProfilePage";
import NotificationsPage from "./Pages/NotificationsPage";
import SidebarLayout from "./Components/Layout/SidebarLayout";
import ProtectedRoute from "./Components/Layout/ProtectedRoute";
import "./GlobalStyle.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sso-callback" element={<SsoCallbackPage />} />

        <Route element={<ProtectedRoute allowedRoles={["admin", "teacher", "engineer", "student affair", "board", "student", "superadmin"]} />}>
          <Route element={<SidebarLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/absence-entry" element={<AbsenceRecordPage />} />
            <Route path="/attendance-view" element={<AbsenceViewPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

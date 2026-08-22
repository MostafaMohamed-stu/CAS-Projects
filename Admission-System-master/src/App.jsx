import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import ApplyOptionsPage from "./pages/ApplyOptionsPage";
import VerifyStudentPage from "./pages/VerifyStudentPage";
import StudentPortalPage from "./pages/StudentPortalPage";
import CheckNationalIdPage from "./pages/CheckNationalIdPage";
import CompleteStudentInfoPage from "./pages/CompleteStudentInfoPage";
import ExamPage from "./pages/ExamPage";
import GetExamPage from "./pages/GetExamPage";
import ExamCompletedPage from "./pages/ExamCompletedPage";
import ContactPage from "./pages/ContactPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import BoardDashboardPage from "./pages/BoardDashboardPage";
import SuperAdminDashboardPage from "./pages/SuperAdminDashboardPage";
import StaffAdminSearchPage from "./pages/StudentAffairSearchPage";
import StaffAdminEditPage from "./pages/StudentAffairEditPage";

import ReceptionCoordinatorLoginPage from "./pages/ReceptionCoordinatorLoginPage";
import RegisterStudentPage from "./pages/RegisterStudentPage";
import ApplyPage from "./pages/ApplyPage";
import ExcelUploadPage from "./pages/ExcelUploadPage";
import AdmissionSsoCallbackPage from "./pages/AdmissionSsoCallbackPage";

import ScrollToTop from "./components/ScrollToTop";
import SessionManager from "./components/SessionManager";

function App() {
  // Session management is now handled by SessionManager component
  return (
    <AuthProvider>
      <Router>
        <SessionManager />
        <ScrollToTop />
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/apply-options" element={<ApplyOptionsPage />} />
            <Route path="/verify-student" element={<VerifyStudentPage />} />
            <Route path="/student-portal" element={<StudentPortalPage />} />
            <Route
              path="/check-national-id"
              element={<CheckNationalIdPage />}
            />
            <Route
              path="/complete-student-info"
              element={<CompleteStudentInfoPage />}
            />
            <Route path="/exam" element={<ExamPage />} />
            <Route path="/get-exam" element={<GetExamPage />} />
            <Route path="/exam-completed" element={<ExamCompletedPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/sso-callback" element={<AdmissionSsoCallbackPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route
              path="/board-admin/dashboard"
              element={<BoardDashboardPage />}
            />
            <Route
              path="/super-admin/dashboard"
              element={<SuperAdminDashboardPage />}
            />
            <Route
              path="/student-affair/search"
              element={<StaffAdminSearchPage />}
            />
            <Route path="/student-affair/edit" element={<StaffAdminEditPage />} />

            <Route path="/reception-coordinator/login" element={<ReceptionCoordinatorLoginPage />} />
            <Route
              path="/reception-coordinator/register-student"
              element={<RegisterStudentPage />}
            />
            <Route path="/admin/excel-upload" element={<ExcelUploadPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

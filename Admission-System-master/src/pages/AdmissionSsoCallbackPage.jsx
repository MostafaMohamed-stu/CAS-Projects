import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ADMIN_ROLES,
  getTokenRole,
  logoutFromAdmission,
  RECEPTION_COORDINATOR_ROLE,
} from "../utils/casAuth";

const AdmissionSsoCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginAdmin, loginReceptionCoordinator } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const requestedDestination = searchParams.get("destination");
    const role = searchParams.get("role") || getTokenRole(token || "");
    const isCoordinatorDestination =
      requestedDestination === "/reception-coordinator/register-student";

    console.log("[SSO Callback] token:", token ? token.substring(0, 30) + "..." : "MISSING");
    console.log("[SSO Callback] destination:", requestedDestination);
    console.log("[SSO Callback] role:", role);
    console.log("[SSO Callback] ADMIN_ROLES has role:", ADMIN_ROLES.has(role));

    if (!token || !requestedDestination) {
      setError("The CAS login response is incomplete. Please start the login again.");
      return;
    }

    if (isCoordinatorDestination) {
      if (role !== RECEPTION_COORDINATOR_ROLE) {
        setError("Signing out because this account is not a Reception Coordinator account.");
        logoutFromAdmission({ redirectToLanding: true });
        return;
      }

      localStorage.removeItem("adminToken");
      loginReceptionCoordinator(token);
      navigate("/reception-coordinator/register-student", { replace: true });
      return;
    }

    if (!ADMIN_ROLES.has(role)) {
      setError("Signing out because this account does not have access to the Admission administration portal.");
      logoutFromAdmission({ redirectToLanding: true });
      return;
    }

    localStorage.removeItem("receptionCoordinatorToken");
    loginAdmin(token);

    const dashboardByRole = {
      SuperAdmin: "/super-admin/dashboard",
      Board: "/board-admin/dashboard",
      StudentAffair: "/student-affair/search",
      Interviewer: "/admin/dashboard",
    };
    navigate(dashboardByRole[role], { replace: true });
  }, [loginAdmin, loginReceptionCoordinator, navigate, searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-xl font-semibold text-gray-900">Signing you in</h1>
        <p className="mt-3 text-gray-600">
          {error || "Completing your secure CAS sign-in..."}
        </p>
      </div>
    </main>
  );
};

export default AdmissionSsoCallbackPage;

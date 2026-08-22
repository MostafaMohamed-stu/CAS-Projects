import { useEffect } from "react";
import { redirectToCas } from "../utils/casAuth";

const ReceptionCoordinatorLoginPage = () => {
  useEffect(() => {
    redirectToCas("/reception-coordinator/register-student");
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <p className="text-gray-700">Redirecting to Central Authentication Service...</p>
    </main>
  );
};

export default ReceptionCoordinatorLoginPage;

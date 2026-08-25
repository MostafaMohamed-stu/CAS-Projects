export const CAS_URL = "http://localhost:5174";
export const ADMISSION_BUSINESS_ENTITY_ID = 6;

export const ADMIN_ROLES = new Set([
  "Interviewer",
  "Board",
  "SuperAdmin",
  "StudentAffair",
]);

export const RECEPTION_COORDINATOR_ROLE = "ReceptionCoordinator";

export function getTokenRole(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (
      payload.Role ||
      payload.role ||
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"] ||
      ""
    );
  } catch {
    return "";
  }
}

export function redirectToCas(destination) {
  const callbackUrl = new URL("/sso-callback", window.location.origin);
  callbackUrl.searchParams.set("destination", destination);

  const casLoginUrl = new URL("/login", CAS_URL);
  casLoginUrl.searchParams.set("redirect", callbackUrl.toString());
  casLoginUrl.searchParams.set("businessEntityId", ADMISSION_BUSINESS_ENTITY_ID);

  window.location.assign(casLoginUrl.toString());
}

export async function logoutFromAdmission() {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("receptionCoordinatorToken");

  if (token) {
    try {
      await fetch("http://localhost:5100/api/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
      console.warn("CAS backend logout notification failed:", e);
    }
  }

  localStorage.removeItem("adminToken");
  localStorage.removeItem("receptionCoordinatorToken");

  // Hardcoded for local testing: redirect back to Admission System landing page
  window.location.href = "http://localhost:5175";
}

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
    return payload.Role || payload.role || "";
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

export function logoutFromAdmission({ redirectToLanding = true } = {}) {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("receptionCoordinatorToken");

  const casLoginUrl = new URL("/login", CAS_URL);
  casLoginUrl.searchParams.set("prompt", "login");
  casLoginUrl.searchParams.set("logout", "true");
  casLoginUrl.searchParams.set("preserveSso", "false");
  casLoginUrl.searchParams.set("redirect", window.location.origin);
  casLoginUrl.searchParams.set("businessEntityId", ADMISSION_BUSINESS_ENTITY_ID);
  if (redirectToLanding) {
    casLoginUrl.searchParams.set("logoutRedirect", window.location.origin);
  }
  window.location.assign(casLoginUrl.toString());
}

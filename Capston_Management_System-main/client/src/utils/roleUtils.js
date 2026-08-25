/**
 * Role utility functions for checking user roles by name instead of ID
 * This solves the issue where role IDs might change but role names remain consistent
 */

/**
 * Checks if a user has a specific role by role name
 * @param {Object} user - The user object containing role information
 * @param {string} roleName - The role name to check for (case-insensitive)
 * @returns {boolean} - True if user has the role, false otherwise
 */
export const hasRole = (user, roleName) => {
  if (!user || !roleName) return false;

  // Check role name from user object (from backend API)
  const userRole = user.role || user.roleName;
  if (userRole) {
    return userRole.toLowerCase() === roleName.toLowerCase();
  }

  // No fallback - roles should come from the backend
  return false;
};

/**
 * Checks if a user is a student
 * @param {Object} user - The user object
 * @returns {boolean} - True if user is a student
 */
export const isStudent = (user) => {
  return hasRole(user, "student");
};

/**
 * Checks if a user is an engineer
 * @param {Object} user - The user object
 * @returns {boolean} - True if user is an engineer
 */
export const isEngineer = (user) => {
  return hasRole(user, "engineer");
};

/**
 * Checks if a user is a reviewer
 * @param {Object} user - The user object
 * @returns {boolean} - True if user is a reviewer
 */
export const isReviewer = (user) => {
  return hasRole(user, "reviewer");
};

/**
 * Checks if a user is a super admin or capstone lead (same permissions)
 * @param {Object} user - The user object
 * @returns {boolean} - True if user is a super admin or capstone lead
 */
export const isSuperAdmin = (user) => {
  return hasRole(user, "superadmin") || hasRole(user, "super admin") || hasRole(user, "capstonelead") || hasRole(user, "CapstoneLead");
};

/**
 * Checks if a user is a staff admin
 * @param {Object} user - The user object
 * @returns {boolean} - True if user is a staff admin
 */
export const isStaffAdmin = (user) => {
  return hasRole(user, "StaffAdmin") || hasRole(user, "staff admin");
};

/**
 * Checks if a user is a board member
 * @param {Object} user - The user object
 * @returns {boolean} - True if user is a board member
 */
export const isBoard = (user) => {
  return hasRole(user, "Board") || hasRole(user, "board");
};

/**
 * Checks if a user is a capstone lead
 * @param {Object} user - The user object
 * @returns {boolean} - True if user is a capstone lead
 */
export const isCapstoneLead = (user) => {
  return hasRole(user, "capstonelead") || hasRole(user, "capstone lead") || hasRole(user, "CapstoneLead");
};

/**
 * Gets the user's role name
 * @param {Object} user - The user object
 * @returns {string} - The role name or "Unknown"
 */
export const getUserRole = (user) => {
  console.log('getUserRole - Input user object:', user);

  if (!user) {
    console.log('getUserRole - No user provided, returning "Unknown"');
    return "Unknown";
  }

  // Return role name from user object if available
  if (user.role || user.roleName) {
    const role = user.role || user.roleName;
    console.log('getUserRole - Found role:', role);
    return role;
  }

  // No fallback - role should come from the backend
  console.log('getUserRole - No role found in user object, returning "Unknown"');
  console.log('getUserRole - User object keys:', Object.keys(user));

  return "Unknown";
};

/**
 * Checks if a user can access a specific page based on their role
 * @param {Object} user - The user object
 * @param {string} pageName - The page name to check access for
 * @returns {boolean} - True if user can access the page
 */
export const canAccessPage = (user, pageName) => {
  if (!user || !pageName) return false;

  // Define page access rules by role
  const accessRules = {
    "student": [
      "dashboard",
      "my-project",
      "phases",
      "reports",
      "task-details",
      "phase-details",
      "teams-progress",
      "team-profile",
    ],
    "engineer": [
      "dashboard",
      "phases",
      "reports",
      "task-details",
      "phase-details",
      "teams-progress",
      "view-tasks",
      "admin-tasks",
      "super-admin",
      "team-profile",
      "user-reports",
      "my-assigned-tasks",
      "team-submissions",
    ],
    "reviewer": [
      "dashboard",
      "phases",
      "reports",
      "task-details",
      "phase-details",
      "teams-progress",
      "view-tasks",
      "admin-tasks",
      "super-admin",
      "team-profile",
    ],
    "superadmin": [
      "dashboard",
      "phases",
      "reports",
      "task-details",
      "phase-details",
      "teams-progress",
      "view-tasks",
      "admin-tasks",
      "super-admin",
      "team-profile",
      "user-reports",
      "my-assigned-tasks",
      "engineers-tasks",
      "team-submissions",
    ],
    "capstonelead": [
      "dashboard",
      "phases",
      "reports",
      "task-details",
      "phase-details",
      "teams-progress",
      "view-tasks",
      "admin-tasks",
      "super-admin",
      "team-profile",
      "user-reports",
      "my-assigned-tasks",
      "engineers-tasks",
      "team-submissions",
    ],
    "capstone lead": [
      "dashboard",
      "phases",
      "reports",
      "task-details",
      "phase-details",
      "teams-progress",
      "view-tasks",
      "admin-tasks",
      "super-admin",
      "team-profile",
      "user-reports",
      "my-assigned-tasks",
      "engineers-tasks",
      "team-submissions",
    ],
    "CapstoneLead": [
      "dashboard",
      "phases",
      "reports",
      "task-details",
      "phase-details",
      "teams-progress",
      "view-tasks",
      "admin-tasks",
      "super-admin",
      "team-profile",
      "user-reports",
      "my-assigned-tasks",
      "engineers-tasks",
      "team-submissions",
    ],
    "staff admin": [
      "dashboard",
      "phases",
      "reports",
      "task-details",
      "phase-details",
      "teams-progress",
      "view-tasks",
      "admin-tasks",
      "super-admin",
      "staff-admin",
      "team-profile",
      "user-reports",
      "my-assigned-tasks",
    ],
    "staffadmin": [
      "dashboard",
      "phases",
      "reports",
      "task-details",
      "phase-details",
      "teams-progress",
      "view-tasks",
      "admin-tasks",
      "super-admin",
      "staff-admin",
      "team-profile",
      "user-reports",
      "my-assigned-tasks",
    ],
    "board": [
      "dashboard",
      "phases",
      "reports",
      "task-details",
      "phase-details",
      "teams-progress",
      "view-tasks",
      "admin-tasks",
      "team-profile",
      "user-reports",
    ]
  };

  const userRole = getUserRole(user).toLowerCase();
  const allowedPages = accessRules[userRole] || [];

  return allowedPages.includes(pageName.toLowerCase());
};
export const isStudent = (user) => {
    const roles = user?.roles || [user?.role];
    return roles.some(role => role?.toLowerCase() === 'student');
};

export const isTeacher = (user) => {
    const roles = user?.roles || [user?.role];
    return roles.some(role => role?.toLowerCase() === 'teacher');
};

export const isSuperAdmin = (user) => {
    const roles = user?.roles || [user?.role];
    return roles.some(role => role?.toLowerCase() === 'superadmin' || role?.toLowerCase() === 'admin');
};

// Fallbacks for roles used in the provided sidebar template
export const isEngineer = (user) => false;
export const isReviewer = (user) => false;
export const isStaffAdmin = (user) => false;
export const isBoard = (user) => false;

/**
 * Status Constants for Frontend
 * This file contains all status IDs used in the frontend to match the backend StatusConstants
 */

export const STATUS_CONSTANTS = {
  // General Status IDs
  ACTIVE: 1,
  INACTIVE: 2,

  // Task Status IDs
  TASK_PENDING: 1,
  TASK_IN_PROGRESS: 2,
  TASK_COMPLETED: 12,
  TASK_REJECTED: 6,
  TASK_SUBMITTED_ON_TIME: 10,
  TASK_SUBMITTED_LATE: 11,
  TASK_COMPLETED_LATE: 13,

  // Report Status IDs
  REPORT_SUBMITTED: 1,
  REPORT_CONFIRMED: 5,

  // Grade Status IDs
  GRADE_ACTIVE: 1,

  // Account Status IDs
  ACCOUNT_ACTIVE: 1,
  ACCOUNT_INACTIVE: 2,

  // Role IDs (for reference)
  ROLE_SUPERVISOR: 3,
  ROLE_TEACHER: 4,
  ROLE_ENGINEER: 5,
  ROLE_BOARD: 26,
};

/**
 * Helper functions for status management
 */
export const StatusHelpers = {
  /**
   * Gets the appropriate task status based on submission timing
   * @param {boolean} isLate - Whether the submission is late
   * @returns {number} Status ID for submission timing
   */
  getTaskSubmissionStatus: (isLate) => {
    return isLate ? STATUS_CONSTANTS.TASK_SUBMITTED_LATE : STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME;
  },

  /**
   * Gets the appropriate task completion status based on timing
   * @param {boolean} isCompletedLate - Whether the completion is late
   * @returns {number} Status ID for completion timing
   */
  getTaskCompletionStatus: (isCompletedLate) => {
    return isCompletedLate ? STATUS_CONSTANTS.TASK_COMPLETED_LATE : STATUS_CONSTANTS.TASK_COMPLETED;
  },

  /**
   * Gets the default report status
   * @returns {number} Default report status ID
   */
  getDefaultReportStatus: () => {
    return STATUS_CONSTANTS.REPORT_SUBMITTED;
  },

  /**
   * Gets status text based on status ID
   * @param {number} statusId - The status ID
   * @param {string} deadline - The deadline string (optional)
   * @param {boolean} isPendingTask - Whether this is a pending task
   * @param {boolean} isLateFromServer - Whether the server has determined this is late (preferred)
   * @param {string} submittedDate - The submission date string (optional)
   * @returns {string} Status text
   */
  getStatusText: (statusId, deadline = null, isPendingTask = false, isLateFromServer = null, submittedDate = null) => {
    console.log("StatusHelpers.getStatusText - statusId:", statusId, "deadline:", deadline, "isPendingTask:", isPendingTask, "isLateFromServer:", isLateFromServer);
    
    // Handle pending tasks without submissions
    if (isPendingTask) {
      if (deadline && isDeadlinePassed(deadline, isLateFromServer)) {
        return "Deadline Passed";
      }
      return "Pending";
    }
    
    const isSubmissionVeryLate = (submittedDate, deadline) => {
      if (!submittedDate || !deadline) return false
      const submissionDate = new Date(submittedDate)
      const deadlineDate = new Date(deadline)
      const daysLate = Math.ceil((submissionDate - deadlineDate) / (1000 * 60 * 60 * 24))
      return daysLate > 3
    }

    switch (statusId) {
      case STATUS_CONSTANTS.TASK_COMPLETED:
        if (submittedDate && deadline && new Date(submittedDate) > new Date(deadline)) {
          if (isSubmissionVeryLate(submittedDate, deadline)) return "Completed Very Late"
          return "Completed Late";
        }
        return deadline && isDeadlinePassed(deadline, isLateFromServer) ? "Completed Late" : "Completed";
      case STATUS_CONSTANTS.TASK_REJECTED:
        console.log("StatusHelpers.getStatusText - TASK_REJECTED case matched, returning 'Rejected'");
        return "Rejected";
      case STATUS_CONSTANTS.TASK_COMPLETED_LATE:
        if (submittedDate && deadline && isSubmissionVeryLate(submittedDate, deadline)) {
          return "Completed Very Late"
        }
        return "Completed Late";
      case STATUS_CONSTANTS.TASK_SUBMITTED_LATE:
        if (submittedDate && deadline && isSubmissionVeryLate(submittedDate, deadline)) {
          return "Submitted Very Late"
        }
        return "Submitted Late";
      case STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME:
        if (submittedDate && deadline && new Date(submittedDate) > new Date(deadline)) {
          if (isSubmissionVeryLate(submittedDate, deadline)) return "Submitted Very Late"
          return "Submitted Late";
        }
        return deadline && isDeadlinePassed(deadline, isLateFromServer) ? "Submitted Late" : "Submitted On Time";
      case STATUS_CONSTANTS.TASK_PENDING:
        return "Pending";
      default:
        return "Pending";
    }
  },

  /**
   * Gets status color based on status ID
   * @param {number} statusId - The status ID
   * @param {string} deadline - The deadline string (optional)
   * @param {boolean} isPendingTask - Whether this is a pending task
   * @param {boolean} isLateFromServer - Whether the server has determined this is late (preferred)
   * @returns {string} Status color
   */
  getStatusColor: (statusId, deadline = null, isPendingTask = false, isLateFromServer = null) => {
    // Handle pending tasks without submissions
    if (isPendingTask) {
      if (deadline && isDeadlinePassed(deadline, isLateFromServer)) {
        return "#e53e3e"; // Red for deadline passed
      }
      return "#d69e2e"; // Yellow for pending
    }
    
    switch (statusId) {
      case STATUS_CONSTANTS.TASK_COMPLETED:
        return deadline && isDeadlinePassed(deadline, isLateFromServer) ? "#d69e2e" : "#38a169"; // Yellow for late, Green for on-time
      case STATUS_CONSTANTS.TASK_REJECTED:
        return "#e53e3e"; // Red
      case STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME:
        return deadline && isDeadlinePassed(deadline, isLateFromServer) ? "#e53e3e" : "#3182ce"; // Red for late, Blue for on-time
      case STATUS_CONSTANTS.TASK_SUBMITTED_LATE:
        return "#e53e3e"; // Red for Submitted Late
      case STATUS_CONSTANTS.TASK_COMPLETED_LATE:
        return "#d69e2e"; // Yellow for Completed Late
      case STATUS_CONSTANTS.TASK_PENDING:
        return "#d69e2e"; // Yellow
      default:
        return "#d69e2e"; // Yellow
    }
  }
};

/**
 * Helper function to check if deadline has passed
 * WARNING: This function uses client-side time which can be manipulated by users
 * For security, always rely on server-side deadline validation
 * @param {string} deadlineString - The deadline string
 * @param {boolean} isLateFromServer - Whether the server has determined this is late (preferred)
 * @returns {boolean} Whether the deadline has passed
 */
const isDeadlinePassed = (deadlineString, isLateFromServer = null) => {
  // If server has already determined the status, use that (more secure)
  if (isLateFromServer !== null) {
    return isLateFromServer;
  }
  
  // Fallback to client-side check (less secure, can be manipulated)
  if (!deadlineString) return false;
  
  try {
    const deadline = new Date(deadlineString);
    const now = new Date();
    return now > deadline;
  } catch (error) {
    console.error("Error checking deadline:", error);
    return false;
  }
};

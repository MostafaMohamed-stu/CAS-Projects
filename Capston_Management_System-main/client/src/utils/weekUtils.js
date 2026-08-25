/**
 * Week utility functions for calculating current week and date ranges
 * Centralized logic to avoid code duplication across components
 */

/**
 * Course start date - September 21, 2025 (first week starts from this date)
 * Month is 0-indexed, so September is 8
 */
const COURSE_START_DATE = new Date(2025, 8, 21); // September 21, 2025

/**
 * Calculate the current week number based on the course start date
 * @returns {number} - Current week number (minimum 1)
 */
export const getCurrentWeekNumber = () => {
  const now = new Date();
  // If we are before the course start, there is no current week yet
  if (now < COURSE_START_DATE) {
    return 0; // represent "no current week"
  }
  const diffTime = now.getTime() - COURSE_START_DATE.getTime();
  const fullWeeksElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  // Weeks are 1-based once the course starts
  return fullWeeksElapsed + 1;
};

/**
 * Get the date range for a specific week number
 * @param {number} weekNumber - The week number (1-based)
 * @returns {Object} - Object containing start and end dates
 */
export const getWeekDateRange = (weekNumber) => {
  const startDate = new Date(COURSE_START_DATE);
  startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  return {
    start: startDate,
    end: endDate
  };
};

/**
 * Check if a given date falls within a specific week
 * @param {Date} date - The date to check
 * @param {number} weekNumber - The week number to check against
 * @returns {boolean} - True if date falls within the week
 */
export const isDateInWeek = (date, weekNumber) => {
  const weekRange = getWeekDateRange(weekNumber);
  return date >= weekRange.start && date <= weekRange.end;
};

/**
 * Get the week number for a given date
 * @param {Date} date - The date to get week number for
 * @returns {number} - Week number (minimum 1)
 */
export const getWeekNumberForDate = (date) => {
  if (date < COURSE_START_DATE) {
    return 0;
  }
  const diffTime = date.getTime() - COURSE_START_DATE.getTime();
  const fullWeeksElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  return fullWeeksElapsed + 1;
};

/**
 * Check if the current date is within the current week range
 * @returns {boolean} - True if current date is within current week
 */
export const isCurrentDateInCurrentWeek = () => {
  const currentWeek = getCurrentWeekNumber();
  const now = new Date();
  if (currentWeek === 0) return false;
  return isDateInWeek(now, currentWeek);
};

/**
 * Get course start date (for reference)
 * @returns {Date} - Course start date
 */
export const getCourseStartDate = () => {
  return new Date(COURSE_START_DATE);
};

/**
 * Get total number of weeks in the course
 * @returns {number} - Total weeks (default 10)
 */
export const getTotalWeeks = () => {
  return 10;
};

/**
 * Group tasks by week number
 * @param {Array} tasks - Array of tasks
 * @param {number} maxWeeks - Maximum number of weeks to group (default 10)
 * @returns {Object} - Object with week numbers as keys and task arrays as values
 */
export const groupTasksByWeek = (tasks, maxWeeks = 10) => {
  const grouped = {};
  
  // Initialize all weeks
  for (let week = 1; week <= maxWeeks; week++) {
    grouped[week] = [];
  }
  
  // Group tasks by their week number
  tasks.forEach(task => {
    const weekNumber = task.weekNumber || task.WeekNumber || 1;
    if (weekNumber >= 1 && weekNumber <= maxWeeks) {
      grouped[weekNumber].push(task);
    }
  });
  
  return grouped;
};

/**
 * Get the minimum allowed date for a deadline based on the selected week
 * @param {number} weekNumber - The week number
 * @returns {string} - ISO string format for datetime-local input min attribute
 */
export const getMinDeadlineForWeek = (weekNumber) => {
  const weekRange = getWeekDateRange(weekNumber);
  const now = new Date();
  
  // Use the later of: current time or start of the selected week
  const minDate = now > weekRange.start ? now : weekRange.start;
  
  // Format for datetime-local input (YYYY-MM-DDTHH:mm)
  return minDate.toISOString().slice(0, 16);
};

/**
 * Validate if a deadline is valid for the selected week
 * @param {string} deadline - The deadline string
 * @param {number} weekNumber - The week number
 * @returns {Object} - { isValid: boolean, errorMessage: string }
 */
export const validateDeadlineForWeek = (deadline, weekNumber) => {
  if (!deadline) {
    return { isValid: false, errorMessage: "Deadline is required" };
  }
  
  const selectedDate = new Date(deadline);
  const now = new Date();
  const weekRange = getWeekDateRange(weekNumber);
  
  // Check if deadline is in the past
  if (selectedDate <= now) {
    return { isValid: false, errorMessage: "Deadline cannot be in the past" };
  }
  
  // Check if deadline is before the start of the selected week
  if (selectedDate < weekRange.start) {
    return { 
      isValid: false, 
      errorMessage: `Deadline cannot be before the start of Week ${weekNumber} (${weekRange.start.toLocaleDateString()})` 
    };
  }
  
  return { isValid: true, errorMessage: "" };
};

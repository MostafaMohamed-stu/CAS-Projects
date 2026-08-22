import api from './api';

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
};

export const attendanceService = {
  getDailyReport: async (date) => {
    try {
      const response = await api.get(`/api/Attendance/daily-report`, {
        params: { date },
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching daily attendance report:", error);
      throw error;
    }
  },

  getAbsentRecords: async () => {
    try {
      const response = await api.get(`/api/Attendance/absent-records`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching absent records:", error);
      throw error;
    }
  },

  getByClassSession: async (classId, sessionNumber, date) => {
    try {
      const response = await api.get(`/api/Attendance/by-class-session`, {
        params: { classId, sessionNumber, date },
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching attendance by class session:", error);
      throw error;
    }
  },

  getTrends: async (fromDate, toDate) => {
    try {
      const response = await api.get(`/api/Attendance/trends`, {
        params: { fromDate, toDate },
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching attendance trends:", error);
      throw error;
    }
  },

  getClassPerformance: async () => {
    try {
      const response = await api.get(`/api/Attendance/class-performance`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching class performance data:", error);
      throw error;
    }
  },

  getAtRiskStudents: async () => {
    try {
      const response = await api.get(`/api/Attendance/at-risk-students`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching at-risk students:", error);
      throw error;
    }
  },
};

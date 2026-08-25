import axios from "axios";
import { currentConfig, debugError } from "./config.js";

// Create axios instance with environment-aware configuration
const api = axios.create({
  baseURL: currentConfig.apiBaseUrl,
  timeout: currentConfig.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth tokens
api.interceptors.request.use(
  (config) => {
    // Don't add auth headers for student validation and exam submission endpoints
    if (
      config.url &&
      (config.url.includes("/Student/validate/") ||
        config.url.includes("/Student/validate-exam/") ||
        config.url.includes("/Student/submit-exam"))
    ) {
      return config;
    }

    const adminToken = localStorage.getItem("adminToken");
    const receptionCoordinatorToken = localStorage.getItem("receptionCoordinatorToken");
    const studentToken = localStorage.getItem("studentToken");

    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (receptionCoordinatorToken) {
      config.headers.Authorization = `Bearer ${receptionCoordinatorToken}`;
    } else if (studentToken && config.url && config.url.includes("/Student/")) {
      // Add student token for student API calls
      config.headers.Authorization = `Bearer ${studentToken}`;
    }

    return config;
  },
  (error) => {
    debugError("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    debugError("API Response Error:", error);

    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      localStorage.removeItem("adminToken");
      localStorage.removeItem("receptionCoordinatorToken");
      localStorage.removeItem("studentToken");

      localStorage.removeItem("studentNationalId");
      localStorage.removeItem("examStudentData");

      // Redirect based on current page
      if (window.location.pathname.includes("/admin")) {
        window.location.href = "/admin/login";
      } else if (window.location.pathname.includes("/reception-coordinator")) {
        window.location.href = "/reception-coordinator/login";
      } else {
        window.location.href = "/verify-student";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  receptionCoordinatorLogin: (credentials) => api.post("/Auth/reception-coordinator/login", credentials),
  adminLogin: (credentials) => api.post("/Auth/admin/login", credentials),
};

// Reception Coordinator API
export const receptionCoordinatorAPI = {
  registerStudent: (studentData) =>
    api.post("/reception-coordinator/register-student", studentData),

  getStudents: () => api.get("/reception-coordinator/students"),
};

// Student API
export const studentAPI = {
  validateNationalId: (nationalId) =>
    api.get(`/Student/validate/${nationalId}`),
  validateForExam: (nationalId) =>
    api.get(`/Student/validate-exam/${nationalId}`),
  getPortal: (nationalId) =>
    api.get(`/Student/portal/${nationalId}`),
  completeInfo: (studentInfo) =>
    api.post("/Student/complete-info", studentInfo),
  uploadDocument: (file, nationalId, documentType) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(
      `/Student/upload-document?nationalId=${nationalId}&documentType=${documentType}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },
};

// Admin API
export const adminAPI = {
  getAllStudents: () => api.get("/Admin/students"),

  getStudentsPaginated: (params) =>
    api.get("/Admin/students/paginated", { params }),

  filterStudents: (filters) =>
    api.get("/Admin/students/filter", { params: filters }),

  setInterviewScore: (studentId, score) =>
    api.post(`/Admin/student/${studentId}/my-interview-score`, score),

  updateStudentStatus: (studentId, status) =>
    api.put(`/Admin/student/${studentId}/status`, { Status: status }),

  exportStudentsToExcel: (columns, exportOptions = {}) =>
    api.post(
      "/Admin/export-students-excel",
      { columns, ...exportOptions },
      { responseType: "blob" }
    ),

  getExportColumns: () => api.get("/Admin/export-students-columns"),

  getAdmissionSettings: () => api.get("/admin/settings"),

  saveAdmissionSettings: (settings) => api.post("/admin/settings", settings),
};

// Student Affair API
export const studentAffairAPI = {
  searchStudent: (nationalId) =>
    api.get(`/student-affair/search-student/${nationalId}`),
  searchByName: (query) =>
    api.get("/student-affair/search-by-name", { params: { query } }),
  updateStudent: (nationalId, updateData) =>
    api.put(`/student-affair/update-student/${nationalId}`, updateData),
};

// Exam API
export const examAPI = {
  importQuestions: (formData) =>
    api.post("/Exam/import-questions", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  getSections: () => api.get("/Exam/sections"),
  getSectionsWithSchoolType: (nationalId) =>
    api.get(`/Exam/sections/${nationalId}`),
  getQuestionsBySection: (sectionName) =>
    api.get(`/Exam/questions/${sectionName}`),
  getQuestionsBySectionWithSchoolType: (sectionName, nationalId) =>
    api.get(`/Exam/questions/${sectionName}/${nationalId}`),
  getExamTiming: (nationalId) => api.get(`/Exam/timing/${nationalId}`),
  getExamResults: (nationalId) => api.get(`/Exam/results/${nationalId}`),
  getStudentAnswers: (nationalId) => api.get(`/Exam/answers/${nationalId}`),
  getAllResults: () => api.get("/Exam/all-results"),
  requestTimeExtension: (data) => api.post("/Exam/request-extension", {
    NationalId: data.nationalId,
    CoordinatorEmail: data.coordinatorEmail,
    CoordinatorPassword: data.coordinatorPassword,
    ExtensionMinutes: data.extensionMinutes
  }),
  submitAnswers: (data) => api.post("/Exam/submit-answers", data),
};

export default api;

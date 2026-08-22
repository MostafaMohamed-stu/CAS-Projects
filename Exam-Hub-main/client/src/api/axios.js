import axios from 'axios';
import { storage } from "../utils/storage";
// Use environment variable in production. Ensure .env.production sets REACT_APP_API_BASE_URL
// Fallback to relative path /api if not set, or localhost if needed
// const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5077';

const api = axios.create({
  // baseURL: `https://exam.sewedy.com.eg/api`,
  baseURL: `http://localhost:5500/api`,
  timeout: 15000,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {

    const token = storage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRedirecting = false;

// Response interceptor for handling errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized access
    if (error.response?.status === 401) {
      storage.removeItem('token');
      storage.removeItem('user');
      storage.removeItem('userRole');
      storage.removeItem('userName');

      if (!isRedirecting && !window.location.pathname.includes('/sso-callback')) {
        isRedirecting = true;
        const casUrl = 'http://localhost:5174';
        const callbackUrl = encodeURIComponent(`${window.location.origin}/sso-callback`);
        window.location.href = `${casUrl}/login?redirect=${callbackUrl}&businessEntityId=9`;
      }
    }

    // Log detailed error information
    console.error('API Request Failed:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });

    return Promise.reject(error);
  }
);


export default api;

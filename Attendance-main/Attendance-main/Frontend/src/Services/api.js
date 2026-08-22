import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return '/';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
});

// Separate axios instance that talks directly to the CAS backend
const CAS_API_URL = import.meta.env.VITE_CAS_API_URL || 'http://localhost:5148';
export const casApi = axios.create({
  baseURL: CAS_API_URL,
  timeout: 10000,
});

// Call CAS backend logout to revoke the token server-side
export const casLogout = async (token) => {
  if (!token) return;
  try {
    await casApi.post('/api/Auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    // Non-critical — still clear local storage even if CAS call fails
    console.warn('[CAS] Logout call failed:', err?.response?.data || err.message);
  }
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      // Also clear CAS SSO so the next login goes through CAS again
      localStorage.removeItem('cas_sso_token');
      localStorage.removeItem('cas_jwt_token');
      localStorage.removeItem('cas_user_info');
      sessionStorage.removeItem('cas_redirect_url');
      sessionStorage.removeItem('cas_requested_entity');
      sessionStorage.removeItem('cas_business_entity_id');
      sessionStorage.removeItem('cas_is_prompt_login');
      localStorage.setItem('cas_logged_out', 'true');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

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

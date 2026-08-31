import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig.js';
import { withSecureErrorHandling, sanitizeError } from './secureErrorHandler.js';

// Token configuration
const ACCESS_TOKEN_LIFETIME_MINUTES = 15; // Backend token lifetime
const REFRESH_BEFORE_EXPIRY_MINUTES = 1; // Refresh 1 minute before expiry
const REFRESH_DELAY_MS = (ACCESS_TOKEN_LIFETIME_MINUTES - REFRESH_BEFORE_EXPIRY_MINUTES) * 60 * 1000; // 14 minutes

// In-memory state for tokens and user data
let accessToken = localStorage.getItem('accessToken') || localStorage.getItem('token') || null;
let userData = null;
let isRefreshing = false;
let refreshTimeout = null;
let refreshPromise = null;

const clearLegacyStorage = () => {
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    sessionStorage.clear();
  } catch (error) {}
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Function to set access token and schedule refresh
const setAccessTokenAndScheduleRefresh = (token) => {
  // Only update if token is actually different
  if (accessToken === token) {
    return;
  }
  
  accessToken = token; if (token) { localStorage.setItem('accessToken', token); localStorage.setItem('token', token); } else { localStorage.removeItem('accessToken'); localStorage.removeItem('token'); }
  // Clear existing timeout
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  
  // Schedule refresh 1 minute before expiration (14 minutes after creation)
  // This ensures tokens are refreshed before they expire (15 minutes)
  // Backend generates access tokens with 15-minute expiration
  if (token) {
    refreshTimeout = setTimeout(async () => {
      // Check if we're already refreshing
      if (isRefreshing) {
        return;
      }
      
      try {
        if (import.meta.env.MODE === 'development' === 'development') {
          console.log('Access token expiring soon, refreshing...');
        }
        await refreshToken();
      } catch (error) {
        if (import.meta.env.MODE === 'development' === 'development') {
          console.error('Failed to refresh token:', error);
        }
        // Clear tokens on refresh failure
        accessToken = null;
        userData = null;
      }
    }, REFRESH_DELAY_MS); // 14 minutes (840 seconds)
  }
};

// Function to refresh token
const refreshToken = async () => {
  if (isRefreshing) {
    return;
  }
  
  isRefreshing = true;
  
  try {
    const response = await apiClient.post('/Account/Refresh');
    if (response.data.accessToken) {
      setAccessTokenAndScheduleRefresh(response.data.accessToken);
      if (response.data.user) {
        userData = response.data.user;
      }
    }
  } catch (error) {
    // Clear tokens on refresh failure
    accessToken = null;
    userData = null;
    clearLegacyStorage();
    throw error;
  } finally {
    isRefreshing = false;
  }
};

apiClient.interceptors.request.use(
  (config) => {
    const token = accessToken || localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If rate limited, surface a clear message and do NOT attempt refresh
    if (error.response?.status === 429) {
      const msg = error.response?.data?.message || 'Too many requests. Please try again later.';
      const retryAfterHeader = error.response?.headers?.['retry-after'] || error.response?.headers?.['Retry-After'];
      const retryAfter = parseInt(retryAfterHeader || '60', 10);
      const rateLimitError = new Error(msg);
      rateLimitError.isRateLimited = true;
      rateLimitError.retryAfter = isNaN(retryAfter) ? 60 : retryAfter;
      rateLimitError.original = error;
      return Promise.reject(rateLimitError);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do not attempt refresh for login/refresh endpoints
      const url = (originalRequest?.url || '').toLowerCase();
      const isAuthEndpoint = url.includes('/account/login') || url.includes('/account/refresh');
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      if (import.meta.env.MODE === 'development' === 'development') {
        console.log('🔄 401 error detected, attempting token refresh...');
      }

      // If a refresh is already in progress, wait for it instead of dropping the request
      if (!refreshPromise) {
        refreshPromise = refreshToken().finally(() => {
          refreshPromise = null;
        });
      }

      try {
        await refreshPromise;

        if (accessToken) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        if (import.meta.env.MODE === 'development' === 'development') {
          console.error('❌ Token refresh failed in interceptor:', refreshError.message);
        }
        accessToken = null;
        userData = null;
        clearLegacyStorage();
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // This service now stores and manages dynamic user data from login
  // No more hardcoded IDs or fallback values
  async login(email, password) {
    try {
      const response = await apiClient.post('/Account/Login', { email, password });
      if (response.data.accessToken) {
        setAccessTokenAndScheduleRefresh(response.data.accessToken);
        if (response.data.user) {
          userData = response.data.user;
        }
      }
      return response.data;
    } catch (error) {
      // Preserve rate-limit errors with countdown info
      if (error && error.isRateLimited) {
        throw error;
      }
      // Sanitize error for production security
      const sanitizedError = sanitizeError(error, 'Login');
      throw sanitizedError;
    }
  },

  async refreshToken() {
    return await refreshToken();
  },

  async logout() {
    try {
      await apiClient.post('/Account/Logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        refreshTimeout = null;
      }
      accessToken = null;
      userData = null;
      clearLegacyStorage();
      const casUrl = 'http://localhost:5174';
      const callbackUrl = encodeURIComponent(`${window.location.origin}/sso-callback`);
      window.location.href = `${casUrl}/login?prompt=login&redirect=${callbackUrl}&businessEntityId=3`;
    }
  },

  getAccessToken() {
    return accessToken || localStorage.getItem('accessToken') || localStorage.getItem('token');
  },

  isAuthenticated() {
    const token = this.getAccessToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      return Date.now() < expirationTime;
    } catch (error) {
      return false;
    }
  },

  getStoredUser() {
    if (userData) return userData;
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || localStorage.getItem('userRole') || 'Student';
      const id = payload.sub || payload.id || payload.nameid || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      const email = payload.email || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || localStorage.getItem('userEmail');
      const name = payload.FullNameEn || payload.FullNameAr || payload.name || localStorage.getItem('userName') || email || 'User';
      return { id, role, email, name, fullNameEn: name, fullNameAr: name };
    } catch (e) {
      return null;
    }
  },

  storeUser(userDataParam) {
    userData = userDataParam;
  },

  getAccessToken() { return accessToken || localStorage.getItem('accessToken') || localStorage.getItem('token'); },

  setAccessToken(token) {
    setAccessTokenAndScheduleRefresh(token);
  },

  clearAuth() {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
    accessToken = null;
    userData = null;
    // Clear all dynamic user data when logging out
  },

  isTokenExpiringSoon() {
    if (!accessToken) return true;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const checkTime = Date.now() + (REFRESH_BEFORE_EXPIRY_MINUTES * 60 * 1000);
      return expirationTime < checkTime;
    } catch (error) {
      return true;
    }
  },

  async refreshTokenIfNeeded() {
    if (this.isTokenExpiringSoon()) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Proactive token refresh failed:', error);
      }
    }
  }
};

// Export the axios instance with JWT authentication
export const axiosInstance = apiClient;

// Note: This service now manages dynamic user authentication
// No more hardcoded IDs or fallback values

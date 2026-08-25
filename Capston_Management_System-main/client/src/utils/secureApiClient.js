import axios from 'axios';
import { API_BASE_URL, API_CONFIG } from '../config/apiConfig.js';
import { withSecureErrorHandling, sanitizeError } from './secureErrorHandler.js';

/**
 * Secure API Client
 * Wraps axios with security features to prevent information leakage
 */

// Create base axios instance
const secureApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: API_CONFIG.API_TIMEOUT || 10000,
});

// Request interceptor - add security headers
secureApiClient.interceptors.request.use(
  (config) => {
    // Add security headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // Remove sensitive information from URLs in production
    if (!API_CONFIG.DEBUG) {
      // Log only generic information
      console.log('API Request initiated');
    } else {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(sanitizeError(error, 'Request Interceptor'));
  }
);

// Response interceptor - sanitize errors
secureApiClient.interceptors.response.use(
  (response) => {
    // Log success only in development
    if (API_CONFIG.DEBUG) {
      console.log('API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    // Sanitize all errors for production
    const sanitizedError = sanitizeError(error, 'Response Interceptor');
    
    // Log detailed error only in development
    if (API_CONFIG.DEBUG) {
      console.error('API Error:', error);
    }
    
    return Promise.reject(sanitizedError);
  }
);

/**
 * Secure API methods with error sanitization
 */
export const secureApi = {
  get: withSecureErrorHandling(
    (url, config) => secureApiClient.get(url, config),
    'GET Request'
  ),
  
  post: withSecureErrorHandling(
    (url, data, config) => secureApiClient.post(url, data, config),
    'POST Request'
  ),
  
  put: withSecureErrorHandling(
    (url, data, config) => secureApiClient.put(url, data, config),
    'PUT Request'
  ),
  
  delete: withSecureErrorHandling(
    (url, config) => secureApiClient.delete(url, config),
    'DELETE Request'
  ),
  
  patch: withSecureErrorHandling(
    (url, data, config) => secureApiClient.patch(url, data, config),
    'PATCH Request'
  ),
};

/**
 * Secure API calls for common operations
 */
export const secureApiCalls = {
  // Authentication
  login: (credentials) => secureApi.post('/Account/Login', credentials),
  logout: () => secureApi.post('/Account/Logout'),
  refresh: () => secureApi.post('/Account/Refresh'),
  
  // Teams
  getTeamsByLeader: (leaderId) => secureApi.get(`/Teams/ByLeader/${leaderId}`),
  getTeams: () => secureApi.get('/Teams'),
  
  // Tasks
  getTasks: () => secureApi.get('/Tasks'),
  getTaskById: (id) => secureApi.get(`/Tasks/${id}`),
  
  // Generic secure request
  request: (config) => withSecureErrorHandling(
    () => secureApiClient(config),
    'Custom Request'
  )(),
};

export default secureApiClient;

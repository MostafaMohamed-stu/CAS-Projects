// Simple API Configuration
// Easy to modify for different environments

// Change this to switch between development and production
const CURRENT_ENV = 'development'; // Change to 'production' when deploying

const config = {
  development: {
    API_BASE_URL: 'http://localhost:5400/api',
    API_TIMEOUT: 10000,
    DEBUG: true
  },
  production: {
    API_BASE_URL: 'http://sewedycapstoneback.runasp.net/api', // Replace with your production URL
    API_TIMEOUT: 20000,
    DEBUG: false
  }
};

// Export the current environment configuration
export const API_CONFIG = config[CURRENT_ENV];

// Export individual values for convenience
export const API_BASE_URL = API_CONFIG.API_BASE_URL;
export const API_TIMEOUT = API_CONFIG.API_TIMEOUT;
export const DEBUG = API_CONFIG.DEBUG;

// Export the current environment for debugging
export const CURRENT_ENVIRONMENT = CURRENT_ENV;

// Helper function to check if we're in development mode
export const isDevelopment = () => CURRENT_ENV === 'development';

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Helper function to log API calls in development
export const logApiCall = (method, url, data = null) => {
  if (DEBUG) {
    console.log(`🌐 API Call: ${method} ${url}`, data ? { data } : '');
  }
};

export default API_CONFIG;

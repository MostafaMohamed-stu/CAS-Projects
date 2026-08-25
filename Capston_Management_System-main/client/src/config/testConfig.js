// Test script to verify API configuration
// Run this in browser console to test your configuration

import { API_BASE_URL, CURRENT_ENVIRONMENT, getApiUrl } from './apiConfig.js';

console.log('🔧 API Configuration Test');
console.log('========================');
console.log('Current Environment:', CURRENT_ENVIRONMENT);
console.log('API Base URL:', API_BASE_URL);
console.log('Test URL:', getApiUrl('/AccountTask'));
console.log('========================');

// Test if the configuration is working
if (CURRENT_ENVIRONMENT === 'development') {
  console.log('✅ Development mode active - using localhost');
} else if (CURRENT_ENVIRONMENT === 'production') {
  console.log('✅ Production mode active - using production URL');
} else {
  console.log('❌ Unknown environment:', CURRENT_ENVIRONMENT);
}

console.log('🎯 To switch environments, change CURRENT_ENV in apiConfig.js');

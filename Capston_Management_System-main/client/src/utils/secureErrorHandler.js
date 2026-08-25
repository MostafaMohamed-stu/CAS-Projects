import React from 'react';
import { API_CONFIG } from '../config/apiConfig.js';

/**
 * Secure Error Handler
 * Prevents sensitive information from being exposed in production
 */

// Generic error messages for production
const GENERIC_ERRORS = {
  NETWORK_ERROR: 'Connection failed. Please check your internet connection.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  SERVER_ERROR: 'Service temporarily unavailable. Please try again later.',
  NOT_FOUND: 'Requested resource not found.',
  FORBIDDEN: 'Access denied.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
};

/**
 * Sanitizes error messages for production
 * @param {Error} error - The original error
 * @param {string} context - Context where the error occurred
 * @returns {Error} - Sanitized error with generic message
 */
export const sanitizeError = (error, context = '') => {
  // In development, show full error details
  if (API_CONFIG.DEBUG) {
    return error;
  }

  // In production, return generic error messages
  const sanitizedError = new Error();
  
  // Copy essential properties
  sanitizedError.name = error.name;
  sanitizedError.stack = ''; // Remove stack trace in production
  
  // Determine generic message based on error type
  if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
    sanitizedError.message = GENERIC_ERRORS.NETWORK_ERROR;
  } else if (error.response) {
    // HTTP response errors
    switch (error.response.status) {
      case 401:
        sanitizedError.message = GENERIC_ERRORS.AUTH_ERROR;
        break;
      case 403:
        sanitizedError.message = GENERIC_ERRORS.FORBIDDEN;
        break;
      case 404:
        sanitizedError.message = GENERIC_ERRORS.NOT_FOUND;
        break;
      case 429:
        sanitizedError.message = GENERIC_ERRORS.RATE_LIMITED;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        sanitizedError.message = GENERIC_ERRORS.SERVER_ERROR;
        break;
      default:
        sanitizedError.message = GENERIC_ERRORS.UNKNOWN_ERROR;
    }
  } else if (error.request) {
    // Network errors (no response received)
    sanitizedError.message = GENERIC_ERRORS.NETWORK_ERROR;
  } else {
    // Other errors
    sanitizedError.message = GENERIC_ERRORS.UNKNOWN_ERROR;
  }

  return sanitizedError;
};

/**
 * Logs errors securely (only in development)
 * @param {Error} error - The error to log
 * @param {string} context - Context where the error occurred
 */
export const logErrorSecurely = (error, context = '') => {
  if (API_CONFIG.DEBUG) {
    console.error(`[${context}] Error:`, error);
  }
  // In production, errors are not logged to console
};

/**
 * Creates a secure error handler for API calls
 * @param {Function} apiCall - The API function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} - Wrapped function with secure error handling
 */
export const withSecureErrorHandling = (apiCall, context = 'API Call') => {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (error) {
      const sanitizedError = sanitizeError(error, context);
      logErrorSecurely(error, context);
      throw sanitizedError;
    }
  };
};

/**
 * Suppresses network error messages in production
 * This prevents sensitive endpoint information from being exposed
 */
export const suppressNetworkErrors = () => {
  if (!API_CONFIG.DEBUG) {
    // Override console methods to filter out network errors
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const message = args.join(' ');
      // Filter out network-related error messages
      if (message.includes('POST') || message.includes('GET') || 
          message.includes('PUT') || message.includes('DELETE') ||
          message.includes('401') || message.includes('404') || 
          message.includes('500') || message.includes('Unauthorized') ||
          message.includes('Not Found') || message.includes('Internal Server Error')) {
        return; // Don't log network errors in production
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      // Filter out network-related warning messages
      if (message.includes('POST') || message.includes('GET') || 
          message.includes('PUT') || message.includes('DELETE') ||
          message.includes('401') || message.includes('404') || 
          message.includes('500') || message.includes('Unauthorized') ||
          message.includes('Not Found') || message.includes('Internal Server Error')) {
        return; // Don't log network warnings in production
      }
      originalWarn.apply(console, args);
    };
  }
};


export default {
  sanitizeError,
  logErrorSecurely,
  withSecureErrorHandling,
  suppressNetworkErrors
};

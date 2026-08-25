/**
 * XSS Protection Utilities
 * Comprehensive protection against Cross-Site Scripting attacks
 */

/**
 * Sanitizes HTML content by removing dangerous tags and attributes
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove dangerous tags
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  // Remove dangerous attributes
  const dangerousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur'];
  dangerousAttrs.forEach(attr => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized;
};

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - The text to escape
 * @returns {string} - HTML-escaped text
 */
export const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return text.replace(/[&<>"'`=\/]/g, (match) => htmlEscapes[match]);
};

/**
 * Sanitizes user input for display
 * @param {string} input - User input to sanitize
 * @param {boolean} allowHtml - Whether to allow HTML tags (default: false)
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input, allowHtml = false) => {
  if (!input || typeof input !== 'string') return '';
  
  if (allowHtml) {
    return sanitizeHtml(input);
  } else {
    return escapeHtml(input);
  }
};

/**
 * Validates and sanitizes email addresses
 * @param {string} email - Email to validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  
  // Remove any HTML/script tags
  const cleanEmail = escapeHtml(email.trim());
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) return null;
  
  return cleanEmail;
};

/**
 * Validates and sanitizes phone numbers
 * @param {string} phone - Phone number to validate
 * @returns {string|null} - Sanitized phone or null if invalid
 */
export const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Validate length (assuming 11 digits for Egyptian numbers)
  if (cleanPhone.length !== 11) return null;
  
  return cleanPhone;
};

/**
 * Sanitizes URLs to prevent javascript: and data: protocols
 * @param {string} url - URL to sanitize
 * @returns {string|null} - Sanitized URL or null if dangerous
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  const cleanUrl = url.trim();
  
  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = cleanUrl.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return null;
    }
  }
  
  // Allow only http, https, and relative URLs
  if (!cleanUrl.startsWith('http://') && 
      !cleanUrl.startsWith('https://') && 
      !cleanUrl.startsWith('/') && 
      !cleanUrl.startsWith('./') && 
      !cleanUrl.startsWith('../')) {
    return null;
  }
  
  return cleanUrl;
};

/**
 * Content Security Policy helper
 * Generates CSP headers for XSS protection
 */
export const getCSPHeaders = () => {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for React
      "style-src 'self' 'unsafe-inline'", // Allow inline styles
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  };
};

/**
 * React component wrapper for XSS protection
 * Automatically sanitizes props before rendering
 */
export const withXSSProtection = (Component) => {
  return (props) => {
    const sanitizedProps = {};
    
    // Sanitize string props
    Object.keys(props).forEach(key => {
      const value = props[key];
      if (typeof value === 'string') {
        // Don't sanitize className, style, or other React-specific props
        if (key === 'className' || key === 'style' || key.startsWith('data-')) {
          sanitizedProps[key] = value;
        } else {
          sanitizedProps[key] = sanitizeInput(value);
        }
      } else {
        sanitizedProps[key] = value;
      }
    });
    
    return React.createElement(Component, sanitizedProps);
  };
};

/**
 * Input validation with XSS protection
 * @param {Object} inputData - Object containing input fields
 * @param {Object} rules - Validation rules for each field
 * @returns {Object} - { isValid: boolean, sanitizedData: Object, errors: Array }
 */
export const validateAndSanitizeInput = (inputData, rules) => {
  const errors = [];
  const sanitizedData = {};
  
  Object.keys(rules).forEach(field => {
    const value = inputData[field];
    const rule = rules[field];
    
    // Sanitize based on field type
    let sanitizedValue = value;
    
    if (rule.type === 'email') {
      sanitizedValue = sanitizeEmail(value);
      if (!sanitizedValue && rule.required) {
        errors.push(`${field} is required and must be a valid email`);
      }
    } else if (rule.type === 'phone') {
      sanitizedValue = sanitizePhone(value);
      if (!sanitizedValue && rule.required) {
        errors.push(`${field} is required and must be a valid phone number`);
      }
    } else if (rule.type === 'url') {
      sanitizedValue = sanitizeUrl(value);
      if (!sanitizedValue && rule.required) {
        errors.push(`${field} is required and must be a valid URL`);
      }
    } else if (rule.type === 'text' || rule.type === 'textarea') {
      sanitizedValue = sanitizeInput(value, rule.allowHtml || false);
      if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
        errors.push(`${field} must be less than ${rule.maxLength} characters`);
      }
    }
    
    // Check required fields
    if (rule.required && (!sanitizedValue || sanitizedValue.trim() === '')) {
      errors.push(`${field} is required`);
    }
    
    sanitizedData[field] = sanitizedValue;
  });
  
  return {
    isValid: errors.length === 0,
    sanitizedData,
    errors
  };
};

export default {
  sanitizeHtml,
  escapeHtml,
  sanitizeInput,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  getCSPHeaders,
  withXSSProtection,
  validateAndSanitizeInput
};

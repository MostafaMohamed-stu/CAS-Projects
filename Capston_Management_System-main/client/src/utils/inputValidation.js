import { sanitizeInput, sanitizeEmail, sanitizePhone, sanitizeUrl } from './xssProtection.js';

/**
 * Input Validation Utilities
 * Comprehensive validation and sanitization for all user inputs
 */

/**
 * Validation rules for different field types
 */
export const VALIDATION_RULES = {
  email: {
    type: 'email',
    required: true,
    maxLength: 100,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: 'password',
    required: true,
    minLength: 6,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]/
  },
  fullName: {
    type: 'text',
    required: true,
    maxLength: 100,
    pattern: /^[a-zA-Z\u0600-\u06FF\s]+$/
  },
  phone: {
    type: 'phone',
    required: false,
    maxLength: 11,
    pattern: /^\d{11}$/
  },
  nationalId: {
    type: 'text',
    required: false,
    maxLength: 14,
    pattern: /^\d{14}$/
  },
  url: {
    type: 'url',
    required: false,
    maxLength: 500
  },
  text: {
    type: 'text',
    required: false,
    maxLength: 1000
  },
  textarea: {
    type: 'textarea',
    required: false,
    maxLength: 2000
  }
};

/**
 * Validates password complexity requirements
 * @param {string} password - The password to validate
 * @returns {Object} - { isValid: boolean, errors: Array, strength: string }
 */
export const validatePasswordComplexity = (password) => {
  const errors = [];
  const requirements = {
    length: password.length >= 6,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&_]/.test(password)
  };

  // Check each requirement
  if (!requirements.length) {
    errors.push("Password must be at least 6 characters long");
  }
  if (!requirements.lowercase) {
    errors.push("Password must contain at least one lowercase letter (a-z)");
  }
  if (!requirements.uppercase) {
    errors.push("Password must contain at least one uppercase letter (A-Z)");
  }
  if (!requirements.number) {
    errors.push("Password must contain at least one number (0-9)");
  }
  if (!requirements.special) {
    errors.push("Password must contain at least one special character (@$!%*?&_)");
  }

  // Calculate strength (strong when all requirements met; otherwise medium for most)
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  let strength = "weak";
  if (metRequirements === 5) {
    strength = "strong";
  } else if (metRequirements >= 3) {
    strength = "medium";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    requirements
  };
};

/**
 * Validates a single input field
 * @param {string} value - The value to validate
 * @param {Object} rule - The validation rule to apply
 * @param {string} fieldName - The name of the field (for error messages)
 * @returns {Object} - { isValid: boolean, sanitizedValue: string, error: string }
 */
export const validateField = (value, rule, fieldName) => {
  const result = {
    isValid: true,
    sanitizedValue: '',
    error: ''
  };

  // Handle empty values
  if (!value || value.trim() === '') {
    if (rule.required) {
      result.isValid = false;
      result.error = `${fieldName} is required`;
    }
    return result;
  }

  // Sanitize based on field type
  let sanitizedValue = value.trim();

  switch (rule.type) {
    case 'email':
      sanitizedValue = sanitizeEmail(value);
      if (!sanitizedValue) {
        result.isValid = false;
        result.error = `${fieldName} must be a valid email address`;
      }
      break;

    case 'phone':
      sanitizedValue = sanitizePhone(value);
      if (!sanitizedValue) {
        result.isValid = false;
        result.error = `${fieldName} must be a valid phone number (11 digits)`;
      }
      break;

    case 'url':
      sanitizedValue = sanitizeUrl(value);
      if (!sanitizedValue) {
        result.isValid = false;
        result.error = `${fieldName} must be a valid URL`;
      }
      break;

    case 'password':
      // Use comprehensive password complexity validation
      const passwordValidation = validatePasswordComplexity(sanitizedValue);
      if (!passwordValidation.isValid) {
        result.isValid = false;
        result.error = passwordValidation.errors[0]; // Show first error
      }
      // Don't sanitize passwords, keep original value
      sanitizedValue = value;
      break;

    case 'text':
    case 'textarea':
      sanitizedValue = sanitizeInput(value, false);
      break;

    default:
      sanitizedValue = sanitizeInput(value, false);
  }

  // Check length constraints
  if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
    result.isValid = false;
    result.error = `${fieldName} must be less than ${rule.maxLength} characters`;
  }

  if (rule.minLength && sanitizedValue.length < rule.minLength && rule.type !== 'password') {
    result.isValid = false;
    result.error = `${fieldName} must be at least ${rule.minLength} characters long`;
  }

  // Check pattern validation
  if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
    result.isValid = false;
    result.error = `${fieldName} contains invalid characters or format`;
  }

  result.sanitizedValue = sanitizedValue;
  return result;
};

/**
 * Validates multiple form fields
 * @param {Object} formData - Object containing form field values
 * @param {Object} rules - Object containing validation rules for each field
 * @returns {Object} - { isValid: boolean, sanitizedData: Object, errors: Array }
 */
export const validateForm = (formData, rules) => {
  const errors = [];
  const sanitizedData = {};

  Object.keys(rules).forEach(fieldName => {
    const value = formData[fieldName] || '';
    const rule = rules[fieldName];
    
    const validation = validateField(value, rule, fieldName);
    
    if (!validation.isValid) {
      errors.push(validation.error);
    }
    
    sanitizedData[fieldName] = validation.sanitizedValue;
  });

  return {
    isValid: errors.length === 0,
    sanitizedData,
    errors
  };
};

/**
 * Common validation functions for specific use cases
 */
export const validators = {
  /**
   * Validates login form
   */
  login: (formData) => {
    const rules = {
      email: VALIDATION_RULES.email,
      password: { type: 'text', required: true } // Simple validation for login
    };
    return validateForm(formData, rules);
  },

  /**
   * Validates account creation form
   */
  createAccount: (formData) => {
    const rules = {
      fullNameEn: VALIDATION_RULES.fullName,
      fullNameAr: VALIDATION_RULES.fullName,
      email: VALIDATION_RULES.email,
      password: VALIDATION_RULES.password,
      phone: VALIDATION_RULES.phone,
      nationalId: VALIDATION_RULES.nationalId
    };
    return validateForm(formData, rules);
  },

  /**
   * Validates task submission form
   */
  taskSubmission: (formData) => {
    const rules = {
      glink: VALIDATION_RULES.url,
      note: VALIDATION_RULES.textarea
    };
    return validateForm(formData, rules);
  },

  /**
   * Validates report form
   */
  report: (formData) => {
    const rules = {
      title: { type: 'text', required: true, maxLength: 200 },
      message: { type: 'textarea', required: true, maxLength: 2000 }
    };
    return validateForm(formData, rules);
  }
};

/**
 * Real-time validation for form inputs
 * @param {string} value - Current input value
 * @param {Object} rule - Validation rule
 * @param {string} fieldName - Field name
 * @returns {Object} - Validation result
 */
export const validateOnChange = (value, rule, fieldName) => {
  // For real-time validation, we're more lenient
  const lenientRule = { ...rule, required: false };
  return validateField(value, lenientRule, fieldName);
};

/**
 * Sanitizes all string values in an object
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Object with sanitized string values
 */
export const sanitizeObject = (obj) => {
  const sanitized = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value, false);
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};

export default {
  VALIDATION_RULES,
  validateField,
  validateForm,
  validators,
  validateOnChange,
  sanitizeObject,
  validatePasswordComplexity
};

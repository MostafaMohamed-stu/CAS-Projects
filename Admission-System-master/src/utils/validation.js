// Validation utility functions

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation (supports multiple formats)
export const validatePhone = (phone) => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Egyptian phone number patterns - 11 digits starting with 01
  const egyptianPhoneRegex = /^01\d{9}$/;
  
  // International format (with country code)
  const internationalRegex = /^\+20\d{10}$/;
  
  return egyptianPhoneRegex.test(cleanPhone) || internationalRegex.test(cleanPhone);
};

// National ID validation (Egyptian)
export const validateNationalId = (nationalId) => {
  const cleanId = nationalId.replace(/\D/g, '');
  return cleanId.length === 14 && /^\d{14}$/.test(cleanId);
};

// Name validation
export const validateName = (name) => {
  return name.trim().length >= 2 && /^[a-zA-Z\u0600-\u06FF\s]+$/.test(name);
}; 
"use client";

import { useState, useEffect } from "react";
import {
  validateEmail,
  validatePhone,
  validateNationalId,
  validateName,
} from "../../utils/validation";

const Input = ({
  type = "text",
  className = "",
  placeholder = "",
  value,
  onChange,
  disabled = false,
  required = false,
  maxLength,
  min,
  max,
  id,
  validation = {},
  showValidation = false,
  onValidationChange,
  hideErrorMessage = false,
  ...props
}) => {
  const [error, setError] = useState("");
  const [isTouched, setIsTouched] = useState(false);

  const baseClasses =
    "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const getBorderClasses = () => {
    if (error && (showValidation || isTouched)) {
      return "border-red-300 focus:border-red-500 focus-visible:ring-red-500";
    }
    return "border-gray-200 focus:border-[#ef3131] focus-visible:ring-[#ef3131]";
  };

  const validateField = (value) => {
    if (!value && !required) return "";

    // Required validation
    if (required && !value) {
      return "This field is required";
    }

    // Email validation
    if (type === "email" && value && !validateEmail(value)) {
      return "Please enter a valid email address";
    }

    // Phone validation
    if (validation.phone && value && !validatePhone(value)) {
      return "Please enter a valid phone number";
    }

    // National ID validation
    if (validation.nationalId && value && !validateNationalId(value)) {
      return "Please enter a valid 14-digit National ID";
    }

    // Name validation
    if (validation.name && value && !validateName(value)) {
      return "Please enter a valid name";
    }

    // Number range validation
    if (type === "number" && value) {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return "Please enter a valid number";
      }
      if (min !== undefined && num < min) {
        return `Value must be at least ${min}`;
      }
      if (max !== undefined && num > max) {
        return `Value must be at most ${max}`;
      }
    }

    // Custom validation
    if (validation.custom) {
      const customResult = validation.custom(value);
      if (customResult !== true) {
        return customResult;
      }
    }

    return "";
  };

  useEffect(() => {
    const validationError = validateField(value);
    setError(validationError);

    if (onValidationChange) {
      onValidationChange(validationError === "");
    }
  }, [value, validation, required, type, min, max]);

  const handleChange = (e) => {
    let newValue = e.target.value;

    // Apply input formatting based on type
    if (type === "tel" && validation.phone) {
      // Format phone number as user types
      const cleaned = newValue.replace(/\D/g, "");
      if (cleaned.length <= 11) {
        if (cleaned.startsWith("0")) {
          newValue = cleaned;
        } else if (cleaned.startsWith("20")) {
          newValue = "+" + cleaned;
        } else {
          newValue = "0" + cleaned;
        }
      } else {
        return; // Don't update if too long
      }
    }

    if (validation.nationalId) {
      // Only allow digits for National ID
      newValue = newValue.replace(/\D/g, "").slice(0, 14);
    }

    onChange(e);
  };

  const handleBlur = () => {
    setIsTouched(true);
  };

  return (
    <div className="w-full">
      <input
        type={type}
        id={id}
        className={`${baseClasses} ${getBorderClasses()} ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        min={min}
        max={max}
        {...props}
      />
      {!hideErrorMessage && error && (showValidation || isTouched) && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;

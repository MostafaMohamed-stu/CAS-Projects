"use client";

import { useState, useEffect } from "react";

const Textarea = ({
  className = "",
  placeholder = "",
  value,
  onChange,
  disabled = false,
  required = false,
  rows = 3,
  id,
  validation = {},
  showValidation = false,
  onValidationChange,
  ...props
}) => {
  const [error, setError] = useState("");
  const [isTouched, setIsTouched] = useState(false);

  const baseClasses =
    "flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

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

    // Text length validation
    if (validation.minLength || validation.maxLength) {
      const length = value.trim().length;
      const minLength = validation.minLength || 0;
      const maxLength = validation.maxLength || Infinity;

      if (length < minLength) {
        return `Text must be at least ${minLength} characters`;
      }
      if (length > maxLength) {
        return `Text must be no more than ${maxLength} characters`;
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
  }, [value, validation, required]);

  const handleBlur = () => {
    setIsTouched(true);
  };

  return (
    <div className="w-full">
      <textarea
        id={id}
        className={`${baseClasses} ${getBorderClasses()} ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        rows={rows}
        {...props}
      />
      {error && (showValidation || isTouched) && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export default Textarea;

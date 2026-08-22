"use client";

import React from "react";

export const RadioGroup = ({
  children,
  value,
  onValueChange,
  className = "",
  ...props
}) => {
  return (
    <div className={`grid gap-2 ${className}`} {...props}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          groupValue: value,
          onGroupValueChange: onValueChange,
        })
      )}
    </div>
  );
};

export const RadioGroupItem = ({
  value,
  id,
  groupValue,
  onGroupValueChange,
  className = "",
  disabled = false,
  ...props
}) => {
  const isChecked = groupValue === value;

  return (
    <div className="relative flex items-center">
      <input
        type="radio"
        id={id}
        name="radio-group"
        value={value}
        checked={isChecked}
        onChange={(e) => onGroupValueChange(e.target.value)}
        disabled={disabled}
        className="sr-only peer"
        {...props}
      />
      <div
        className={`peer h-4 w-4 rounded-full border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 peer-checked:border-primary peer-checked:text-primary ${className}`}
      >
        {isChecked && (
          <div className="flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-current" />
          </div>
        )}
      </div>
    </div>
  );
};

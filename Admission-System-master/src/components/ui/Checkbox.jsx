"use client";

const Checkbox = ({
  checked,
  onCheckedChange,
  id,
  className = "",
  disabled = false,
  ...props
}) => {
  return (
    <div className="relative flex items-center">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
        {...props}
      />
      <label
        htmlFor={id}
        className={`peer h-4 w-4 shrink-0 rounded-sm border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-all duration-200 ${
          checked
            ? "border-[#ef3131] bg-[#ef3131] text-white"
            : "border-gray-300 hover:border-[#ef3131] hover:bg-gray-50"
        } ${className}`}
      >
        {checked && (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <polyline points="20,6 9,17 4,12" />
          </svg>
        )}
      </label>
    </div>
  );
};

export default Checkbox;

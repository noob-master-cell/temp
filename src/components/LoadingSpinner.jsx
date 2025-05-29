import React from "react";

const LoadingSpinner = ({
  message = "Loading...",
  size = "large",
  className = "",
}) => {
  const sizeClasses = {
    small: "h-8 w-8",
    medium: "h-12 w-12",
    large: "h-16 w-16",
  };

  return (
    <div
      className={`flex flex-col justify-center items-center py-12 ${className}`}
    >
      <div
        className={`animate-spin rounded-full border-t-4 border-b-4 border-indigo-600 ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      />
      <p className="text-gray-600 mt-4 text-center">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
export { LoadingSpinner }; // Also export as named export for compatibility

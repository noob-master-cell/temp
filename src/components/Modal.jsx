import React from "react";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-0 sm:p-4" // Adjusted outer padding for mobile
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded-lg shadow-xl w-full max-w-full max-h-[90vh] overflow-y-auto custom-scrollbar sm:max-w-md sm:p-6" // Adjusted max-width and padding for mobile
        onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 z-10 border-b">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;

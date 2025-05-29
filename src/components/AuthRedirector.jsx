import React from "react";
import UserCircleIcon from "./icons/UserCircleIcon.jsx"; // Updated extension

// Rest of the file remains the same
const AuthRedirector = ({ message, onNavigateToAuth }) => (
  <div className="container mx-auto text-center py-16 sm:py-20 px-4">
    <UserCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-gray-400 mb-6" />
    <p className="text-xl sm:text-2xl text-gray-700 mb-6">{message}</p>
    <button
      onClick={() => onNavigateToAuth("login")} // Default to login action
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all"
    >
      Login / Sign Up
    </button>
  </div>
);

export default AuthRedirector;

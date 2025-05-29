import React from "react";
import { Link, useLocation } from "react-router-dom";

const NavLinkRouter = ({ to, label, icon, isAuthTrigger = false }) => {
  const location = useLocation();
  // For auth trigger, active if current path starts with /auth (e.g. /auth/login or /auth/signup)
  // For other links, active if current path exactly matches 'to' prop
  const isActive = isAuthTrigger
    ? location.pathname.startsWith("/auth")
    : location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center px-2 py-1 sm:px-3 sm:py-2 rounded-md text-sm font-medium w-full sm:w-auto transition-colors
                        ${
                          isActive
                            ? "text-indigo-600 bg-indigo-50"
                            : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                        }`}
    >
      {icon}
      <span className="mt-0.5 text-xs sm:text-sm">{label}</span>
    </Link>
  );
};

export default NavLinkRouter;

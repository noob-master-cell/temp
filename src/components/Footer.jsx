import React from "react";
import UserCircleIcon from "./icons/UserCircleIcon";

/**
 * Footer: fixed at the bottom on desktop, below MobileNavigation on mobile.
 *
 * @param {object} props
 * @param {object} props.user - Current user (optional, for display)
 */
const Footer = ({ user }) => (
  <footer className="bg-white shadow-inner border-t border-gray-100 fixed bottom-0 left-0 right-0 z-10 hidden md:block">
    <div className="container mx-auto py-3 flex items-center justify-between px-4">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <UserCircleIcon className="w-5 h-5" />
        {user ? (
          <>
            Logged in as{" "}
            <span className="font-medium">
              {user.displayName || user.email}
            </span>
          </>
        ) : (
          "Not logged in"
        )}
      </div>
      <div className="text-xs text-gray-400">
        &copy; {new Date().getFullYear()} LocalMarketplace &mdash; Made with
        <span className="text-red-400 mx-1">&hearts;</span>
        for the community.
      </div>
    </div>
  </footer>
);

export default React.memo(Footer);

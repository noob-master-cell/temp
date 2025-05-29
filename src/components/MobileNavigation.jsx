import React from "react";
import NavLinkRouter from "./NavLinkRouter";
import ShoppingBagIcon from "./icons/ShoppingBagIcon";
import TagIcon from "./icons/TagIcon";
import SearchIcon from "./icons/SearchIcon";
import UserCircleIcon from "./icons/UserCircleIcon";

const MobileNavigation = ({ user, onLogout, onNavigateToAuth }) => {
  return (
    <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-30 shadow-top">
      <div className="flex justify-around items-center h-16">
        <NavLinkRouter to="/buy" label="Buy" icon={<ShoppingBagIcon />} />
        <NavLinkRouter to="/sell" label="Sell" icon={<TagIcon />} />
        <NavLinkRouter
          to="/lostfound"
          label="Lost & Found"
          icon={<SearchIcon />}
        />
        {user ? (
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center px-2 py-1 rounded-md text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 w-full"
          >
            <UserCircleIcon />
            <span className="mt-0.5 text-xs">Logout</span>
          </button>
        ) : (
          <NavLinkRouter
            to="/auth/login"
            label="Account"
            icon={<UserCircleIcon />}
            isAuthTrigger
          />
        )}
      </div>
    </div>
  );
};
export default MobileNavigation;

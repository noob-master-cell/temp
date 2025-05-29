import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import NavLinkRouter from "./NavLinkRouter";
import HomeIcon from "./icons/HomeIcon";
import ShoppingBagIcon from "./icons/ShoppingBagIcon";
import TagIcon from "./icons/TagIcon";
import SearchIcon from "./icons/SearchIcon";
import UserCircleIcon from "./icons/UserCircleIcon";
// import XCircleIcon from "./icons/XCircleIcon"; // XCircleIcon is removed as per user request
import { useDebounce } from "../hooks/useDebounce"; // Import useDebounce hook

const Header = ({
  user,
  onLogout,
  onNavigateToAuth,
  onSearchChange,
  searchValue = "",
  showSearch = true,
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const searchInputRef = useRef(null);
  const location = useLocation();

  // Don't show search on auth pages
  const isAuthPage = location.pathname.startsWith("/auth");
  const shouldShowSearch = showSearch && !isAuthPage;

  // Update local search when prop changes
  useEffect(() => {
    setLocalSearchValue(searchValue);
  }, [searchValue]);

  // Debounce local search value
  const debouncedSearchValue = useDebounce(localSearchValue, 300); // 300ms debounce delay

  // Call onSearchChange when the debounced value changes
  useEffect(() => {
    onSearchChange?.(debouncedSearchValue);
  }, [debouncedSearchValue, onSearchChange]);

  // Handle search input changes (updates local state immediately)
  const handleSearchInput = useCallback((e) => {
    setLocalSearchValue(e.target.value);
  }, []);

  // Handle search expansion
  const handleSearchExpand = useCallback(() => {
    setIsSearchExpanded(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  // Handle search collapse
  const handleSearchCollapse = useCallback(() => {
    setIsSearchExpanded(false);
    setLocalSearchValue("");
    // No need to call onSearchChange here as debouncedSearchValue will handle it
  }, []);

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    setLocalSearchValue("");
    // No need to call onSearchChange here as debouncedSearchValue will handle it
    searchInputRef.current?.focus();
  }, []);

  // Handle click outside to collapse search
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only collapse if search is expanded, click is outside input, and search value is empty
      if (
        isSearchExpanded &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target) &&
        !localSearchValue
      ) {
        setIsSearchExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchExpanded, localSearchValue]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isSearchExpanded) {
        handleSearchCollapse();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isSearchExpanded, handleSearchCollapse]);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {" "}
          {/* Made slightly thinner */}
          {/* Logo - shrinks/hides when search is expanded on mobile */}
          <Link
            to="/"
            className={`flex items-center cursor-pointer group p-2 -ml-2 transition-all duration-300 ${
              isSearchExpanded ? "sm:flex hidden" : "flex"
            }`}
          >
            <HomeIcon className="text-indigo-600 group-hover:text-indigo-700 transition-colors h-6 w-6 sm:h-6 sm:w-6" />{" "}
            {/* Slightly reduced icon size */}
            <span
              className={`font-bold text-indigo-600 group-hover:text-indigo-700 ml-1.5 sm:ml-2 transition-all duration-300 ${
                isSearchExpanded
                  ? "text-base sm:text-xl"
                  : "text-base sm:text-xl" // Slightly reduced text size
              }`}
            >
              LocalMart
            </span>
          </Link>
          {/* Center Section - Search + Desktop Navigation */}
          <div className="flex items-center flex-1 max-w-2xl mx-4">
            {/* Search Bar - behaves as overlay on mobile when expanded */}
            {shouldShowSearch && (
              <div
                className={`relative transition-all duration-300 ease-in-out ${
                  isSearchExpanded
                    ? "flex-1 absolute inset-0 sm:relative sm:flex-1 bg-white sm:bg-transparent z-50 p-3 sm:p-0"
                    : "w-8 sm:w-64 flex-shrink-0"
                }`}
              >
                {/* Search Input Container */}
                <div
                  className={`relative flex items-center ${
                    // Added flex and items-center for alignment
                    isSearchExpanded ? "w-full" : "w-full"
                  }`}
                >
                  <div className="absolute left-0 pl-3 flex items-center pointer-events-none">
                    {" "}
                    {/* inset-y-0 removed, controlled by flex */}
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>

                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search items..."
                    value={localSearchValue}
                    onChange={handleSearchInput}
                    onFocus={handleSearchExpand}
                    className={`block w-full pl-10 pr-8 py-1.5 sm:py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 ${
                      isSearchExpanded || localSearchValue
                        ? "opacity-100"
                        : "opacity-100 sm:opacity-100 cursor-pointer"
                    }`}
                    style={{
                      transform: isSearchExpanded ? "scale(1)" : "scale(1)",
                    }}
                  />

                  {/* Clear Search Button (using simple 'x' text) */}
                  {localSearchValue && (
                    <button
                      onClick={handleSearchClear}
                      className="absolute right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none" // inset-y-0 removed
                      type="button"
                    >
                      <span className="text-xl leading-none">&times;</span>{" "}
                      {/* Simple 'x' character */}
                    </button>
                  )}

                  {/* Collapse Button (mobile only, using 'Close' text) */}
                  {isSearchExpanded && (
                    <button
                      onClick={handleSearchCollapse}
                      className="absolute top-1/2 -right-10 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 sm:hidden whitespace-nowrap" // Adjusted right position
                      type="button"
                    >
                      Close
                    </button>
                  )}
                </div>

                {/* Search Suggestions/Results (can be added later) */}
                {isSearchExpanded && localSearchValue && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    <div className="p-3 text-sm text-gray-500">
                      Press Enter to search for "{localSearchValue}"
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Desktop Navigation - hidden when search is expanded on smaller screens */}
            <div
              className={`hidden md:flex items-center space-x-0.5 transition-all duration-300 ${
                shouldShowSearch ? "ml-4" : ""
              } ${isSearchExpanded ? "lg:flex hidden" : "md:flex"}`}
            >
              <NavLinkRouter to="/buy" label="Buy" icon={<ShoppingBagIcon />} />
              <NavLinkRouter to="/sell" label="Sell" icon={<TagIcon />} />
              <NavLinkRouter
                to="/lostfound"
                label="Lost & Found"
                icon={<SearchIcon />}
              />
            </div>
          </div>
          {/* User Actions - shrinks/hides when search is expanded */}
          <div
            className={`flex items-center transition-all duration-300 ${
              isSearchExpanded ? "ml-2 hidden sm:flex" : "" // Hide on mobile when search expanded
            }`}
          >
            {user ? (
              <div className="flex items-center space-x-1.5 sm:space-x-3">
                <span
                  className={`text-gray-700 text-xs sm:text-sm max-w-[70px] sm:max-w-[150px] truncate transition-all duration-300 ${
                    isSearchExpanded ? "hidden sm:inline" : "hidden sm:inline"
                  }`}
                  title={user.displayName || user.email || "User"}
                >
                  {user.displayName || user.email || "User"}
                </span>
                <button
                  onClick={onLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <span className={isSearchExpanded ? "hidden sm:inline" : ""}>
                    Logout
                  </span>
                  <span className={isSearchExpanded ? "sm:hidden" : "hidden"}>
                    <UserCircleIcon className="w-4 h-4" />
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigateToAuth("login")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center whitespace-nowrap"
              >
                <UserCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-1.5" />
                <span className={isSearchExpanded ? "hidden sm:inline" : ""}>
                  Login/Sign Up
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Bar for Mobile (hidden when search is expanded) */}
      {!isAuthPage && !isSearchExpanded && (
        <div className="md:hidden border-t border-gray-100 bg-gray-50 px-4 py-1.5">
          {" "}
          {/* Adjusted padding */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex space-x-4">
              <Link
                to="/buy"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Browse Items
              </Link>
              <Link
                to="/sell"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Sell Item
              </Link>
              <Link
                to="/lostfound"
                className="text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Lost & Found
              </Link>
            </div>
            {shouldShowSearch && !localSearchValue && (
              <button
                onClick={handleSearchExpand}
                className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors"
              >
                <SearchIcon className="w-4 h-4 mr-1" />
                Search
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;

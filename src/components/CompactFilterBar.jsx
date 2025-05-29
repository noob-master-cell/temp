import React, { useState, useCallback, useEffect, useRef } from "react";

const CompactFilterBar = ({
  onFilterChange,
  categories = [],
  showStatusFilter = false,
  statusOptions = [],
  className = "",
  initialFilters = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    sortBy: "newest",
    status: "",
    ...initialFilters,
  });

  const dropdownRef = useRef(null);

  // Update filters when initialFilters change
  useEffect(() => {
    setFilters((prev) => ({ ...prev, ...initialFilters }));
  }, [initialFilters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle filter updates
  const handleFilterUpdate = useCallback(
    (key, value) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      onFilterChange?.(newFilters);
    },
    [filters, onFilterChange]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const clearedFilters = {
      category: "",
      sortBy: "newest",
      status: "",
    };
    setFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
  }, [onFilterChange]);

  // Count active filters
  const activeFilterCount = [
    filters.category,
    filters.status,
    filters.sortBy !== "newest" ? filters.sortBy : null,
  ].filter(Boolean).length;

  // Quick filter categories (first 6 categories)
  const quickCategories = categories.slice(0, 6).filter((cat) => cat !== "All");

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
          />
        </svg>
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {activeFilterCount}
          </span>
        )}
        <svg
          className={`ml-2 h-5 w-5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Filter Options
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterUpdate("category", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories
                    .filter((cat) => cat !== "All")
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            {showStatusFilter && statusOptions.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-md">
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      onClick={() =>
                        handleFilterUpdate(
                          "status",
                          filters.status === status.value ? "" : status.value
                        )
                      }
                      className={`py-2 px-3 rounded text-xs font-medium transition-colors ${
                        filters.status === status.value
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort By */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterUpdate("sortBy", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">A-Z</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Quick Filters */}
            {quickCategories.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Quick Filters
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() =>
                        handleFilterUpdate(
                          "category",
                          filters.category === category ? "" : category
                        )
                      }
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        filters.category === category
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {activeFilterCount > 0
                  ? `${activeFilterCount} filter${
                      activeFilterCount !== 1 ? "s" : ""
                    } applied`
                  : "No filters applied"}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 rounded border border-indigo-200 hover:border-indigo-300 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CompactFilterBar);

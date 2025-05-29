import React, { useState, useEffect, useMemo, useCallback } from "react";
import { db, appId } from "../../firebase.jsx";
import { collection, query, onSnapshot } from "firebase/firestore";
import ItemCard from "../../components/ItemCard.jsx";
import CompactFilterBar from "../../components/CompactFilterBar.jsx";
import {
  ItemCardGridSkeleton,
  PageLoadingSkeleton,
} from "../../components/LoadingSkeletons.jsx";
import EmptyState from "../../components/EmptyState.jsx";

const BuyingSection = ({
  user,
  showMessage,
  globalSearchTerm = "",
  onSearchTermChange,
}) => {
  // State management
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    sortBy: "newest",
    status: "",
    priceRange: { min: "", max: "" },
  });
  const [visibleItemsCount, setVisibleItemsCount] = useState(12);

  const itemsCollectionPath = `artifacts/${appId}/public/data/sell_items`;
  const categoriesList = [
    "Electronics",
    "Furniture",
    "Clothing",
    "Books",
    "Vehicles",
    "Home & Garden",
    "Toys & Games",
    "Sports & Outdoors",
    "Antiques",
    "Services",
    "Other",
  ];

  // Fetch items from Firebase
  useEffect(() => {
    setLoading(true);
    const itemsRef = collection(db, itemsCollectionPath);
    const q = query(itemsRef);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const itemsData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort(
            (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
          );
        setItems(itemsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching items: ", error);
        showMessage(
          `Error fetching items: ${error.message}. Check Firestore rules.`,
          "error"
        );
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [showMessage]);

  // Handle filter changes from CompactFilterBar
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setVisibleItemsCount(12); // Reset pagination when filters change
  }, []);

  // Handle buy action
  const handleBuy = useCallback(
    (item) => {
      if (!user) {
        showMessage("Please log in to express interest.", "info");
        return;
      }

      // Show success message with share data
      showMessage(
        `Interested in "${item.name}". Contact seller via WhatsApp!`,
        "success",
        {
          shareData: {
            title: `${item.name} - LocalMart`,
            text: `Check out this item: ${item.name} for $${item.price}`,
            url: window.location.href,
          },
        }
      );
    },
    [user, showMessage]
  );

  // Handle contact seller fallback
  const handleContactSellerFallback = useCallback(
    (item) => {
      if (!user) {
        showMessage("Please log in to contact sellers.", "info");
        return;
      }
      if (!item.whatsappNumber) {
        showMessage(
          `Seller for "${item.name}" has no WhatsApp. (Poster: ${
            item.userEmail || "Unknown"
          })`,
          "info"
        );
      }
    },
    [user, showMessage]
  );

  // Combined search and filter logic
  const processedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      // Global search from header
      if (globalSearchTerm) {
        const term = globalSearchTerm.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(term);
        const descriptionMatch = item.description?.toLowerCase().includes(term);
        const categoryMatch = item.category?.toLowerCase().includes(term);
        if (!nameMatch && !descriptionMatch && !categoryMatch) return false;
      }

      // Category filter
      if (filters.category && filters.category !== "All") {
        if (item.category !== filters.category) return false;
      }

      // Price range filter
      if (
        filters.priceRange.min &&
        item.price < parseFloat(filters.priceRange.min)
      ) {
        return false;
      }
      if (
        filters.priceRange.max &&
        item.price > parseFloat(filters.priceRange.max)
      ) {
        return false;
      }

      return true;
    });

    // Sort items
    switch (filters.sortBy) {
      case "newest":
        filtered.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
        );
        break;
      case "price-low":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "alphabetical":
        filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      default:
        break;
    }

    return filtered;
  }, [items, globalSearchTerm, filters]);

  // Get currently displayed items (for pagination)
  const currentDisplayItems = useMemo(
    () => processedItems.slice(0, visibleItemsCount),
    [processedItems, visibleItemsCount]
  );

  // Handle load more
  const handleLoadMore = useCallback(() => {
    setVisibleItemsCount((prev) => prev + 8);
  }, []);

  // Clear search function
  const handleClearSearch = useCallback(() => {
    onSearchTermChange?.("");
    setFilters((prev) => ({
      ...prev,
      category: "",
      priceRange: { min: "", max: "" },
    }));
  }, [onSearchTermChange]);

  // Show loading skeleton
  if (loading) {
    return <PageLoadingSkeleton type="buying" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-2">
        {/* Search Status */}
        {globalSearchTerm && (
          <div className="mt-4 inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-sm text-blue-800">
              Searching for: <strong>"{globalSearchTerm}"</strong>
            </span>
            <button
              onClick={handleClearSearch}
              className="text-blue-600 hover:text-blue-800 ml-2"
              title="Clear search"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Results Count */}
        {items.length > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            {processedItems.length === 0 ? (
              "No items match your criteria"
            ) : (
              <>
                {processedItems.length}{" "}
                {processedItems.length === 1 ? "item" : "items"} found
                {processedItems.length !== items.length &&
                  ` (filtered from ${items.length} total)`}
              </>
            )}
          </p>
        )}
      </div>

      {/* Compact Filter Bar */}
      <CompactFilterBar
        onFilterChange={handleFilterChange}
        categories={["All", ...categoriesList]}
        showPriceFilter={true}
        showSortOptions={true}
        initialFilters={filters}
        className="mb-8"
      />

      {/* Results Section */}
      {currentDisplayItems.length === 0 && !loading ? (
        <div className="mt-8">
          {globalSearchTerm ||
          filters.category ||
          filters.priceRange.min ||
          filters.priceRange.max ? (
            // No results for search/filters
            <EmptyState
              icon="search"
              title="No items found"
              description={
                globalSearchTerm
                  ? `No items match "${globalSearchTerm}". Try different keywords or check your filters.`
                  : "No items match your current filters. Try adjusting your search criteria."
              }
              actionButton={
                <button
                  onClick={handleClearSearch}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Clear Filters
                </button>
              }
              className="py-16"
            />
          ) : (
            // No items at all
            <EmptyState
              icon="shopping"
              title="No items available"
              description="No items have been posted yet. Be the first to list something for sale!"
              actionButton={
                user ? (
                  <button
                    onClick={() => (window.location.href = "/sell")}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    List Your First Item
                  </button>
                ) : (
                  <button
                    onClick={() => (window.location.href = "/auth/login")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Sign In to Sell
                  </button>
                )
              }
              className="py-16"
            />
          )}
        </div>
      ) : (
        <>
          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentDisplayItems.map((item, index) => (
              <ItemCard
                key={`${item.id}-${index}`}
                item={item}
                onBuy={handleBuy}
                onContact={handleContactSellerFallback}
                showMessage={showMessage}
              />
            ))}
          </div>

          {/* Load More Button */}
          {visibleItemsCount < processedItems.length && (
            <div className="text-center mt-10">
              <button
                onClick={handleLoadMore}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Load More ({processedItems.length - visibleItemsCount}{" "}
                remaining)
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Showing {currentDisplayItems.length} of {processedItems.length}{" "}
                items
              </p>
            </div>
          )}
        </>
      )}

      {/* Search Suggestions (when no results) */}
      {globalSearchTerm && processedItems.length === 0 && items.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Search Suggestions
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Try searching for:</p>
            <div className="flex flex-wrap gap-2">
              {categoriesList.slice(0, 5).map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    onSearchTermChange?.(category.toLowerCase());
                  }}
                  className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyingSection;

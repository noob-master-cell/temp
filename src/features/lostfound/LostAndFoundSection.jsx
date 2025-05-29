import React, { useState, useEffect, useCallback, useMemo } from "react";
import { db, appId } from "../../firebase.jsx";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  where, // Import where for filtering
  orderBy, // Import orderBy for consistent sorting
} from "firebase/firestore";
import ItemCard from "../../components/ItemCard.jsx";
import ItemForm from "../../components/ItemForm.jsx";
import Modal from "../../components/Modal.jsx";
import CompactFilterBar from "../../components/CompactFilterBar.jsx";
import { PageLoadingSkeleton } from "../../components/LoadingSkeletons.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import PlusCircleIcon from "../../components/icons/PlusCircleIcon.jsx";
import UserCircleIcon from "../../components/icons/UserCircleIcon.jsx";
import AuthSensitiveControls from "./AuthSensitiveControls.jsx";
import { ITEM_STATUS } from "../../config/constants"; // ITEM_STATUS is needed for active/inactive status

const LostAndFoundSection = ({
  user,
  showMessage,
  navigateToAuth,
  globalSearchTerm = "",
  onSearchTermChange,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isFormProcessing, setIsFormProcessing] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    sortBy: "newest",
    status: "lost", // Default to 'lost' as 'all' is removed
  });
  const [visibleItemsCount, setVisibleItemsCount] = useState(12);

  const itemsCollectionPath = `artifacts/${appId}/public/data/lostfound_items`;
  const categoriesList = [
    "Personal Belongings",
    "Electronics",
    "Keys",
    "Pets",
    "Documents",
    "Bags & Luggage",
    "Wallets & Purses",
    "Jewelry",
    "Other",
  ];

  // Status options for filtering (used in CompactFilterBar and new section tabs)
  const statusOptions = [
    { value: "lost", label: "Lost Items" },
    { value: "found", label: "Found Items" },
  ];

  // Listen for external modal open events (from FAB)
  useEffect(() => {
    const handleOpenModal = () => {
      setEditingItem(null);
      setIsModalOpen(true);
    };

    window.addEventListener("openAddLostFoundModal", handleOpenModal);
    return () =>
      window.removeEventListener("openAddLostFoundModal", handleOpenModal);
  }, []);

  // Fetch items from Firebase based on filters.status
  useEffect(() => {
    setLoading(true);
    const itemsRef = collection(db, itemsCollectionPath);
    let q = query(itemsRef);

    // Apply status filter from state - REMOVED IS_RESOLVED_FIELD
    q = query(q, where("status", "==", filters.status));

    // Apply default ordering
    q = query(q, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const itemsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemsData);
        setLoading(false);
        setVisibleItemsCount(12); // Reset visible items on new data fetch
      },
      (error) => {
        console.error("Error fetching L&F items: ", error);
        showMessage(
          `Error fetching L&F items: ${error.message}. Check rules.`,
          "error"
        );
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [showMessage, filters.status]); // Re-fetch when filters.status changes

  // Handle filter changes (from CompactFilterBar or new tabs)
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Process items based on search and other filters (excluding status, which is in query)
  const processedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      // Global search from header
      if (globalSearchTerm) {
        const term = globalSearchTerm.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(term);
        const descriptionMatch = item.description?.toLowerCase().includes(term);
        const categoryMatch = item.category?.toLowerCase().includes(term);
        const locationMatch = item.lastSeenLocation
          ?.toLowerCase()
          .includes(term);
        if (!nameMatch && !descriptionMatch && !categoryMatch && !locationMatch)
          return false;
      }

      // Category filter
      if (filters.category && filters.category !== "All") {
        if (item.category !== filters.category) return false;
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
      case "alphabetical":
        filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      default:
        break;
    }

    return filtered;
  }, [items, globalSearchTerm, filters.category, filters.sortBy]);

  // Get currently displayed items (for pagination)
  const currentDisplayItems = useMemo(
    () => processedItems.slice(0, visibleItemsCount),
    [processedItems, visibleItemsCount]
  );

  // Handle item submission
  const handleSubmitItem = async (itemDataFromForm) => {
    if (!user) {
      throw new Error("User not logged in");
    }

    const statusToSet = itemDataFromForm.dateFound ? "found" : "lost";
    const fullItemData = { ...itemDataFromForm, status: statusToSet };

    try {
      if (editingItem?.id) {
        await setDoc(
          doc(db, itemsCollectionPath, editingItem.id),
          fullItemData,
          { merge: true }
        );
        showMessage("Post updated successfully!", "success", {
          shareData: {
            title: `${fullItemData.name} - Updated on LocalMart`,
            text: `${statusToSet === "lost" ? "Lost" : "Found"}: ${
              fullItemData.name
            }`,
            url: window.location.href,
          },
        });
      } else {
        await addDoc(collection(db, itemsCollectionPath), fullItemData);
        showMessage("Post added successfully!", "success", {
          shareData: {
            title: `${fullItemData.name} - LocalMart Lost & Found`,
            text: `${statusToSet === "lost" ? "Lost" : "Found"}: ${
              fullItemData.name
            }. ${fullItemData.description}`,
            url: window.location.href,
          },
        });
      }
      setEditingItem(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving L&F item: ", error);
      showMessage(`Error saving post: ${error.message}`, "error");
      throw error;
    }
  };

  // Handle item deletion
  const handleDeleteItem = async (itemId) => {
    if (!user) {
      showMessage("Please log in to delete posts.", "info");
      return;
    }

    if (
      !window.confirm("Are you sure you want to delete this post permanently?")
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, itemsCollectionPath, itemId));
      showMessage("Post deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting post: ", error);
      showMessage(`Error deleting post: ${error.message}`, "error");
    }
  };

  // handleMarkAsResolved function REMOVED

  // Handle contact fallback
  const handleContactFallback = useCallback(
    (item) => {
      if (!user) {
        showMessage("Please log in to contact.", "info");
        return;
      }
      if (!item.whatsappNumber) {
        showMessage(
          `User for "${item.name}" has not provided a WhatsApp number.`,
          "info"
        );
      }
    },
    [user, showMessage]
  );

  // Handle load more
  const handleLoadMore = useCallback(() => {
    setVisibleItemsCount((prev) => prev + 8);
  }, []);

  // Modal handlers
  const openAddModal = useCallback(() => {
    setEditingItem(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  }, []);

  const closeModal = () => {
    if (!isFormProcessing) {
      setIsModalOpen(false);
      setEditingItem(null);
    }
  };

  // Clear search function
  const handleClearSearch = useCallback(() => {
    onSearchTermChange?.("");
    setFilters((prev) => ({
      ...prev,
      category: "",
      status: "lost", // Reset status to 'lost' as 'all' is removed
    }));
  }, [onSearchTermChange]);

  // Get statistics
  const stats = useMemo(() => {
    // These totals refer to the 'items' state, which is already filtered by filters.status
    const totalLostInView = items.filter(
      (item) => (item.status || "lost") === ITEM_STATUS.LOST
    ).length;
    const totalFoundInView = items.filter(
      (item) => item.status === ITEM_STATUS.FOUND
    ).length;
    const recentInView = items.filter((item) => {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return (item.createdAt?.seconds || 0) * 1000 > dayAgo;
    }).length;

    return {
      total: items.length, // Total items in the current 'lost' or 'found' view
      lost: totalLostInView,
      found: totalFoundInView,
      recent: recentInView,
    };
  }, [items]);

  // Determine initial status for new item form based on active filter
  const initialFormStatus = useMemo(() => {
    if (filters.status === ITEM_STATUS.LOST)
      return { status: ITEM_STATUS.LOST };
    if (filters.status === ITEM_STATUS.FOUND)
      return { status: ITEM_STATUS.FOUND };
    return { status: ITEM_STATUS.LOST }; // Default to 'lost' if for some reason status is not set
  }, [filters.status]);

  // Get current section label for UI
  const currentSectionLabel = useMemo(() => {
    const option = statusOptions.find((opt) => opt.value === filters.status);
    return option ? option.label : "Items"; // Fallback label
  }, [filters.status, statusOptions]);

  // Show loading skeleton
  if (loading) {
    return <PageLoadingSkeleton type="lostfound" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Lost & Found
          </h2>
          <p className="text-gray-600 mt-1">
            Help reunite people with their belongings
          </p>

          {/* Search Status */}
          {globalSearchTerm && (
            <div className="mt-3 inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
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
                Searching: <strong>"{globalSearchTerm}"</strong>
              </span>
              <button
                onClick={handleClearSearch}
                className="text-blue-600 hover:text-blue-800"
                title="Clear search"
              >
                <svg
                  className="w-3 h-3"
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
        </div>

        {user ? (
          <button
            onClick={openAddModal}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md flex items-center space-x-2 transition-all hover:shadow-lg"
          >
            <PlusCircleIcon />
            <span>
              {filters.status === ITEM_STATUS.LOST
                ? "Post Lost Item"
                : "Post Found Item"}{" "}
              {/* Only two options now */}
            </span>
          </button>
        ) : (
          <button
            onClick={() => navigateToAuth("login")}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md flex items-center space-x-2 transition-all hover:shadow-lg"
          >
            <UserCircleIcon className="w-5 h-5" />
            <span>Login to Post</span>
          </button>
        )}
      </div>

      {/* Section Tabs for Lost/Found */}
      <div className="flex justify-center sm:justify-start space-x-2 p-1 bg-gray-200 rounded-lg mb-6">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() =>
              handleFilterChange({ ...filters, status: option.value })
            }
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200 ${
              filters.status === option.value
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-700 hover:bg-gray-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Compact Filter Bar */}
      <CompactFilterBar
        onFilterChange={handleFilterChange}
        categories={["All", ...categoriesList]}
        showPriceFilter={false}
        showSortOptions={true}
        showStatusFilter={false} // Hide status filter from CompactFilterBar as tabs handle it
        statusOptions={statusOptions} // Still pass for internal logic, but not shown
        initialFilters={filters}
        className="mb-8"
      />

      {/* Results Count */}
      {items.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {processedItems.length === 0 ? (
              `No items match your criteria in "${currentSectionLabel}"`
            ) : (
              <>
                Showing {currentDisplayItems.length} of {processedItems.length}{" "}
                items
                {processedItems.length !== items.length && " (filtered)"}
              </>
            )}
          </p>
        </div>
      )}

      {/* Modal for Add/Edit Item */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          editingItem
            ? "Edit Post"
            : `Post ${
                filters.status === ITEM_STATUS.LOST ? "Lost" : "Found"
              } Item`
        }
      >
        <ItemForm
          onSubmit={handleSubmitItem}
          initialData={
            editingItem || initialFormStatus // Pass initial status based on selected section
          }
          type="lostfound"
          onFormProcessing={setIsFormProcessing}
        />
      </Modal>

      {/* Content */}
      {currentDisplayItems.length === 0 && !loading ? (
        <div className="mt-8">
          {items.length === 0 ? (
            // No items at all in the current filtered view
            <EmptyState
              icon="search"
              title={`No ${currentSectionLabel.toLowerCase()} yet`}
              description={`Be the first to help your community by posting about ${currentSectionLabel.toLowerCase()}!`}
              actionButton={
                user ? (
                  <button
                    onClick={openAddModal}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <PlusCircleIcon />
                    <span>
                      {filters.status === ITEM_STATUS.LOST
                        ? "Post Lost Item"
                        : "Post Found Item"}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigateToAuth("login")}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span>Login to Post</span>
                  </button>
                )
              }
              className="py-16"
            />
          ) : (
            // No items match search/filters within the current section
            <EmptyState
              icon="search"
              title="No items found"
              description={
                globalSearchTerm
                  ? `No items match "${globalSearchTerm}". Try different keywords or adjust your filters.`
                  : `No ${currentSectionLabel.toLowerCase()} match your current filters. Try adjusting your search criteria.`
              }
              actionButton={
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleClearSearch}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Clear Filters
                  </button>
                  {user && (
                    <button
                      onClick={openAddModal}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <PlusCircleIcon />
                      <span>
                        {filters.status === ITEM_STATUS.LOST
                          ? "Post Lost Item"
                          : "Post Found Item"}
                      </span>
                    </button>
                  )}
                </div>
              }
              className="py-16"
            />
          )}
        </div>
      ) : (
        <>
          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentDisplayItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl shadow-lg overflow-hidden border-2 transition-all hover:shadow-xl ${
                  (item.status || ITEM_STATUS.LOST) === ITEM_STATUS.LOST // Default to 'lost' if status is undefined
                    ? "border-red-300 bg-red-50"
                    : "border-green-300 bg-green-50"
                } flex flex-col h-full`}
              >
                <ItemCard
                  item={item}
                  onContact={handleContactFallback}
                  isLostAndFound={true}
                  showMessage={showMessage}
                />
                <AuthSensitiveControls
                  item={item}
                  user={user}
                  onEdit={() => openEditModal(item)}
                  onDelete={handleDeleteItem}
                  // onMarkAsResolved={handleMarkAsResolved} // REMOVED
                />
              </div>
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

      {/* Community Tips */}
      {items.length > 0 && currentDisplayItems.length > 0 && (
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🤝 Community Guidelines
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                If you found something:
              </h4>
              <ul className="space-y-1">
                <li>• Post clear photos and description</li>
                <li>• Include where and when you found it</li>
                <li>• Ask for specific details to verify ownership</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                If you lost something:
              </h4>
              <ul className="space-y-1">
                <li>• Provide detailed description and photos</li>
                <li>• Include last known location and time</li>
                <li>• Be prepared to verify ownership</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Search Suggestions */}
      {globalSearchTerm && processedItems.length === 0 && items.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Search Suggestions
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Try searching for:</p>
            <div className="flex flex-wrap gap-2">
              {categoriesList.slice(0, 6).map((category) => (
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

export default LostAndFoundSection;

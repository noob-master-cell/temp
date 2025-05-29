import React, { useState, useEffect, useCallback, useMemo } from "react";
import { db, appId } from "../../firebase.jsx";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  where,
  orderBy,
  deleteDoc,
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
import { ITEM_STATUS } from "../../config/constants";

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
    status: "lost",
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

  // Status options for filtering
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

    // Apply status filter from state
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
          `Error fetching items: ${error.message}. Please try again.`,
          "error"
        );
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [showMessage, filters.status]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Process items based on search and other filters
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

    // When creating a new post, set status based on the active tab
    // Only use dateFound to determine status when editing an existing item
    const statusToSet = editingItem
      ? itemDataFromForm.dateFound
        ? "found"
        : "lost"
      : filters.status; // Use current tab for new items

    const fullItemData = { ...itemDataFromForm, status: statusToSet };

    try {
      if (editingItem?.id) {
        await setDoc(
          doc(db, itemsCollectionPath, editingItem.id),
          fullItemData,
          { merge: true }
        );
        showMessage("Post updated successfully!", "success");
      } else {
        await addDoc(collection(db, itemsCollectionPath), fullItemData);
        showMessage("Post added successfully!", "success");
      }
      setEditingItem(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving item: ", error);
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

    if (!window.confirm("Are you sure you want to delete this post?")) {
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

  // Handle contact fallback
  const handleContactFallback = useCallback(
    (item) => {
      if (!user) {
        showMessage("Please log in to contact.", "info");
        return;
      }
      if (!item.whatsappNumber) {
        showMessage(`No contact information provided for this item.`, "info");
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
    }));
  }, [onSearchTermChange]);

  // Determine initial status for new item form based on active filter
  const initialFormStatus = useMemo(() => {
    if (filters.status === ITEM_STATUS.LOST)
      return { status: ITEM_STATUS.LOST };
    if (filters.status === ITEM_STATUS.FOUND)
      return { status: ITEM_STATUS.FOUND };
    return { status: ITEM_STATUS.LOST };
  }, [filters.status]);

  // Get current section label for UI
  const currentSectionLabel = useMemo(() => {
    const option = statusOptions.find((opt) => opt.value === filters.status);
    return option ? option.label : "Items";
  }, [filters.status, statusOptions]);

  // Show loading skeleton
  if (loading) {
    return <PageLoadingSkeleton type="lostfound" />;
  }

  return (
    <div className="container mx-auto px-3 py-4">
      {/* Compact Header with Integrated Search Status and Lost/Found Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 inline-flex items-center">
            Lost & Found
            {items.length > 0 && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {processedItems.length}{" "}
                {processedItems.length === 1 ? "item" : "items"}
              </span>
            )}
          </h2>

          {/* Search Status - Inline and compact */}
          {globalSearchTerm && (
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <svg
                className="w-3 h-3 mr-1"
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
              <span>"{globalSearchTerm}"</span>
              <button
                onClick={handleClearSearch}
                className="ml-1 text-blue-700"
                title="Clear search"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Compact Lost/Found Toggle, Filter and Add Button */}
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 rounded-lg overflow-hidden flex text-sm">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  handleFilterChange({ ...filters, status: option.value })
                }
                className={`px-3 py-1 font-medium ${
                  filters.status === option.value
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.value === "lost" ? "Lost" : "Found"}
              </button>
            ))}
          </div>

          <CompactFilterBar
            onFilterChange={handleFilterChange}
            categories={["All", ...categoriesList]}
            showPriceFilter={false}
            showSortOptions={true}
            showStatusFilter={false}
            initialFilters={filters}
            className="hidden sm:block"
          />

          {user ? (
            <button
              onClick={openAddModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg flex items-center"
              title={`Post ${
                filters.status === "lost" ? "Lost" : "Found"
              } Item`}
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span className="sr-only sm:not-sr-only sm:ml-1 sm:mr-1">
                Post
              </span>
            </button>
          ) : (
            <button
              onClick={() => navigateToAuth("login")}
              className="bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded-lg flex items-center"
              title="Login to Post"
            >
              <UserCircleIcon className="w-5 h-5" />
              <span className="sr-only sm:not-sr-only sm:ml-1 sm:mr-1">
                Login
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Compact Filter Bar - Mobile Only */}
      <div className="sm:hidden bg-white shadow-sm rounded-lg p-2 mb-4">
        <CompactFilterBar
          onFilterChange={handleFilterChange}
          categories={["All", ...categoriesList]}
          showPriceFilter={false}
          showSortOptions={true}
          showStatusFilter={false}
          initialFilters={filters}
        />
      </div>

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
          initialData={editingItem || initialFormStatus}
          type="lostfound"
          onFormProcessing={setIsFormProcessing}
        />
      </Modal>

      {/* Content - Empty States or Items Grid */}
      {currentDisplayItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-4 my-3">
          {items.length === 0 ? (
            <EmptyState
              icon="search"
              title={`No ${filters.status} items yet`}
              description="Be the first to help your community!"
              actionButton={
                user ? (
                  <button
                    onClick={openAddModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-1"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    <span>
                      Post {filters.status === "lost" ? "Lost" : "Found"} Item
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigateToAuth("login")}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-1"
                  >
                    <UserCircleIcon className="w-4 h-4" />
                    <span>Login to Post</span>
                  </button>
                )
              }
              className="py-8"
            />
          ) : (
            <EmptyState
              icon="search"
              title="No matches found"
              description={
                globalSearchTerm
                  ? `No matches for "${globalSearchTerm}"`
                  : `Try adjusting your filters`
              }
              actionButton={
                <button
                  onClick={handleClearSearch}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  Clear Filters
                </button>
              }
              className="py-6"
            />
          )}
        </div>
      ) : (
        <>
          {/* Space-Efficient Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
            {currentDisplayItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg shadow-sm overflow-hidden transition-all hover:shadow ${
                  (item.status || ITEM_STATUS.LOST) === ITEM_STATUS.LOST
                    ? "border-l-4 border-l-red-400 bg-white"
                    : "border-l-4 border-l-green-400 bg-white"
                } flex flex-col h-full`}
              >
                <div className="flex-grow">
                  <ItemCard
                    item={item}
                    onContact={handleContactFallback}
                    isLostAndFound={true}
                    showMessage={showMessage}
                  />
                </div>
                {user && user.uid === item.userId && (
                  <div className="flex border-t border-gray-100">
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium py-1.5 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="flex-1 bg-gray-50 hover:bg-red-50 text-red-600 text-xs font-medium py-1.5 transition-colors border-l border-gray-100"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Compact Load More Button */}
          {visibleItemsCount < processedItems.length && (
            <button
              onClick={handleLoadMore}
              className="mx-auto mt-4 block text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 bg-white py-1.5 px-3 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Load {Math.min(8, processedItems.length - visibleItemsCount)} more
            </button>
          )}
        </>
      )}

      {/* Compact Community Guidelines - Collapsible Tooltip */}
      {items.length > 0 && currentDisplayItems.length > 0 && (
        <div className="mt-6 bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
          <button
            className="w-full text-left px-4 py-2 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => {
              const el = document.getElementById("guidelines-content");
              if (el) el.classList.toggle("hidden");
            }}
          >
            <span className="flex items-center">
              <span className="text-lg mr-2">🤝</span>
              Community Guidelines
            </span>
            <svg
              className="w-4 h-4 text-gray-400"
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

          <div
            id="guidelines-content"
            className="hidden border-t border-gray-100"
          >
            <div className="grid md:grid-cols-2 gap-3 p-3 text-xs">
              <div className="bg-blue-50 p-2 rounded">
                <h4 className="font-medium text-blue-800 mb-1">
                  For found items:
                </h4>
                <ul className="space-y-0.5 text-blue-700">
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>Post clear photos and description</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>Include location and time found</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>Verify ownership before returning</span>
                  </li>
                </ul>
              </div>
              <div className="bg-red-50 p-2 rounded">
                <h4 className="font-medium text-red-800 mb-1">
                  For lost items:
                </h4>
                <ul className="space-y-0.5 text-red-700">
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>Provide detailed description</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>Include last seen location/time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>Add contact information</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostAndFoundSection;

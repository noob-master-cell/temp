import React, { useState, useEffect, useCallback, useMemo } from "react";
import { db, appId } from "../../firebase.jsx";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc, // Keep for other updates like editing item details
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import ItemCard from "../../components/ItemCard.jsx";
import ItemForm from "../../components/ItemForm.jsx";
import Modal from "../../components/Modal.jsx";
import CompactFilterBar from "../../components/CompactFilterBar.jsx";
import { PageLoadingSkeleton } from "../../components/LoadingSkeletons.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import PlusCircleIcon from "../../components/icons/PlusCircleIcon.jsx";
import ShoppingBagIcon from "../../components/icons/ShoppingBagIcon.jsx";

const SellingSection = ({
  user,
  showMessage,
  navigateToAuth,
  globalSearchTerm = "",
  onSearchTermChange,
}) => {
  const [userItems, setUserItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isFormProcessing, setIsFormProcessing] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    sortBy: "newest",
    // status: "all", // Removed status filter for selling items
    priceRange: { min: "", max: "" },
  });

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

  useEffect(() => {
    const handleOpenModal = () => {
      setEditingItem(null);
      setIsModalOpen(true);
    };

    window.addEventListener("openAddItemModal", handleOpenModal);
    return () =>
      window.removeEventListener("openAddItemModal", handleOpenModal);
  }, []);

  const fetchUserItems = useCallback(() => {
    if (!user?.uid) {
      setLoading(false);
      setUserItems([]);
      return () => {};
    }

    setLoading(true);
    const q = query(
      collection(db, itemsCollectionPath),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const itemsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        itemsData.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        setUserItems(itemsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user items: ", error);
        showMessage(`Error fetching your items: ${error.message}`, "error");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user, showMessage, itemsCollectionPath]);

  useEffect(() => {
    const unsubscribe = fetchUserItems();
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [fetchUserItems]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters({
      ...newFilters,
      priceRange: newFilters.priceRange || { min: "", max: "" },
    });
  }, []);

  const processedItems = useMemo(() => {
    let filtered = userItems.filter((item) => {
      if (globalSearchTerm) {
        const term = globalSearchTerm.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(term);
        const descriptionMatch = item.description?.toLowerCase().includes(term);
        const categoryMatch = item.category?.toLowerCase().includes(term);
        if (!nameMatch && !descriptionMatch && !categoryMatch) return false;
      }
      if (filters.category && filters.category !== "All") {
        if (item.category !== filters.category) return false;
      }

      // Check if priceRange exists and has min/max properties
      if (filters.priceRange) {
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
      }
      return true;
    });

    // Sort logic remains the same
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
  }, [userItems, globalSearchTerm, filters]);

  const handleSubmitItem = async (itemData) => {
    if (!user) {
      throw new Error("User not logged in");
    }
    // Ensure itemData does not include a 'status' field related to sold/available
    const { status, ...restOfItemData } = itemData;

    try {
      if (editingItem?.id) {
        const docRef = doc(db, itemsCollectionPath, editingItem.id);
        await updateDoc(docRef, {
          ...restOfItemData, // Use restOfItemData
          updatedAt: serverTimestamp(),
        });
        showMessage("Item updated successfully!", "success", {
          /* ... */
        });
      } else {
        const docRef = collection(db, itemsCollectionPath);
        await addDoc(docRef, {
          ...restOfItemData, // Use restOfItemData
          // status: "available", // No longer setting default status
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showMessage("Item added successfully!", "success", {
          /* ... */
        });
      }
      setEditingItem(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving item: ", error);
      showMessage(`Submission failed: ${error.message}`, "error");
      throw error;
    }
  };

  const handleDeleteItem = async (itemId) => {
    // ... (keep existing logic)
    if (!user) {
      showMessage("Please log in to delete items.", "info");
      return;
    }
    if (!itemId) {
      showMessage("Error: Invalid item ID", "error");
      return;
    }
    if (operationInProgress) {
      showMessage("Another operation is in progress. Please wait.", "warning");
      return;
    }
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item permanently? This action cannot be undone."
    );
    if (!confirmDelete) {
      return;
    }
    setOperationInProgress(true);
    try {
      const docRef = doc(db, itemsCollectionPath, itemId);
      await deleteDoc(docRef);
      showMessage("Item deleted successfully!", "success");
    } catch (error) {
      console.error("Delete operation failed:", error);
      if (error.code === "permission-denied") {
        showMessage(
          "Permission denied. You can only delete your own items.",
          "error"
        );
      } else if (error.code === "not-found") {
        showMessage(
          "Item not found. It may have already been deleted.",
          "error"
        );
      } else {
        showMessage(`Failed to delete item: ${error.message}`, "error");
      }
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleContactFallback = useCallback(
    (item) => {
      if (!item.whatsappNumber) {
        showMessage(
          "You haven't provided a WhatsApp number for this item.",
          "info"
        );
      }
    },
    [showMessage]
  );

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!isFormProcessing) {
      setIsModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleClearSearch = useCallback(() => {
    onSearchTermChange?.("");
    setFilters((prev) => ({
      ...prev,
      category: "",
      // status: "all", // Removed
      priceRange: { min: "", max: "" },
    }));
  }, [onSearchTermChange]);

  if (loading) {
    return <PageLoadingSkeleton type="selling" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Your Items for Sale
          </h2>
          <p className="text-gray-600 mt-1">Manage your marketplace listings</p>
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
        <button
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md flex items-center space-x-2 transition-all hover:shadow-lg"
        >
          <PlusCircleIcon />
          <span>List New Item</span>
        </button>
      </div>

      {userItems.length > 0 && (
        <CompactFilterBar
          onFilterChange={handleFilterChange}
          categories={["All", ...categoriesList]}
          showPriceFilter={true}
          showSortOptions={true}
          showStatusFilter={false} // Set to false
          // statusOptions={statusOptions} // Removed
          initialFilters={filters}
          className="mb-8"
        />
      )}

      {userItems.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {processedItems.length === 0 ? (
              "No items match your criteria"
            ) : (
              <>
                Showing {processedItems.length} of {userItems.length} items
                {processedItems.length !== userItems.length && " (filtered)"}
              </>
            )}
          </p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Item" : "Add New Item for Sale"}
      >
        <ItemForm
          onSubmit={handleSubmitItem}
          initialData={editingItem || {}} // Pass empty object or default data
          type="sell"
          onFormProcessing={setIsFormProcessing}
        />
      </Modal>

      {processedItems.length === 0 ? (
        <div className="mt-8">
          {userItems.length === 0 ? (
            <EmptyState
              icon="shopping"
              title="No items listed yet"
              description="Start selling by listing your first item. It's quick and easy!"
              actionButton={
                <button
                  onClick={openAddModal}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <PlusCircleIcon />
                  <span>List Your First Item</span>
                </button>
              }
              className="py-16"
            />
          ) : (
            <EmptyState
              icon="search"
              title="No items found"
              description={
                globalSearchTerm
                  ? `No items match "${globalSearchTerm}". Try different keywords or adjust your filters.`
                  : "No items match your current filters. Try adjusting your search criteria."
              }
              className="py-16"
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedItems.map((item, index) => (
            <div
              key={`item-${item.id}-${index}`}
              className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transition-all hover:shadow-xl"
            >
              <ItemCard
                item={item}
                onContact={handleContactFallback}
                showMessage={showMessage}
                hideContactButton={true}
              />
              <div className="p-3 bg-gray-50 border-t flex space-x-2 mt-auto">
                <button
                  onClick={() => openEditModal(item)}
                  disabled={operationInProgress}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white text-sm font-semibold py-2 px-3 rounded-md transition-colors disabled:cursor-not-allowed"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={operationInProgress}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold py-2 px-3 rounded-md transition-colors disabled:cursor-not-allowed"
                >
                  {operationInProgress ? "..." : "Delete"}
                </button>
                {/* Mark as Sold/Available Button - REMOVED */}
              </div>
            </div>
          ))}
        </div>
      )}

      {userItems.length > 0 && processedItems.length > 0 && (
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 Selling Tips
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Add clear, well-lit photos to attract more buyers</li>
            <li>• Write detailed descriptions to answer common questions</li>
            <li>• Respond quickly to interested buyers via WhatsApp</li>
            {/* Removed tip about marking items as sold */}
            <li>• Keep your listings up-to-date</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SellingSection;

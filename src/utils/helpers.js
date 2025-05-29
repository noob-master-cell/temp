/**
 * Format a timestamp to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "Unknown time";

  const now = new Date();
  const date = timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString();
};

/**
 * Clean and validate WhatsApp number
 */
export const validateWhatsApp = (number) => {
  if (!number) return { isValid: false, error: "WhatsApp number is required" };

  const cleanNumber = number.replace(/\s+/g, "");
  const whatsappRegex = /^\+?\d{7,15}$/;
  const isValid = whatsappRegex.test(cleanNumber);

  return {
    isValid,
    cleanNumber: cleanNumber.replace(/[^\d+]/g, ""),
    error: isValid ? null : "Invalid WhatsApp number format",
  };
};

/**
 * Generate WhatsApp URL for contacting
 */
export const generateWhatsAppURL = (number, itemName) => {
  const { isValid, cleanNumber } = validateWhatsApp(number);

  if (!isValid) return null;

  const message = encodeURIComponent(
    `Hi, I'm interested in your item: "${itemName}" listed on LocalMart.`
  );

  return `https://wa.me/${cleanNumber}?text=${message}`;
};

/**
 * Format price for display
 */
export const formatPrice = (price) => {
  if (price == null || isNaN(price)) return "N/A";
  return `€${Number(price).toFixed(2)}`; // Changed from $ to €
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

/**
 * Generate placeholder image URL
 */
export const getPlaceholderImage = (
  text = "No Image",
  width = 600,
  height = 400
) => {
  return `https://placehold.co/${width}x${height}/e2e8f0/94a3b8?text=${encodeURIComponent(
    text
  )}`;
};

/**
 * Validate file for image upload
 */
export const validateImageFile = (file, maxSize = 5 * 1024 * 1024) => {
  if (!file.type.startsWith("image/")) {
    return { isValid: false, error: "File must be an image" };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Image must be smaller than ${maxSize / (1024 * 1024)}MB`,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Debounce function for search inputs
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Sort items by different criteria
 */
export const sortItems = (items, sortBy = "newest") => {
  const sortedItems = [...items];

  switch (sortBy) {
    case "newest":
      return sortedItems.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
    case "oldest":
      return sortedItems.sort(
        (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      );
    case "price-low":
      return sortedItems.sort((a, b) => (a.price || 0) - (b.price || 0));
    case "price-high":
      return sortedItems.sort((a, b) => (b.price || 0) - (a.price || 0));
    case "alphabetical":
      return sortedItems.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
    default:
      return sortedItems;
  }
};

/**
 * Filter items based on search criteria
 */
export const filterItems = (items, filters) => {
  const { searchTerm, category, status, priceRange } = filters;

  return items.filter((item) => {
    // Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = item.name?.toLowerCase().includes(term);
      const descriptionMatch = item.description?.toLowerCase().includes(term);
      if (!nameMatch && !descriptionMatch) return false;
    }

    // Category filter
    if (category && item.category !== category) return false;

    // Status filter
    if (status && item.status !== status) return false;

    // Price range filter
    if (priceRange && item.price != null) {
      const { min, max } = priceRange;
      if (min !== null && item.price < min) return false;
      if (max !== null && item.price > max) return false;
    }

    return true;
  });
};

export const ROUTES = {
  HOME: "/",
  BUY: "/buy",
  SELL: "/sell",
  LOST_FOUND: "/lostfound",
  AUTH: "/auth",
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
};

export const CATEGORIES = {
  SELL: [
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
  ],
  LOST_FOUND: [
    "Personal Belongings",
    "Electronics",
    "Keys",
    "Pets",
    "Documents",
    "Bags & Luggage",
    "Wallets & Purses",
    "Jewelry",
    "Other",
  ],
};

export const MESSAGE_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
};

export const LIMITS = {
  MAX_IMAGES: 5,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ITEMS_PER_PAGE: 12,
  LOAD_MORE_COUNT: 8,
};

export const ITEM_STATUS = {
  AVAILABLE: "available",
  SOLD: "sold",
  LOST: "lost",
  FOUND: "found",
  // FOUND_CLAIMED: "found_claimed", // Removed
  // LOST_RETURNED: "lost_returned", // Removed
};

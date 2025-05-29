import React from "react";

// Base skeleton component with shimmer animation
const SkeletonBase = ({ className = "", children, ...props }) => (
  <>
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${className}`}
      style={{
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
      {...props}
    >
      {children}
    </div>
    <style>
      {`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}
    </style>
  </>
);

// Item Card Skeleton - matches ItemCard layout
const ItemCardSkeleton = ({ className = "", isLostAndFound = false }) => (
  <div
    className={`bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full ${className}`}
  >
    {/* Image skeleton */}
    <SkeletonBase className="w-full h-56 bg-gray-200" />

    {/* Content skeleton */}
    <div className="p-5 flex-grow flex flex-col space-y-3">
      {/* Title skeleton */}
      <SkeletonBase className="h-6 bg-gray-200 rounded w-3/4" />

      {/* Description skeleton - 3 lines */}
      <div className="space-y-2">
        <SkeletonBase className="h-4 bg-gray-200 rounded w-full" />
        <SkeletonBase className="h-4 bg-gray-200 rounded w-5/6" />
        <SkeletonBase className="h-4 bg-gray-200 rounded w-2/3" />
      </div>

      {/* Price skeleton (for selling items) */}
      {!isLostAndFound && (
        <SkeletonBase className="h-8 bg-gray-200 rounded w-24 mt-2" />
      )}

      {/* Lost & Found specific info */}
      {isLostAndFound && (
        <div className="space-y-2">
          <SkeletonBase className="h-3 bg-gray-200 rounded w-48" />
          <SkeletonBase className="h-3 bg-gray-200 rounded w-36" />
        </div>
      )}

      {/* Metadata skeleton */}
      <div className="space-y-1 pt-2">
        <SkeletonBase className="h-3 bg-gray-200 rounded w-32" />
        <SkeletonBase className="h-3 bg-gray-200 rounded w-40" />
        <SkeletonBase className="h-3 bg-gray-200 rounded w-28" />
      </div>

      {/* Action buttons skeleton */}
      <div className="mt-auto pt-4">
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          {!isLostAndFound && (
            <SkeletonBase className="flex-1 h-10 bg-gray-200 rounded-lg" />
          )}
          <SkeletonBase className="flex-1 h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

// Grid of Item Card Skeletons
const ItemCardGridSkeleton = ({
  count = 8,
  isLostAndFound = false,
  className = "",
}) => (
  <div
    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
  >
    {Array.from({ length: count }).map((_, index) => (
      <ItemCardSkeleton key={index} isLostAndFound={isLostAndFound} />
    ))}
  </div>
);

// List Item Skeleton (for user's items in selling section)
const ListItemSkeleton = ({ className = "" }) => (
  <div
    className={`bg-white rounded-xl shadow-lg overflow-hidden flex flex-col ${className}`}
  >
    <SkeletonBase className="w-full h-56 bg-gray-200" />
    <div className="p-5 space-y-3">
      <SkeletonBase className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="space-y-2">
        <SkeletonBase className="h-4 bg-gray-200 rounded w-full" />
        <SkeletonBase className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
      <SkeletonBase className="h-8 bg-gray-200 rounded w-24" />
    </div>
    {/* Edit/Delete buttons skeleton */}
    <div className="p-3 bg-gray-50 border-t flex space-x-2">
      <SkeletonBase className="flex-1 h-8 bg-gray-200 rounded-md" />
      <SkeletonBase className="flex-1 h-8 bg-gray-200 rounded-md" />
    </div>
  </div>
);

// Search and Filter Bar Skeleton
const SearchFilterSkeleton = ({ className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SkeletonBase className="h-12 bg-gray-200 rounded-lg" />
      <SkeletonBase className="h-12 bg-gray-200 rounded-lg" />
      <SkeletonBase className="h-12 bg-gray-200 rounded-lg" />
    </div>
  </div>
);

// Auth Form Skeleton
const AuthFormSkeleton = ({ className = "" }) => (
  <div className={`bg-white p-8 sm:p-10 rounded-xl shadow-2xl ${className}`}>
    <div className="text-center mb-6">
      <SkeletonBase className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3" />
      <SkeletonBase className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2" />
      <SkeletonBase className="h-4 bg-gray-200 rounded w-32 mx-auto" />
    </div>

    <div className="space-y-5">
      <div>
        <SkeletonBase className="h-4 bg-gray-200 rounded w-24 mb-2" />
        <SkeletonBase className="h-12 bg-gray-200 rounded-lg w-full" />
      </div>
      <div>
        <SkeletonBase className="h-4 bg-gray-200 rounded w-20 mb-2" />
        <SkeletonBase className="h-12 bg-gray-200 rounded-lg w-full" />
      </div>
      <SkeletonBase className="h-12 bg-gray-200 rounded-lg w-full" />

      <div className="flex items-center my-6">
        <SkeletonBase className="flex-grow h-px bg-gray-200" />
        <SkeletonBase className="h-4 bg-gray-200 rounded w-32 mx-3" />
        <SkeletonBase className="flex-grow h-px bg-gray-200" />
      </div>

      <SkeletonBase className="h-12 bg-gray-200 rounded-lg w-full" />
    </div>
  </div>
);

// Header Skeleton
const HeaderSkeleton = ({ className = "" }) => (
  <nav className={`bg-white shadow-md ${className}`}>
    <div className="container mx-auto px-2 sm:px-4">
      <div className="flex items-center justify-between h-16 sm:h-20">
        {/* Logo skeleton */}
        <div className="flex items-center">
          <SkeletonBase className="w-7 h-7 bg-gray-200 rounded mr-2" />
          <SkeletonBase className="h-6 bg-gray-200 rounded w-24" />
        </div>

        {/* Desktop nav skeleton */}
        <div className="hidden md:flex items-center space-x-4">
          <SkeletonBase className="h-10 bg-gray-200 rounded w-16" />
          <SkeletonBase className="h-10 bg-gray-200 rounded w-16" />
          <SkeletonBase className="h-10 bg-gray-200 rounded w-24" />
        </div>

        {/* User action skeleton */}
        <SkeletonBase className="h-8 bg-gray-200 rounded w-20" />
      </div>
    </div>
  </nav>
);

// Section Header Skeleton
const SectionHeaderSkeleton = ({ className = "" }) => (
  <div
    className={`flex flex-col sm:flex-row justify-between items-center mb-8 gap-3 ${className}`}
  >
    <SkeletonBase className="h-8 bg-gray-200 rounded w-48" />
    <SkeletonBase className="h-10 bg-gray-200 rounded w-32" />
  </div>
);

// Empty State Skeleton
const EmptyStateSkeleton = ({ className = "" }) => (
  <div className={`text-center py-16 px-4 ${className}`}>
    <SkeletonBase className="w-16 h-16 bg-gray-200 rounded mx-auto mb-4" />
    <SkeletonBase className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2" />
    <SkeletonBase className="h-4 bg-gray-200 rounded w-64 mx-auto mb-6" />
    <SkeletonBase className="h-12 bg-gray-200 rounded w-40 mx-auto" />
  </div>
);

// Modal Skeleton
const ModalSkeleton = ({ className = "" }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
    <div
      className={`bg-white p-6 rounded-lg shadow-xl w-full max-w-md ${className}`}
    >
      <div className="flex justify-between items-center mb-4">
        <SkeletonBase className="h-6 bg-gray-200 rounded w-32" />
        <SkeletonBase className="w-6 h-6 bg-gray-200 rounded" />
      </div>
      <div className="space-y-4">
        <SkeletonBase className="h-12 bg-gray-200 rounded w-full" />
        <SkeletonBase className="h-24 bg-gray-200 rounded w-full" />
        <SkeletonBase className="h-12 bg-gray-200 rounded w-full" />
        <SkeletonBase className="h-12 bg-gray-200 rounded w-full" />
      </div>
    </div>
  </div>
);

// Page Loading Skeleton (combines multiple skeletons)
const PageLoadingSkeleton = ({
  type = "buying", // "buying", "selling", "lostfound", "auth"
  className = "",
}) => {
  switch (type) {
    case "selling":
      return (
        <div className={`container mx-auto px-4 py-8 ${className}`}>
          <SectionHeaderSkeleton />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <ListItemSkeleton key={index} />
            ))}
          </div>
        </div>
      );

    case "lostfound":
      return (
        <div className={`container mx-auto px-4 py-8 ${className}`}>
          <SectionHeaderSkeleton />
          <SearchFilterSkeleton className="mb-8" />
          <ItemCardGridSkeleton count={8} isLostAndFound={true} />
        </div>
      );

    case "auth":
      return (
        <div
          className={`min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 ${className}`}
        >
          <div className="max-w-4xl w-full md:grid md:grid-cols-2 md:gap-16 md:items-center">
            <div className="hidden md:block">
              <EmptyStateSkeleton />
            </div>
            <AuthFormSkeleton />
          </div>
        </div>
      );

    case "buying":
    default:
      return (
        <div className={`container mx-auto px-4 py-8 ${className}`}>
          <div className="text-center mb-8">
            <SkeletonBase className="h-10 bg-gray-200 rounded w-64 mx-auto mb-2" />
            <SkeletonBase className="h-4 bg-gray-200 rounded w-48 mx-auto" />
          </div>
          <SearchFilterSkeleton className="mb-8" />
          <ItemCardGridSkeleton count={12} />
        </div>
      );
  }
};

// Export all components
export {
  SkeletonBase,
  ItemCardSkeleton,
  ItemCardGridSkeleton,
  ListItemSkeleton,
  SearchFilterSkeleton,
  AuthFormSkeleton,
  HeaderSkeleton,
  SectionHeaderSkeleton,
  EmptyStateSkeleton,
  ModalSkeleton,
  PageLoadingSkeleton,
};

export default PageLoadingSkeleton;

// components/VirtualList.jsx
import React, { useState, useEffect, useRef, useCallback, memo } from "react";

const VirtualList = memo(
  ({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 3,
    className = "",
    onLoadMore,
    hasMore = false,
    isLoading = false,
    loadingComponent,
    emptyComponent,
    scrollingStateText = "Scrolling...",
    bufferSize = 5,
  }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollElementRef = useRef(null);
    const scrollTimeout = useRef(null);
    const lastScrollTime = useRef(Date.now());

    // Calculate visible range
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = items.slice(startIndex, endIndex + 1);
    const totalHeight = items.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    // Handle scroll with debouncing
    const handleScroll = useCallback(
      (e) => {
        const currentScrollTop = e.target.scrollTop;
        const currentTime = Date.now();
        const timeDiff = currentTime - lastScrollTime.current;

        setScrollTop(currentScrollTop);

        // Determine if fast scrolling
        const scrollSpeed = Math.abs(currentScrollTop - scrollTop) / timeDiff;
        const isFastScrolling = scrollSpeed > 2;

        if (!isScrolling || isFastScrolling) {
          setIsScrolling(true);
        }

        // Clear existing timeout
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }

        // Set scrolling to false after scroll ends
        scrollTimeout.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);

        lastScrollTime.current = currentTime;

        // Check if need to load more
        const scrollHeight = e.target.scrollHeight;
        const clientHeight = e.target.clientHeight;
        const scrollPercentage =
          (currentScrollTop + clientHeight) / scrollHeight;

        if (scrollPercentage > 0.8 && hasMore && !isLoading && onLoadMore) {
          onLoadMore();
        }
      },
      [scrollTop, isScrolling, hasMore, isLoading, onLoadMore]
    );

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
      };
    }, []);

    // Handle empty state
    if (items.length === 0 && !isLoading) {
      return (
        emptyComponent || (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No items to display
          </div>
        )
      );
    }

    return (
      <div className={`relative ${className}`}>
        {/* Scroll progress indicator */}
        {isScrolling && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full z-10">
            {scrollingStateText}
          </div>
        )}

        {/* Main scrollable container */}
        <div
          ref={scrollElementRef}
          className="overflow-auto"
          style={{ height: containerHeight }}
          onScroll={handleScroll}
        >
          {/* Total height container */}
          <div style={{ height: totalHeight, position: "relative" }}>
            {/* Visible items container */}
            <div
              style={{
                transform: `translateY(${offsetY}px)`,
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              {/* Render visible items */}
              {visibleItems.map((item, index) => (
                <div
                  key={item.id || startIndex + index}
                  style={{ height: itemHeight }}
                  className={isScrolling ? "pointer-events-none" : ""}
                >
                  {renderItem(item, startIndex + index, isScrolling)}
                </div>
              ))}
            </div>

            {/* Loading indicator at the bottom */}
            {isLoading && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: itemHeight,
                }}
              >
                {loadingComponent || (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scroll to top button */}
        {scrollTop > containerHeight && (
          <button
            onClick={() => {
              scrollElementRef.current?.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            className="absolute bottom-4 right-4 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            aria-label="Scroll to top"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

VirtualList.displayName = "VirtualList";

// Grid variant for item cards
export const VirtualGrid = memo(
  ({
    items,
    itemHeight,
    itemsPerRow,
    containerHeight,
    renderItem,
    gap = 16,
    className = "",
    onLoadMore,
    hasMore = false,
    isLoading = false,
    emptyComponent,
  }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const scrollElementRef = useRef(null);

    // Calculate grid dimensions
    const rowHeight = itemHeight + gap;
    const totalRows = Math.ceil(items.length / itemsPerRow);
    const totalHeight = totalRows * rowHeight;

    // Calculate visible range
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.ceil((scrollTop + containerHeight) / rowHeight);
    const startIndex = startRow * itemsPerRow;
    const endIndex = Math.min(items.length - 1, (endRow + 1) * itemsPerRow - 1);

    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = startRow * rowHeight;

    const handleScroll = useCallback(
      (e) => {
        const currentScrollTop = e.target.scrollTop;
        setScrollTop(currentScrollTop);

        // Check if need to load more
        const scrollHeight = e.target.scrollHeight;
        const clientHeight = e.target.clientHeight;
        const scrollPercentage =
          (currentScrollTop + clientHeight) / scrollHeight;

        if (scrollPercentage > 0.8 && hasMore && !isLoading && onLoadMore) {
          onLoadMore();
        }
      },
      [hasMore, isLoading, onLoadMore]
    );

    if (items.length === 0 && !isLoading) {
      return (
        emptyComponent || (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No items to display
          </div>
        )
      );
    }

    return (
      <div
        ref={scrollElementRef}
        className={`overflow-auto ${className}`}
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
                gap: `${gap}px`,
              }}
            >
              {visibleItems.map((item, index) => (
                <div
                  key={item.id || startIndex + index}
                  style={{ height: itemHeight }}
                >
                  {renderItem(item, startIndex + index)}
                </div>
              ))}
            </div>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
              className="flex items-center justify-center"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          )}
        </div>
      </div>
    );
  }
);

VirtualGrid.displayName = "VirtualGrid";

export default VirtualList;

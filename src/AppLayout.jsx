import React, { useState, useCallback, lazy, Suspense, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

// Import components that are always needed
import Header from "./components/Header.jsx";
import MobileNavigation from "./components/MobileNavigation.jsx";
import Footer from "./components/Footer.jsx";
import { PageLoadingSkeleton } from "./components/LoadingSkeletons.jsx";

// Lazy load feature sections
const NotFound = lazy(() => import("./components/NotFound.jsx"));
const AuthComponent = lazy(() => import("./features/auth/AuthComponent.jsx"));
const BuyingSection = lazy(() => import("./features/buying/BuyingSection.jsx"));
const SellingSection = lazy(() =>
  import("./features/selling/SellingSection.jsx")
);
const LostAndFoundSection = lazy(() =>
  import("./features/lostfound/LostAndFoundSection.jsx")
);

import { appId as firebaseAppId } from "./firebase.jsx";

// Loading component for Suspense
const SuspenseLoader = ({ type = "buying" }) => (
  <PageLoadingSkeleton type={type} />
);

// Protected Route Component
function ProtectedRoute({ user, children }) {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  return children;
}

function AppLayout({ user, handleLogout, showGlobalMessage }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname.startsWith("/auth");

  // Global search state
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);

  const navigateToAuthWithAction = useCallback(
    (action = "login") => {
      navigate(`/auth/${action}`);
    },
    [navigate]
  );

  // Handle global search from header (no longer needs debouncing here)
  const handleGlobalSearch = useCallback((searchTerm) => {
    setGlobalSearchTerm(searchTerm);

    // If search is cleared, reset results
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }

    // For now, we'll pass the search term to the active section
    console.log("Global search:", searchTerm);
  }, []);

  // Clear search when route changes
  useEffect(() => {
    setGlobalSearchTerm("");
    setSearchResults(null);
  }, [location.pathname]);

  // Prefetch components on hover/focus
  const prefetchComponent = useCallback((componentName) => {
    switch (componentName) {
      case "buy":
        import("./features/buying/BuyingSection.jsx");
        break;
      case "sell":
        import("./features/selling/SellingSection.jsx");
        break;
      case "lostfound":
        import("./features/lostfound/LostAndFoundSection.jsx");
        break;
      case "auth":
        import("./features/auth/AuthComponent.jsx");
        break;
    }
  }, []);

  // Determine if current page should show search
  const shouldShowSearch = !isAuthPage;

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {/* Enhanced Header with Search */}
      {!isAuthPage && (
        <Header
          user={user}
          onLogout={handleLogout}
          onNavigateToAuth={navigateToAuthWithAction}
          onSearchChange={handleGlobalSearch}
          searchValue={globalSearchTerm}
          showSearch={shouldShowSearch}
        />
      )}

      {/* Main Content */}
      <main className={`flex-grow ${!isAuthPage ? "pb-20 md:pb-5" : ""}`}>
        <Suspense fallback={<SuspenseLoader type="buying" />}>
          <Routes>
            <Route path="/" element={<Navigate to="/buy" replace />} />
            <Route
              path="/buy"
              element={
                <BuyingSection
                  user={user}
                  showMessage={showGlobalMessage}
                  globalSearchTerm={globalSearchTerm}
                  onSearchTermChange={setGlobalSearchTerm}
                />
              }
            />
            <Route
              path="/sell"
              element={
                <ProtectedRoute user={user}>
                  <SellingSection
                    user={user}
                    showMessage={showGlobalMessage}
                    navigateToAuth={navigateToAuthWithAction}
                    globalSearchTerm={globalSearchTerm}
                    onSearchTermChange={setGlobalSearchTerm}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lostfound"
              element={
                <LostAndFoundSection
                  user={user}
                  showMessage={showGlobalMessage}
                  navigateToAuth={navigateToAuthWithAction}
                  globalSearchTerm={globalSearchTerm}
                  onSearchTermChange={setGlobalSearchTerm}
                />
              }
            />
            <Route path="/auth/:action" element={<AuthComponent />} />
            <Route
              path="/auth"
              element={<Navigate to="/auth/login" replace />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      {/* Mobile Navigation with prefetch on hover */}
      {!isAuthPage && (
        <div
          onMouseEnter={() => prefetchComponent("sell")}
          onTouchStart={() => prefetchComponent("sell")}
        >
          <MobileNavigation
            user={user}
            onLogout={handleLogout}
            onNavigateToAuth={navigateToAuthWithAction}
          />
        </div>
      )}

      {/* Footer */}
      {!isAuthPage && <Footer user={user} />}

      {/* Global Search Results Overlay (if implemented) */}
      {searchResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Search Results for "{globalSearchTerm}"
                </h3>
                <button
                  onClick={() => {
                    setSearchResults(null);
                    setGlobalSearchTerm("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
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
            </div>
            <div className="p-4">
              {/* Search results would be rendered here */}
              <div className="text-center py-8 text-gray-500">
                Global search results would appear here
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions FAB (Floating Action Button) */}
      {user && !isAuthPage && (
        <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-30">
          <div className="flex flex-col space-y-3">
            {/* Add Item FAB */}
            <button
              onClick={() => {
                const currentPath = location.pathname;
                if (currentPath === "/sell") {
                  // Trigger add item modal in selling section
                  window.dispatchEvent(new CustomEvent("openAddItemModal"));
                } else if (currentPath === "/lostfound") {
                  // Trigger add item modal in lost & found section
                  window.dispatchEvent(
                    new CustomEvent("openAddLostFoundModal")
                  );
                } else {
                  // Navigate to sell page
                  navigate("/sell");
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 group"
              title="Add new item"
            >
              <svg
                className="w-6 h-6 transition-transform group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>

            {/* Quick Search FAB (mobile only) */}
            <button
              onClick={() => {
                document
                  .querySelector('input[placeholder="Search items..."]')
                  ?.focus();
              }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 md:hidden"
              title="Quick search"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppLayout;

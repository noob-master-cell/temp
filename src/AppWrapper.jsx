import React, { useState, useCallback } from "react";
import { BrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout.jsx";
import MessageBar from "./components/MessageBar.jsx";
import useAuth from "./hooks/useAuth.jsx";
import { signOut } from "firebase/auth";
import { auth } from "./firebase.jsx";

function AppWrapper() {
  const [message, setMessage] = useState({
    text: "",
    type: "info",
    shareData: null,
    duration: 5000,
    autoDismiss: true,
  });
  const { user, isAuthReady } = useAuth();

  // Enhanced message function with full MessageBar support
  const showGlobalMessage = useCallback((text, type = "info", options = {}) => {
    const {
      shareData = null,
      duration = 5000,
      autoDismiss = true,
      position = "bottom-right",
    } = options;

    setMessage({
      text,
      type,
      shareData,
      duration,
      autoDismiss,
      position,
    });
  }, []);

  const dismissMessage = useCallback(() => {
    setMessage({
      text: "",
      type: "info",
      shareData: null,
      duration: 5000,
      autoDismiss: true,
    });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showGlobalMessage("Logged out successfully.", "success", {
        duration: 3000,
        shareData: {
          title: "LocalMart - Community Marketplace",
          text: "Check out LocalMart, your local community marketplace!",
          url: window.location.origin,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
      showGlobalMessage(`Logout error: ${error.message}`, "error", {
        duration: 8000,
        autoDismiss: true,
      });
    }
  };

  // Handle various app-level events that should show messages
  React.useEffect(() => {
    // Listen for network status changes
    const handleOnline = () => {
      showGlobalMessage("You're back online!", "success", { duration: 3000 });
    };

    const handleOffline = () => {
      showGlobalMessage(
        "You're offline. Some features may not work.",
        "warning",
        {
          duration: 0, // Don't auto-dismiss when offline
          autoDismiss: false,
        }
      );
    };

    // Listen for app install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      showGlobalMessage("Install LocalMart for a better experience!", "info", {
        duration: 10000,
        shareData: {
          title: "Install LocalMart",
          text: "Get the LocalMart app for faster access to your local marketplace",
          url: window.location.origin,
        },
      });
    };

    // Listen for successful item operations
    const handleItemSuccess = (event) => {
      const { action, item, user } = event.detail;
      let message = "";
      let shareData = null;

      switch (action) {
        case "item_sold":
          message = `"${item.name}" marked as sold!`;
          shareData = {
            title: `${item.name} - Sold on LocalMart`,
            text: `I just sold "${item.name}" on LocalMart!`,
            url: window.location.href,
          };
          break;
        case "item_found":
          message = `"${item.name}" marked as found! Great job helping the community.`;
          shareData = {
            title: `${item.name} - Found on LocalMart`,
            text: `Great news! "${item.name}" has been found thanks to our community.`,
            url: window.location.href,
          };
          break;
        case "profile_updated":
          message = "Profile updated successfully!";
          break;
        default:
          message = "Action completed successfully!";
      }

      showGlobalMessage(message, "success", { shareData });
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("itemSuccess", handleItemSuccess);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("itemSuccess", handleItemSuccess);
    };
  }, [showGlobalMessage]);

  // Show loading screen while auth is initializing
  if (!isAuthReady) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
        <div className="relative">
          {/* Enhanced loading spinner */}
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          <div className="absolute inset-0 rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-200 animate-spin-slow"></div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-xl text-gray-700 font-medium">
            Initializing LocalMart...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Setting up your marketplace experience
          </p>
        </div>

        {/* Loading tips */}
        <div className="mt-8 max-w-md text-center">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-600">
              💡 <strong>Tip:</strong> Use the search in the header to quickly
              find items across all categories!
            </p>
          </div>
        </div>

        {/* Add custom CSS for slow spinning animation */}
        <style>
          {`
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
              animation: spin-slow 3s linear infinite;
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppLayout
        user={user}
        handleLogout={handleLogout}
        showGlobalMessage={showGlobalMessage}
      />

      {/* Enhanced MessageBar with all new features */}
      <MessageBar
        message={message.text}
        type={message.type}
        onDismiss={dismissMessage}
        shareData={message.shareData}
        autoDismiss={message.autoDismiss}
        duration={message.duration}
        position={message.position}
      />

      {/* App Install Banner (for PWA) */}
      {user && (
        <div
          id="install-banner"
          className="hidden fixed bottom-20 left-4 right-4 bg-indigo-600 text-white p-4 rounded-lg shadow-lg z-40 md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-sm">Install LocalMart</p>
              <p className="text-xs text-indigo-200">
                Get faster access to your marketplace
              </p>
            </div>
            <div className="flex space-x-2 ml-4">
              <button
                id="install-accept"
                className="bg-white text-indigo-600 px-3 py-1 rounded text-xs font-medium hover:bg-indigo-50 transition-colors"
              >
                Install
              </button>
              <button
                id="install-dismiss"
                className="text-indigo-200 hover:text-white transition-colors"
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
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}

export default AppWrapper;

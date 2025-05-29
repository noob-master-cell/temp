import { useState, useEffect } from "react";
import { auth } from "../firebase.jsx";
import { onAuthStateChanged, signInWithCustomToken } from "firebase/auth";

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Handle custom token if available (for server-side auth)
        const token =
          typeof __initial_auth_token !== "undefined"
            ? __initial_auth_token
            : null;

        if (token && !auth.currentUser) {
          console.log("useAuth: Attempting custom token sign-in...");
          await signInWithCustomToken(auth, token);
        }
      } catch (error) {
        console.error("useAuth: Custom token error:", error);
        if (isMounted) {
          setAuthError(
            error.code === "auth/custom-token-mismatch"
              ? "Authentication token mismatch"
              : error.message
          );
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (isMounted) {
          setUser(currentUser);
          setAuthError(null);

          if (!isAuthReady) {
            setIsAuthReady(true);
          }
        }
      },
      (error) => {
        console.error("useAuth: Auth state change error:", error);
        if (isMounted) {
          setAuthError(error.message);
          setIsAuthReady(true);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isAuthReady]);

  return {
    user,
    isAuthReady,
    authError,
    isLoggedIn: !!user,
  };
};

export default useAuth;

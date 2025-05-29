import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  auth,
  db,
  appId,
  GoogleAuthProvider,
  Timestamp,
} from "../../firebase.jsx"; // Updated extension
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import GoogleIcon from "../../components/icons/GoogleIcon.jsx";
import HomeIcon from "../../components/icons/HomeIcon.jsx";

const AuthComponent = () => {
  // Removed onLoginSuccessProp, setCurrentView as navigation is handled by router
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  // Determine if it's signup or login based on the route action parameter
  const isSignup = location.pathname.includes("/signup");

  const handleAuthSuccess = (userCredential) => {
    const from = location.state?.from?.pathname || "/buy"; // Redirect to previous page or home/buy
    navigate(from, { replace: true });
  };

  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      let userCredential;
      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }
      handleAuthSuccess(userCredential);
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential" ||
          err.code === "auth/wrong-password" ||
          err.code === "auth/user-not-found"
          ? "Invalid email or password."
          : err.message
      );
      console.error("Email/Password Auth error:", err);
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, `artifacts/${appId}/users`, user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          createdAt: Timestamp.now(), // use Timestamp from firebase.js
          provider: "google.com",
          photoURL: user.photoURL,
        });
        console.log("New Google user profile created in Firestore.");
      }
      handleAuthSuccess(result);
    } catch (err) {
      setError(err.message);
      console.error("Google Sign-In error:", err);
    }
    setIsLoading(false);
  };

  const toggleAuthMode = () => {
    setError("");
    if (isSignup) {
      navigate("/auth/login", { state: location.state });
    } else {
      navigate("/auth/signup", { state: location.state });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 md:grid md:grid-cols-2 md:gap-16 md:items-center">
        {/* Left Column: Branding */}
        <div className="hidden md:flex flex-col items-center justify-center text-center p-8">
          <HomeIcon className="w-24 h-24 text-indigo-600 mb-6" />
          <h1 className="text-5xl font-extrabold text-gray-900">LocalMart</h1>
          <p className="mt-4 text-xl text-gray-600">
            Your Community Marketplace & Lost & Found Hub.
          </p>
          <p className="mt-2 text-md text-gray-500">
            {isSignup
              ? "Create an account to start buying, selling, and helping your neighbors!"
              : "Sign in to access your account and continue exploring."}
          </p>
        </div>

        {/* Right Column: Form */}
        <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl">
          <div className="md:hidden flex flex-col items-center text-center mb-6">
            <HomeIcon className="w-16 h-16 text-indigo-600 mb-3" />
            <h2 className="text-3xl font-bold text-gray-900">LocalMart</h2>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            {isSignup ? "Create your Account" : "Welcome Back!"}
          </h2>
          <p className="text-center text-sm text-gray-600 mb-6">
            {isSignup ? "Join our community today." : "Sign in to continue."}
          </p>

          {error && (
            <p className="bg-red-100 text-red-700 p-3 rounded-md mb-5 text-sm text-center">
              {error}
            </p>
          )}

          <form onSubmit={handleEmailPasswordSubmit} className="space-y-5">
            <div>
              <label
                className="block text-gray-700 text-sm font-medium mb-1"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label
                className="block text-gray-700 text-sm font-medium mb-1"
                htmlFor="password"
              >
                Password
              </label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </div>
            {isSignup && (
              <p className="text-xs text-gray-500">
                Password should be at least 6 characters.
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading &&
                (isSignup ? "Creating Account..." : "Logging In...")}
              {!isLoading &&
                (isSignup ? "Sign Up with Email" : "Login with Email")}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-3 text-gray-400 text-xs">
              OR CONTINUE WITH
            </span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-600 font-medium py-3 px-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400 transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <GoogleIcon />
            <span>Sign {isSignup ? "up" : "in"} with Google</span>
          </button>

          <p className="text-center text-gray-600 mt-8 text-sm">
            {isSignup ? "Already have an account? " : "New to LocalMart? "}
            <button
              onClick={toggleAuthMode}
              className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline focus:outline-none"
            >
              {isSignup ? "Sign In" : "Create an Account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthComponent;

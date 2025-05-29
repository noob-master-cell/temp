import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, Timestamp } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCsCXjZw8XZd6hhyXvNw5OOuDr6vxXHBQc",
  authDomain: "localmartapp-ae7ee.firebaseapp.com",
  projectId: "localmartapp-ae7ee",
  storageBucket: "localmartapp-ae7ee.firebasestorage.app",
  messagingSenderId: "455190095633",
  appId: "1:455190095633:web:f9fe413b03ef148fb80eb0",
  measurementId: "G-HC7P2PEQ0X",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const authInstance = getAuth(app);
const dbInstance = getFirestore(app);
const storageInstance = getStorage(app);

const appIdentifier =
  typeof __app_id !== "undefined" ? __app_id : "default-marketplace-app";

export {
  app,
  authInstance as auth,
  dbInstance as db,
  storageInstance as storage,
  analytics,
  appIdentifier as appId,
  GoogleAuthProvider,
  Timestamp,
  getDownloadURL,
  ref,
  uploadBytes,
  deleteObject,
};

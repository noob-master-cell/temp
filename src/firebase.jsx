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

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
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

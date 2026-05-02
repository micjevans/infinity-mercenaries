import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "INSERT_HERE",
  authDomain: "INSERT_HERE",
  projectId: "INSERT_HERE",
  storageBucket: "INSERT_HERE",
  messagingSenderId: "INSERT_HERE",
  appId: "INSERT_HERE",
  measurementId: "INSERT_HERE",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set authentication persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting persistence:", error.message);
});

export { app };

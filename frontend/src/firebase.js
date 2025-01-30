// Import the necessary Firebase modules
import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // If you're using Firestore
import { getStorage } from "firebase/storage"; // If you're using Firebase Storage

// Your Firebase configuration object (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyDTr4jf9ZZgagDjzVe8xkpgZF5zzXyQRD8",
  authDomain: "infinity-mercenaries.firebaseapp.com",
  projectId: "infinity-mercenaries",
  storageBucket: "infinity-mercenaries.firebasestorage.app",
  messagingSenderId: "663643569719",
  appId: "1:663643569719:web:20028ef37005d20372c9b2",
  measurementId: "G-BCZYR0J4JD",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app); // Firebase Authentication
export const db = getFirestore(app); // Firestore Database (optional)
export const storage = getStorage(app); // Firebase Storage (optional)

// Set persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting persistence:", error.message);
});

// Export the app for other uses
const firebaseServices = { app, auth };
export default firebaseServices;

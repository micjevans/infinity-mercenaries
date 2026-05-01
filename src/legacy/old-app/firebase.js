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
  apiKey: "AIzaSyDTr4jf9ZZgagDjzVe8xkpgZF5zzXyQRD8",
  authDomain: "infinity-mercenaries.firebaseapp.com",
  projectId: "infinity-mercenaries",
  storageBucket: "infinity-mercenaries.firebasestorage.app",
  messagingSenderId: "663643569719",
  appId: "1:663643569719:web:20028ef37005d20372c9b2",
  measurementId: "G-BCZYR0J4JD",
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

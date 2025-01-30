import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

// Utility: Parse Firebase Authentication Errors
const parseAuthError = (error) => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "This email is already in use. Please try signing in.";
    case "auth/invalid-email":
      return "The email address is invalid. Please check and try again.";
    case "auth/user-not-found":
      return "No user found with this email. Please sign up first.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    default:
      return "An error occurred. Please try again.";
  }
};

// Email/Password Sign-Up
export const signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    console.error("Error signing up:", error.message);
    throw new Error(parseAuthError(error));
  }
};

// Email/Password Sign-In
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error.message);
    throw new Error(parseAuthError(error));
  }
};

// Google Sign-In
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();

  // Example: Add Scopes for Google Sign-In
  provider.addScope("profile");
  provider.addScope("email");

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error.message);
    throw new Error(parseAuthError(error));
  }
};

// Sign-Out
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error.message);
    throw new Error("An error occurred while signing out. Please try again.");
  }
};

// Listen for Authentication State Changes
export const onAuthStateChange = (callback) => {
  return auth.onAuthStateChanged(callback);
};

// Export the Auth Instance
export { auth };

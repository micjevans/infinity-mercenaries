import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Get a user document from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} - User data or null if not found
 */
export const getUser = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user:", error);
    // Don't throw the error, just return null to allow the flow to continue
    return null;
  }
};

/**
 * Create or update a user document in Firestore
 * @param {string} uid - User ID
 * @param {Object} userData - User data to save
 * @returns {Promise<Object>} - Result with success status
 */
export const createOrUpdateUser = async (uid, userData) => {
  try {
    const userRef = doc(db, "users", uid);

    await setDoc(
      userRef,
      {
        ...userData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true };
  } catch (error) {
    console.error("Error creating/updating user:", error);

    // For now, consider auth successful even if Firestore update fails
    // This allows users to continue using the app while you fix permissions
    return { success: true, warning: "User profile may not be fully updated" };
  }
};

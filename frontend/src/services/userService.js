import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
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

/**
 * Set a user role in Firestore
 * @param {string} userId - User ID
 * @param {string} role - Role to set (e.g., 'admin', 'moderator')
 * @param {boolean} value - Value to set for the role (true or false)
 * @returns {Promise<Object>} - Result with success status
 */
export const setUserRole = async (userId, role, value) => {
  try {
    // Create the update path dynamically using dot notation
    // This updates a specific field in the roles object
    const updateData = {};
    updateData[`roles.${role}`] = value;

    await updateDoc(doc(db, "users", userId), updateData);
    return { success: true };
  } catch (error) {
    console.error(`Error setting user ${role} role:`, error);
    return { success: false, error };
  }
};

// Example usage:
// Make a user a moderator: await setUserRole(userId, 'moderator', true)
// Make a user an admin: await setUserRole(userId, 'admin', true)
// Remove moderator role: await setUserRole(userId, 'moderator', false)

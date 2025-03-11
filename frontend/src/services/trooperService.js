import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Get troopers for a specific company
 * @param {string} companyId - The company ID
 * @param {string} userId - The user ID (optional, uses current user if not provided)
 * @returns {Promise<Array>} - List of troopers
 */
export const getTroopers = async (companyId, userId) => {
  try {
    if (!companyId) {
      throw new Error("Company ID is required");
    }

    // If userId is not provided, it should be handled at the component level
    if (!userId) {
      throw new Error("User ID is required");
    }

    const troopersRef = collection(
      db,
      "users",
      userId,
      "companies",
      companyId,
      "troopers"
    );

    const snapshot = await getDocs(troopersRef);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching troopers:", error);
    throw error;
  }
};

/**
 * Add a new trooper to a company
 * @param {string} companyId - The company ID
 * @param {object} trooper - The trooper data
 * @param {string} userId - The user ID (optional, uses current user if not provided)
 * @returns {Promise<object>} - The newly created trooper with ID
 */
export const addTrooper = async (companyId, trooper, userId) => {
  try {
    if (!companyId || !trooper) {
      throw new Error("Company ID and trooper data are required");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Remove ID to avoid duplicates
    const { id, ...trooperData } = trooper;

    const troopersRef = collection(
      db,
      "users",
      userId,
      "companies",
      companyId,
      "troopers"
    );

    const docRef = await addDoc(troopersRef, trooperData);

    return {
      id: docRef.id,
      ...trooperData,
    };
  } catch (error) {
    console.error("Error adding trooper:", error);
    throw error;
  }
};

/**
 * Update an existing trooper
 * @param {string} companyId - The company ID
 * @param {object} trooper - The trooper data with ID
 * @param {string} userId - The user ID (optional, uses current user if not provided)
 * @returns {Promise<void>}
 */
export const updateTrooper = async (companyId, trooper, userId) => {
  try {
    if (!companyId || !trooper || !trooper.id) {
      throw new Error("Company ID and trooper data with ID are required");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    const trooperRef = doc(
      db,
      "users",
      userId,
      "companies",
      companyId,
      "troopers",
      trooper.id
    );

    await updateDoc(trooperRef, trooper);
  } catch (error) {
    console.error("Error updating trooper:", error);
    throw error;
  }
};

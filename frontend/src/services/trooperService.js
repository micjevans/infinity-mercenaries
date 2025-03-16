import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import store from "../redux/store";
import { showNotification } from "../redux/notificationsSlice";

// Local storage key
const LOCAL_TROOPERS_KEY = "localTroopers";

// Helper functions for local storage
const getLocalTroopers = (companyId) => {
  try {
    const troopers = localStorage.getItem(LOCAL_TROOPERS_KEY);
    const parsedTroopers = troopers ? JSON.parse(troopers) : {};
    return parsedTroopers[companyId] || [];
  } catch (error) {
    console.error("Error retrieving troopers from localStorage:", error);
    return [];
  }
};

const saveLocalTroopers = (companyId, troopers) => {
  try {
    const allTroopers = localStorage.getItem(LOCAL_TROOPERS_KEY);
    const parsedTroopers = allTroopers ? JSON.parse(allTroopers) : {};
    parsedTroopers[companyId] = troopers;
    localStorage.setItem(LOCAL_TROOPERS_KEY, JSON.stringify(parsedTroopers));
  } catch (error) {
    console.error("Error saving troopers to localStorage:", error);
  }
};

/**
 * Get troopers for a specific company
 * @param {string} companyId - The company ID
 * @param {string} userId - The user ID (optional, uses current user if not provided)
 * @param {boolean} local - Whether to use localStorage instead of Firestore
 * @returns {Promise<Array>} - List of troopers
 */
export const getTroopers = async (companyId, userId, local = false) => {
  try {
    if (!companyId) {
      throw new Error("Company ID is required");
    }

    // Handle local storage request
    if (local) {
      return getLocalTroopers(companyId);
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
 * @param {boolean} local - Whether to use localStorage instead of Firestore
 * @returns {Promise<object>} - The newly created trooper with ID
 */
export const addTrooper = async (companyId, trooper, userId, local = false) => {
  try {
    if (!companyId || !trooper) {
      throw new Error("Company ID and trooper data are required");
    }

    // Handle local storage request
    if (local) {
      const troopers = getLocalTroopers(companyId);
      const newTrooper = {
        ...trooper,
        id: Date.now().toString(), // Generate a unique ID
        createdAt: new Date().toISOString(),
      };
      troopers.push(newTrooper);
      saveLocalTroopers(companyId, troopers);

      // Show success notification
      store.dispatch(
        showNotification(
          trooper.captain
            ? "Captain added successfully!"
            : "Trooper added successfully!"
        )
      );

      return newTrooper;
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

    // Show success notification
    store.dispatch(
      showNotification(
        trooper.captain
          ? "Captain added successfully!"
          : "Trooper added successfully!"
      )
    );

    return {
      id: docRef.id,
      ...trooperData,
    };
  } catch (error) {
    console.error("Error adding trooper:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error adding trooper: ${error.message}`, "error")
    );

    throw error;
  }
};

/**
 * Update an existing trooper
 * @param {string} companyId - The company ID
 * @param {object} trooper - The trooper data with ID
 * @param {string} userId - The user ID (optional, uses current user if not provided)
 * @param {boolean} local - Whether to use localStorage instead of Firestore
 * @returns {Promise<void>}
 */
export const updateTrooper = async (
  companyId,
  trooper,
  userId,
  local = false
) => {
  try {
    if (!companyId || !trooper || !trooper.id) {
      throw new Error("Company ID and trooper data with ID are required");
    }

    // Handle local storage request
    if (local) {
      const troopers = getLocalTroopers(companyId);
      const index = troopers.findIndex((t) => t.id === trooper.id);

      if (index === -1) {
        throw new Error("Trooper not found");
      }

      troopers[index] = {
        ...troopers[index],
        ...trooper,
        updatedAt: new Date().toISOString(),
      };

      saveLocalTroopers(companyId, troopers);

      // Show success notification
      store.dispatch(showNotification("Trooper updated successfully!"));
      return;
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

    // Show success notification
    store.dispatch(showNotification("Trooper updated successfully!"));
  } catch (error) {
    console.error("Error updating trooper:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error updating trooper: ${error.message}`, "error")
    );

    throw error;
  }
};

/**
 * Delete a trooper from a company
 * @param {string} companyId - The company ID
 * @param {string} trooperId - The trooper ID to delete
 * @param {string} userId - The user ID
 * @param {boolean} local - Whether to use localStorage instead of Firestore
 * @returns {Promise<void>}
 */
export const deleteTrooper = async (
  companyId,
  trooperId,
  userId,
  local = false
) => {
  try {
    if (!companyId || !trooperId) {
      throw new Error("Company ID and trooper ID are required");
    }

    // Handle local storage request
    if (local) {
      const troopers = getLocalTroopers(companyId);
      const updatedTroopers = troopers.filter((t) => t.id !== trooperId);

      if (troopers.length === updatedTroopers.length) {
        throw new Error("Trooper not found");
      }

      saveLocalTroopers(companyId, updatedTroopers);

      // Show success notification
      store.dispatch(showNotification("Trooper deleted successfully!"));
      return;
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
      trooperId
    );

    await deleteDoc(trooperRef);

    // Show success notification
    store.dispatch(showNotification("Trooper deleted successfully!"));
  } catch (error) {
    console.error("Error deleting trooper:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error deleting trooper: ${error.message}`, "error")
    );

    throw error;
  }
};

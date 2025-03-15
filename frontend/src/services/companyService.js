import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// Get all companies for a user - UPDATED to match CompanyList's approach
export const getUserCompanies = async (userId) => {
  // This is where we need to fix - companies are stored as subcollections under user docs
  const companiesSnapshot = await getDocs(
    collection(db, "users", userId, "companies")
  );

  return companiesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Get a single company by ID
export const getCompany = async (companyId) => {
  const companyDoc = await getDoc(doc(db, "companies", companyId));

  if (companyDoc.exists()) {
    return {
      id: companyDoc.id,
      ...companyDoc.data(),
    };
  }

  return null;
};

// Get all troopers for a company
export const getTroopersForCompany = async (companyId) => {
  try {
    const troopersSnapshot = await getDocs(
      query(collection(db, "troopers"), where("companyId", "==", companyId))
    );

    return troopersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting troopers for company:", error);
    throw error;
  }
};

/**
 * Create a new company for a user
 * @param {string} userId - User ID
 * @param {object} companyData - Company data to save
 * @returns {Promise<string>} - The ID of the created company
 */
export const createCompany = async (userId, companyData) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const companiesRef = collection(db, "users", userId, "companies");
    const docRef = await addDoc(companiesRef, {
      ...companyData,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating company:", error);
    throw error;
  }
};

/**
 * Delete a company
 * @param {string} userId - User ID
 * @param {string} companyId - Company ID to delete
 * @returns {Promise<void>}
 */
export const deleteCompany = async (userId, companyId) => {
  try {
    if (!userId || !companyId) {
      throw new Error("User ID and Company ID are required");
    }

    const companyRef = doc(db, "users", userId, "companies", companyId);
    await deleteDoc(companyRef);
  } catch (error) {
    console.error("Error deleting company:", error);
    throw error;
  }
};

// Update an existing company
export const updateCompany = async (companyId, companyData) => {
  try {
    await updateDoc(doc(db, "companies", companyId), {
      ...companyData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating company:", error);
    throw error;
  }
};

/**
 * Update company details including sectorials
 * @param {string} userId - User ID
 * @param {string} companyId - Company ID
 * @param {object} companyDetails - Company details to update
 * @returns {Promise<Object>} - Result with success status
 */
export const updateCompanyDetails = async (
  userId,
  companyId,
  companyDetails
) => {
  try {
    if (!userId || !companyId) {
      throw new Error("User ID and Company ID are required");
    }

    const companyRef = doc(db, "users", userId, "companies", companyId);
    await updateDoc(companyRef, companyDetails);

    return { success: true };
  } catch (error) {
    console.error("Error saving company details:", error);
    return { success: false, error };
  }
};

/**
 * Update company inventory and credits
 * @param {string} userId - User ID
 * @param {string} companyId - Company ID
 * @param {array} inventory - Updated inventory array
 * @param {number} credits - Updated credits amount
 * @returns {Promise<Object>} - Result with success status
 */
export const updateInventoryAndCredits = async (
  userId,
  companyId,
  inventory,
  credits
) => {
  try {
    if (!userId || !companyId) {
      throw new Error("User ID and Company ID are required");
    }

    const companyRef = doc(db, "users", userId, "companies", companyId);
    await updateDoc(companyRef, {
      inventory,
      credits,
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving inventory changes:", error);
    return { success: false, error };
  }
};

// Create a new trooper
export const createTrooper = async (trooperData) => {
  try {
    const trooperRef = await addDoc(collection(db, "troopers"), {
      ...trooperData,
      createdAt: serverTimestamp(),
    });

    return trooperRef.id;
  } catch (error) {
    console.error("Error creating trooper:", error);
    throw error;
  }
};

// Update an existing trooper
export const updateTrooper = async (trooperId, trooperData) => {
  try {
    await updateDoc(doc(db, "troopers", trooperId), {
      ...trooperData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating trooper:", error);
    throw error;
  }
};

// Delete a trooper
export const deleteTrooper = async (trooperId) => {
  try {
    await deleteDoc(doc(db, "troopers", trooperId));
  } catch (error) {
    console.error("Error deleting trooper:", error);
    throw error;
  }
};

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
import store from "../redux/store";
import { showNotification } from "../redux/notificationsSlice";

// Local storage keys
const LOCAL_COMPANIES_KEY = "localCompanies";

// Helper functions for local storage
const getLocalCompanies = (userId) => {
  try {
    const companies = localStorage.getItem(LOCAL_COMPANIES_KEY);
    const parsedCompanies = companies ? JSON.parse(companies) : {};
    return parsedCompanies[userId] || [];
  } catch (error) {
    console.error("Error retrieving companies from localStorage:", error);
    return [];
  }
};

const saveLocalCompanies = (userId, companies) => {
  try {
    const allCompanies = localStorage.getItem(LOCAL_COMPANIES_KEY);
    const parsedCompanies = allCompanies ? JSON.parse(allCompanies) : {};
    parsedCompanies[userId] = companies;
    localStorage.setItem(LOCAL_COMPANIES_KEY, JSON.stringify(parsedCompanies));
  } catch (error) {
    console.error("Error saving companies to localStorage:", error);
  }
};

const getLocalCompanyById = (userId, companyId) => {
  const companies = getLocalCompanies(userId);
  return companies.find((company) => company.id === companyId) || null;
};

// Get all companies for a user - UPDATED to handle local companies
export const getUserCompanies = async (userId, local = false) => {
  // Handle local storage request
  if (local) {
    return getLocalCompanies(userId);
  }

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
export const getCompany = async (companyId, userId = null, local = false) => {
  if (local && userId) {
    return getLocalCompanyById(userId, companyId);
  }

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
 * @param {boolean} local - Whether to use localStorage instead of Firestore
 * @returns {Promise<string>} - The ID of the created company
 */
export const createCompany = async (userId, companyData, local = false) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Handle local storage request
    if (local) {
      const companies = getLocalCompanies(userId);
      const newCompany = {
        ...companyData,
        id: Date.now().toString(), // Generate a unique ID
        createdAt: new Date().toISOString(),
        local: true, // Mark as local company
      };

      companies.push(newCompany);
      saveLocalCompanies(userId, companies);

      // Show success notification
      store.dispatch(
        showNotification(`Company "${companyData.name}" created successfully!`)
      );

      return newCompany.id;
    }

    const companiesRef = collection(db, "users", userId, "companies");
    const docRef = await addDoc(companiesRef, {
      ...companyData,
      createdAt: serverTimestamp(),
    });

    // Show success notification
    store.dispatch(
      showNotification(`Company "${companyData.name}" created successfully!`)
    );

    return docRef.id;
  } catch (error) {
    console.error("Error creating company:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error creating company: ${error.message}`, "error")
    );

    throw error;
  }
};

/**
 * Delete a company
 * @param {string} userId - User ID
 * @param {string} companyId - Company ID to delete
 * @param {boolean} local - Whether to use localStorage instead of Firestore
 * @returns {Promise<void>}
 */
export const deleteCompany = async (userId, companyId, local = false) => {
  try {
    if (!userId || !companyId) {
      throw new Error("User ID and Company ID are required");
    }

    // Handle local storage request
    if (local) {
      const companies = getLocalCompanies(userId);
      const updatedCompanies = companies.filter((c) => c.id !== companyId);

      if (companies.length === updatedCompanies.length) {
        throw new Error("Company not found");
      }

      saveLocalCompanies(userId, updatedCompanies);

      // Show success notification
      store.dispatch(showNotification("Company deleted successfully!"));
      return;
    }

    const companyRef = doc(db, "users", userId, "companies", companyId);
    await deleteDoc(companyRef);

    // Show success notification
    store.dispatch(showNotification("Company deleted successfully!"));
  } catch (error) {
    console.error("Error deleting company:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error deleting company: ${error.message}`, "error")
    );

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
 * @param {boolean} local - Whether to use localStorage instead of Firestore
 * @returns {Promise<Object>} - Result with success status
 */
export const updateCompanyDetails = async (
  userId,
  companyId,
  companyDetails,
  local = false
) => {
  try {
    if (!userId || !companyId) {
      throw new Error("User ID and Company ID are required");
    }

    // Handle local storage request
    if (local) {
      const companies = getLocalCompanies(userId);
      const index = companies.findIndex((c) => c.id === companyId);

      if (index === -1) {
        throw new Error("Company not found");
      }

      companies[index] = {
        ...companies[index],
        ...companyDetails,
        updatedAt: new Date().toISOString(),
      };

      saveLocalCompanies(userId, companies);

      // Show success notification
      store.dispatch(showNotification("Company details updated successfully!"));

      return { success: true };
    }

    const companyRef = doc(db, "users", userId, "companies", companyId);
    await updateDoc(companyRef, companyDetails);

    // Show success notification
    store.dispatch(showNotification("Company details updated successfully!"));

    return { success: true };
  } catch (error) {
    console.error("Error saving company details:", error);

    // Show error notification
    store.dispatch(
      showNotification(
        `Error updating company details: ${error.message}`,
        "error"
      )
    );

    return { success: false, error };
  }
};

/**
 * Update company inventory and credits
 * @param {string} userId - User ID
 * @param {string} companyId - Company ID
 * @param {array} inventory - Updated inventory array
 * @param {number} credits - Updated credits amount
 * @param {boolean} local - Whether to use localStorage instead of Firestore
 * @returns {Promise<Object>} - Result with success status
 */
export const updateInventoryAndCredits = async (
  userId,
  companyId,
  inventory,
  credits,
  local = false
) => {
  try {
    if (!userId || !companyId) {
      throw new Error("User ID and Company ID are required");
    }

    // Handle local storage request
    if (local) {
      const companies = getLocalCompanies(userId);
      const index = companies.findIndex((c) => c.id === companyId);

      if (index === -1) {
        throw new Error("Company not found");
      }

      companies[index] = {
        ...companies[index],
        inventory,
        credits,
        updatedAt: new Date().toISOString(),
      };

      saveLocalCompanies(userId, companies);

      // Show success notification
      store.dispatch(
        showNotification("Inventory and credits updated successfully!")
      );

      return { success: true };
    }

    const companyRef = doc(db, "users", userId, "companies", companyId);
    await updateDoc(companyRef, {
      inventory,
      credits,
    });

    // Show success notification
    store.dispatch(
      showNotification("Inventory and credits updated successfully!")
    );

    return { success: true };
  } catch (error) {
    console.error("Error saving inventory changes:", error);

    // Show error notification
    store.dispatch(
      showNotification(`Error updating inventory: ${error.message}`, "error")
    );

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

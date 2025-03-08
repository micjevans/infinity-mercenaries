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

// Create a new company
export const createCompany = async (companyData) => {
  try {
    const companyRef = await addDoc(collection(db, "companies"), {
      ...companyData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return companyRef.id;
  } catch (error) {
    console.error("Error creating company:", error);
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

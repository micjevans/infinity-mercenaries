import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Equipment related functions
export const getEquipment = async (id = null) => {
  try {
    if (id) {
      // Get a single equipment document
      const docRef = doc(db, "equipment", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          success: true,
          data: { id: docSnap.id, ...docSnap.data() },
        };
      } else {
        return { success: true, data: null };
      }
    } else {
      // Get all equipment documents
      const querySnapshot = await getDocs(collection(db, "equipment"));
      const equipment = [];
      querySnapshot.forEach((doc) => {
        equipment.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: equipment };
    }
  } catch (error) {
    console.error("Error accessing Firestore:", error);
    return { success: false, error: "Failed to retrieve equipment" };
  }
};

// Add more direct Firestore operations here
// Example:
// export const updateEquipment = async (id, data) => {
//   try {
//     const docRef = doc(db, "equipment", id);
//     await updateDoc(docRef, data);
//     return { success: true };
//   } catch (error) {
//     console.error("Error updating equipment:", error);
//     return { success: false, error: "Failed to update equipment" };
//   }
// };

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Equipment related functions
exports.getEquipment = functions.https.onCall(async (data, context) => {
  // Implement authentication if needed
  // const uid = context.auth?.uid;

  try {
    const equipmentRef = admin.firestore().collection("equipment");
    let query = equipmentRef;

    if (data.id) {
      const doc = await equipmentRef.doc(data.id).get();
      return {
        success: true,
        data: doc.exists ? { id: doc.id, ...doc.data() } : null,
      };
    } else {
      const snapshot = await query.get();
      const equipment = [];
      snapshot.forEach((doc) => {
        equipment.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: equipment };
    }
  } catch (error) {
    console.error("Error getting equipment:", error);
    return { success: false, error: "Failed to retrieve equipment" };
  }
});

// Add more Firebase Functions here to replace your backend endpoints
// Example:
// exports.updateEquipment = functions.https.onCall(async (data, context) => {...});

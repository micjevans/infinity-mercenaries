const functions = require("firebase-functions");
const cors = require("cors");

const corsHandler = cors({ origin: true });

// ✅ Receive Firestore from index.js
module.exports = (db) => {
  return {
    // Get all companies
    getCompanies: functions.https.onRequest(async (req, res) => {
      corsHandler(req, res, async () => {
        try {
          const snapshot = await db.collection("companies").get();
          const companies = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          res.status(200).json(companies);
        } catch (error) {
          console.error("Error fetching companies:", error);
          res.status(500).send("Internal Server Error");
        }
      });
    }),

    // Add a new company
    addCompany: functions.https.onRequest(async (req, res) => {
      corsHandler(req, res, async () => {
        try {
          const { name, userId } = req.body;
          if (!name || !userId) {
            return res
              .status(400)
              .send("Missing required fields: name, userId");
          }

          const newCompany = {
            name,
            userId,
            createdAt: new Date(),
          };

          const docRef = await db.collection("companies").add(newCompany);
          res.status(201).json({ id: docRef.id, ...newCompany });
        } catch (error) {
          console.error("Error adding company:", error);
          res.status(500).send("Internal Server Error");
        }
      });
    }),
  };
};

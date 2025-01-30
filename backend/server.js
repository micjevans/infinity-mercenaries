const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
require("dotenv").config();

// Initialize Firebase Admin SDK
const serviceAccount = require("./config/firebaseServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get("/api/companies", async (req, res) => {
  try {
    const snapshot = await db.collection("companies").get();
    const companies = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

app.post("/api/companies", async (req, res) => {
  try {
    const { name, userId } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: "Name and userId are required" });
    }

    const newCompany = { name, userId };
    const docRef = await db.collection("companies").add(newCompany);
    res.status(201).json({ id: docRef.id, ...newCompany });
  } catch (error) {
    console.error("Error adding company:", error);
    res.status(500).json({ error: "Failed to add company" });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

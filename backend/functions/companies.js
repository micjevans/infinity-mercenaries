const express = require("express");

module.exports = (db) => {
  const router = express.Router({ mergeParams: true });

  // ✅ Get all companies for a specific user
  router.get("/", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).send("Missing required field: userId");
      }

      const snapshot = await db
        .collection("users")
        .doc(userId)
        .collection("companies")
        .get();

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

  // Route: Fetch Company Details
  // ✅ Get all companies for a specific user
  router.get("/:companyId", async (req, res) => {
    try {
      const { userId, companyId } = req.params;
      if (!userId) {
        return res.status(400).send("Missing required field: userId");
      }

      const companyDoc = await db
        .collection("users")
        .doc(userId)
        .collection("companies")
        .doc(companyId)
        .get();

      if (!companyDoc.exists) {
        return res.status(404).send("Company not found");
      }

      res.status(200).json(companyDoc.data());
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // ✅ Add a new company under a specific user
  router.post("/", async (req, res) => {
    try {
      const { userId } = req.params;
      const { name } = req.body;
      if (!name || !userId) {
        return res.status(400).send("Missing required fields: name, userId");
      }

      const newCompany = {
        name,
        createdAt: new Date().toISOString(),
      };

      const docRef = await db
        .collection("users")
        .doc(userId)
        .collection("companies")
        .add(newCompany);

      res.status(201).json({ id: docRef.id, ...newCompany });
    } catch (error) {
      console.error("Error adding company:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
};

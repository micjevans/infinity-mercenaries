const express = require("express");

module.exports = (db) => {
  const router = express.Router({ mergeParams: true });

  // ✅ Get troopers for a specific company
  router.get("/", async (req, res) => {
    try {
      const { userId, companyId } = req.params;
      if (!userId || !companyId) {
        return res
          .status(400)
          .send("Missing required fields: userId, companyId");
      }

      const snapshot = await db
        .collection("users")
        .doc(userId)
        .collection("companies")
        .doc(companyId)
        .collection("troopers")
        .get();

      const troopers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json(troopers);
    } catch (error) {
      console.error("Error fetching troopers:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // ✅ Add a trooper to a specific company
  router.post("/", async (req, res) => {
    try {
      const { userId, companyId } = req.params;
      const { name } = req.body;

      if (!userId || !companyId || !name) {
        return res.status(400).send("Missing required fields");
      }

      const newTrooper = {
        name,
        createdAt: new Date().toISOString(),
      };

      const docRef = await db
        .collection("users")
        .doc(userId)
        .collection("companies")
        .doc(companyId)
        .collection("troopers")
        .add(newTrooper);

      res.status(201).json({ id: docRef.id, ...newTrooper });
    } catch (error) {
      console.error("Error adding trooper:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
};

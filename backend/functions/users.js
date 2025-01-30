const express = require("express");

module.exports = (db) => {
  const router = express.Router();

  // ✅ Get all users for a specific user
  router.get("/", async (req, res) => {
    try {
      const snapshot = await db.collection("users").get();

      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Route: Fetch user Details
  // ✅ Get a specific user
  router.get("/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).send("Missing required field: userId");
      }

      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).send("User not found");
      }

      res.status(200).json(userDoc.data());
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // ✅ Add a new user with Firebase Authentication `uid`
  router.post("/", async (req, res) => {
    try {
      const { userId, name, email } = req.body; // Get userId (uid from Firebase Auth) and name

      if (!name || !userId) {
        return res
          .status(400)
          .send("Missing required fields: name, userId, email");
      }

      const userRef = db.collection("users").doc(userId); // Use uid as Firestore doc ID
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        return res.status(400).send("User already exists.");
      }

      const newUser = {
        name,
        email,
        createdAt: new Date().toISOString(),
      };

      await userRef.set(newUser); // Save user document

      res.status(201).json({ id: userId, ...newUser });
    } catch (error) {
      console.error("Error adding user:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
};

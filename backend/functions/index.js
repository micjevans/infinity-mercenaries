const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Force Firestore to use Emulator if running locally
if (process.env.FUNCTIONS_EMULATOR) {
  console.log("⚡ Connecting Firestore to emulator...");
  db.settings({ host: "localhost:8080", ssl: false });
}

// Import route handlers
const usersRoutes = require("./users")(db);
const companiesRoutes = require("./companies")(db);
const troopersRoutes = require("./troopers")(db);

// Initialize Express app
const app = express();

// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://infinity-mercenaries.web.app/",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true); // Allow request
      } else {
        callback(new Error("Not allowed by CORS")); // Deny request
      }
    },
  })
);

// Attach routes
app.use("/users", usersRoutes); // Routes related to companies
app.use("/users/:userId/companies", companiesRoutes); // Routes related to companies
app.use("/users/:userId/companies/:companyId/troopers", troopersRoutes); // Routes related to troopers

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);

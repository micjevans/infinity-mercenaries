const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ✅ Force Firestore to use Emulator if running locally
if (process.env.FUNCTIONS_EMULATOR) {
  console.log("⚡ Connecting Firestore to emulator...");
  db.settings({ host: "localhost:8080", ssl: false });
}

const companies = require("./companies")(db);
exports.getCompanies = companies.getCompanies;
exports.addCompany = companies.addCompany;

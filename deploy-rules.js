/**
 * Helper script to deploy Firestore rules and verify they're working
 * Run this with: node deploy-rules.js
 */

const { exec } = require("child_process");
const fs = require("fs");

// Display the current rules
console.log("Current Firestore rules:");
const rules = fs.readFileSync("./firestore.rules", "utf8");
console.log(rules);

// Deploy the rules
console.log("\nDeploying Firestore rules...");
exec("firebase deploy --only firestore:rules", (error, stdout, stderr) => {
  if (error) {
    console.error(`Error deploying rules: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }

  console.log(`stdout: ${stdout}`);
  console.log("\nFirestore rules deployed successfully!");
  console.log("\nNext steps:");
  console.log(" 1. Restart your Firebase emulators (if using them)");
  console.log(" 2. Make sure you're signed in to Firebase (firebase login)");
  console.log(" 3. Refresh your browser and try again");
});

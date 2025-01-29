const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables from .env

const app = express();

// Enable CORS for both local and production origins
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Local development
      "https://infinity-mercenaries.web.app", // Production
    ],
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  })
);

// Middleware to parse JSON requests
app.use(express.json());

// Example API route
app.get("/helloworld", (req, res) => {
  res.json({ message: "Hello, Mercenaries!" });
});

// Ensure server listens on the port provided by Cloud Run
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

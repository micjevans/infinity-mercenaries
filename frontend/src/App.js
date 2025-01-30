import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./auth/AuthContext"; // Use AuthContext
import { signInWithEmail, signInWithGoogle } from "./auth/auth"; // Import sign-in methods
import LandingPage from "./pages/LandingPage";
import ResourcesPage from "./pages/ResourcesPage";
import CompanyList from "./pages/CompanyList";
import NavBar from "./NavBar";
import { Modal, Box, Typography, TextField, Button } from "@mui/material";
import CompanyPage from "./pages/CompanyPage";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // Redirect unauthenticated users to the landing page
  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <CompanyList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies/:companyId"
          element={
            <ProtectedRoute>
              <CompanyPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

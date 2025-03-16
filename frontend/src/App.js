import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import LandingPage from "./pages/LandingPage";
import ResourcesPage from "./pages/ResourcesPage";
import CompanyList from "./pages/CompanyList";
import NavBar from "./components/NavBar";
import CompanyPage from "./pages/CompanyPage";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";
// Import new event pages
import EventListPage from "./pages/EventListPage";
import EventCreatePage from "./pages/EventCreatePage";
import EventDetailsPage from "./pages/EventDetailsPage";
import EventManagePage from "./pages/EventManagePage";
import PairingPage from "./pages/PairingPage";
// Add this import with your other page imports
import AdminSetup from "./pages/AdminSetup";
import GlobalNotification from "./components/GlobalNotification";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show nothing while authentication is being loaded
  if (loading) {
    return null; // Or return a loading spinner if preferred
  }

  // Redirect unauthenticated users to the landing page
  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};

// Admin-only route component
const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  // Show nothing while authentication is being loaded
  if (loading) {
    return null; // Or return a loading spinner if preferred
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

// Mod-only route component
const ModRoute = ({ children }) => {
  const { user, isMod, loading } = useAuth();

  // Show nothing while authentication is being loaded
  if (loading) {
    return null; // Or return a loading spinner if preferred
  }

  if (!user || !isMod) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <NavBar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/resources" element={<ResourcesPage />} />

          {/* Existing protected routes */}
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

          {/* New Event Routes */}
          <Route path="/events" element={<EventListPage />} />
          <Route
            path="/events/create"
            element={
              <AdminRoute>
                <EventCreatePage />
              </AdminRoute>
            }
          />
          <Route path="/events/:eventId" element={<EventDetailsPage />} />
          <Route
            path="/events/:eventId/manage"
            element={
              <ModRoute>
                <EventManagePage />
              </ModRoute>
            }
          />
          <Route
            path="/events/:eventId/rounds/:roundId/pairings/:pairingId"
            element={
              <ProtectedRoute>
                <PairingPage />
              </ProtectedRoute>
            }
          />
          {/* Add this admin setup route */}
          <Route path="/admin-setup" element={<AdminSetup />} />
        </Routes>
        <GlobalNotification />
      </Router>
    </ThemeProvider>
  );
}

export default App;

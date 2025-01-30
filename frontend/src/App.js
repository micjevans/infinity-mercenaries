import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  logOut,
  onAuthStateChange,
} from "./auth";
import CompanyList from "./pages/CompanyList";
import {
  Container,
  Typography,
  Modal,
  Box,
  TextField,
  Button,
} from "@mui/material";
import NavBar from "./NavBar";

const LandingPage = () => {
  return (
    <Container maxWidth="md" style={{ textAlign: "center", marginTop: "10vh" }}>
      <Typography variant="h2">Welcome to Mercenaries</Typography>
    </Container>
  );
};

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSignInWithEmail = async (email, password) => {
    try {
      await signInWithEmail(email, password);
      handleClose();
    } catch (error) {
      console.error("Error signing in with email:", error);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithGoogle();
      handleClose();
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logOut();
      handleMenuClose();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <Router>
      <NavBar
        user={user}
        anchorEl={anchorEl}
        handleMenuOpen={handleMenuOpen}
        handleMenuClose={handleMenuClose}
        handleLogout={handleLogout}
        handleOpen={handleOpen}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/companies" element={<CompanyList />} />
      </Routes>
      <Modal open={open} onClose={handleClose}>
        <Box
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            backgroundColor: "white",
            padding: "16px",
            boxShadow: 24,
            borderRadius: "8px",
          }}
        >
          <Typography variant="h6" style={{ marginBottom: "16px" }}>
            Sign In
          </Typography>
          <TextField
            fullWidth
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => handleSignInWithEmail(email, password)}
          >
            Sign In
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            onClick={handleSignInWithGoogle}
            style={{ marginTop: "8px" }}
          >
            Sign In with Google
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => signUpWithEmail(email, password)}
            style={{ marginTop: "8px" }}
          >
            Sign Up
          </Button>
        </Box>
      </Modal>
    </Router>
  );
}

export default App;

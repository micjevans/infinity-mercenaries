import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Menu,
  MenuItem,
  Modal,
  Box,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "./auth/auth";
import { API_BASE_URL } from "./config";
import logo from "./assets/images/M2-no-bg-short.png";

const NavBar = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, logOut } = useAuth(); // Access user and logOut from AuthContext

  // Login modal handlers
  const handleOpenLoginModal = () => setOpen(true);
  const handleCloseLoginModal = () => {
    setOpen(false);
    setIsSignUp(false);
  };

  // Navbar menu handlers
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // Login with email and password
  const handleSignInWithEmail = async () => {
    try {
      await signInWithEmail(email, password);
      handleCloseLoginModal();
    } catch (error) {
      console.error("Error signing in with email:", error);
    }
  };

  // Login with Google
  const handleSignInWithGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      // Check if user exists in Firestore
      fetch(`${API_BASE_URL}/users/${user.uid}`)
        .then((res) => res.json())
        .then((data) => handleCloseLoginModal())
        .catch((error) => {
          // If they don't then create a new user in Firestore
          fetch(`${API_BASE_URL}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.uid,
              name: user.displayName,
              email: user.email,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              handleCloseLoginModal();
              // do something later
            })
            .catch((error) => {
              logOut();
              console.error("Error creating user:", error);
            });
        });
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  // Sign up with email and password
  const handleSignUpWithEmail = async () => {
    if (password !== confirmPassword) {
      console.error("Passwords do not match");
      return;
    }
    try {
      const user = await signUpWithEmail(email, password);
      console.log(user);
      // If they don't then create a new user in Firestore
      fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          name: displayName,
          email: user.email,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          handleCloseLoginModal();
          // do something later
        })
        .catch((error) => {
          logOut();
          console.error("Error creating user:", error);
        });
    } catch (error) {
      console.error("Error signing up with email:", error);
      return;
    }
  };

  return (
    <AppBar
      position="sticky"
      style={{ background: "transparent", boxShadow: "none" }}
    >
      <Toolbar>
        <Button
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "none",
            "&:focus": {
              boxShadow: "none",
            },
          }}
          onClick={() => navigate("/")}
        >
          <img
            src={logo}
            alt="Logo"
            style={{ height: "40px", marginTop: "4px", marginBottom: "0px" }}
          />
          <Typography
            variant="subtitle2"
            style={{ fontSize: "10px", margin: "0px" }}
          >
            INFINITY
          </Typography>
          <Typography
            variant="subtitle2"
            style={{ fontSize: "10px", marginBottom: "4px" }}
          >
            MERCENARIES
          </Typography>
        </Button>
        <div style={{ flexGrow: 1 }} />
        {user ? (
          <>
            <Button color="inherit" onClick={handleMenuOpen}>
              Signed in as {user.displayName || user.email}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => navigate("/companies")}>
                Company List
              </MenuItem>
              <MenuItem onClick={logOut}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          // Sign-In Button for Guests
          <Button color="inherit" onClick={handleOpenLoginModal}>
            Sign In
          </Button>
        )}
      </Toolbar>
      {/* Login Modal */}
      <Modal open={open} onClose={handleCloseLoginModal}>
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
          {isSignUp ? (
            <>
              <Typography variant="h6" style={{ marginBottom: "16px" }}>
                Sign Up
              </Typography>
              <TextField
                fullWidth
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                margin="normal"
              />
              {!user && (
                <>
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
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    margin="normal"
                  />
                </>
              )}
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSignUpWithEmail}
                style={{ marginTop: "16px" }}
              >
                Sign Up
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => setIsSignUp(false)}
                style={{ marginTop: "8px" }}
              >
                Back to Sign In
              </Button>
            </>
          ) : (
            <>
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
                onClick={handleSignInWithEmail}
                style={{ marginBottom: "8px" }}
              >
                Sign In
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={handleSignInWithGoogle}
                style={{ marginBottom: "8px" }}
              >
                Sign In with Google
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => setIsSignUp(true)}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </AppBar>
  );
};

export default NavBar;

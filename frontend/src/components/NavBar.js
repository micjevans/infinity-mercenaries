import React, { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
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
  useTheme,
  IconButton,
  Divider,
  styled,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "../auth/auth";
import logo from "../assets/images/M2-no-bg-short.png";
import { getUser, createOrUpdateUser } from "../services/userService";

// Styled navigation button with no border and optional active underline
// Modified to remove background color change on hover
const NavButton = styled(Button)(({ theme, active }) => ({
  color: "inherit",
  borderRadius: 0,
  padding: "10px 16px",
  margin: "0 8px",
  textTransform: "none",
  fontSize: "1rem",
  border: "none",
  boxShadow: "none",
  position: "relative",
  backgroundColor: "transparent", // Always transparent background
  "&:after": {
    content: '""',
    position: "absolute",
    width: active ? "100%" : "0",
    height: "3px",
    bottom: 0,
    left: 0,
    backgroundColor: theme.palette.primary.main,
    transition: "width 0.3s ease-in-out",
  },
  "&:hover": {
    backgroundColor: "transparent", // Keep transparent on hover
    "&:after": {
      width: "100%", // Still show the underline on hover
    },
  },
  "&:focus": {
    boxShadow: "none",
    backgroundColor: "transparent", // Also keep transparent on focus
  },
}));

// Styled user account icon button with larger size
const UserIconButton = styled(IconButton)(({ theme }) => ({
  color: "inherit",
  padding: "12px",
  "& .MuiSvgIcon-root": {
    fontSize: "2rem",
  },
}));

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, logOut, isAdmin } = useAuth();
  const theme = useTheme();

  // Determine if a path is active
  const isActivePath = (path) => {
    // For root path, only match exact
    if (path === "/" && location.pathname !== "/") return false;

    // For other paths, check if current path starts with this path
    return (
      location.pathname === path ||
      (path !== "/" && location.pathname.startsWith(path))
    );
  };

  // Login modal handlers
  const handleOpenLoginModal = () => setOpen(true);
  const handleCloseLoginModal = () => {
    setOpen(false);
    setIsSignUp(false);
  };

  // Navbar menu handlers
  const handleMenuOpen = (event) => {
    if (event && event.currentTarget) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
      try {
        const existingUser = await getUser(user.uid);

        if (!existingUser) {
          // If user doesn't exist, create a new user in Firestore
          const result = await createOrUpdateUser(user.uid, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL || "",
            createdAt: new Date(),
          });

          if (!result.success) {
            console.error("Error creating user:", result.error);
            await logOut();
            return;
          }
        }

        handleCloseLoginModal();
      } catch (error) {
        console.error("Error checking/creating user:", error);
        await logOut();
      }
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

      // Create a new user in Firestore
      try {
        const result = await createOrUpdateUser(user.uid, {
          displayName: displayName,
          email: user.email,
          createdAt: new Date(),
        });

        if (result.success) {
          handleCloseLoginModal();
        } else {
          console.error("Error creating user:", result.error);
          await logOut();
        }
      } catch (error) {
        console.error("Error creating user:", error);
        await logOut();
      }
    } catch (error) {
      console.error("Error signing up with email:", error);
    }
  };

  return (
    <AppBar
      position="sticky"
      style={{ background: "transparent", boxShadow: "none" }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box display="flex" alignItems="center">
          <Button
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: "none",
              mr: 3,
              "&:focus": {
                boxShadow: "none",
              },
            }}
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

          {/* Navigation buttons */}
          <Box sx={{ display: "flex" }}>
            <NavButton
              active={isActivePath("/resources")}
              onClick={() => navigate("/resources")}
            >
              Resources
            </NavButton>
            <NavButton
              active={isActivePath("/events")}
              onClick={() => navigate("/events")}
            >
              Events
            </NavButton>
            {user && (
              <NavButton
                active={isActivePath("/companies")}
                onClick={() => navigate("/companies")}
              >
                Companies
              </NavButton>
            )}
          </Box>
        </Box>

        {/* User authentication */}
        {user ? (
          <>
            <UserIconButton onClick={handleMenuOpen}>
              <AccountCircleIcon />
            </UserIconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem disabled>
                <Typography
                  noWrap
                  variant="body2"
                  sx={{
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.displayName || user.email}
                </Typography>
              </MenuItem>
              <Divider />
              {isAdmin && (
                <MenuItem
                  onClick={() => {
                    navigate("/events/create");
                    handleMenuClose();
                  }}
                >
                  Create Event
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  navigate("/companies");
                  handleMenuClose();
                }}
              >
                Company List
              </MenuItem>
              <MenuItem
                onClick={() => {
                  logOut();
                  handleMenuClose();
                }}
              >
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          // Sign-In Button for Guests
          <Button
            color="inherit"
            onClick={handleOpenLoginModal}
            variant="outlined"
            sx={{
              borderColor: "rgba(255,255,255,0.3)",
              "&:hover": {
                borderColor: "primary.main",
                backgroundColor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            Sign In
          </Button>
        )}
      </Toolbar>

      {/* Login Modal */}
      <Modal open={open} onClose={handleCloseLoginModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            backgroundColor: theme.palette.grey[900], // use the primary dark grey background
            p: 2,
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

import React from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Menu,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const NavBar = ({
  user,
  anchorEl,
  handleMenuOpen,
  handleMenuClose,
  handleLogout,
  handleOpen,
}) => {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          style={{ flexGrow: 1, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          Infinity Mercenaries
        </Typography>
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
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          <Button color="inherit" onClick={handleOpen}>
            Sign In
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;

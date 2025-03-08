import React, { useState } from "react";
import {
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  Box,
  Alert,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { setUserRole } from "../services/userService";

const AdminSetup = () => {
  const { user } = useAuth();
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const makeAdmin = async (id) => {
    try {
      const targetId = id || user?.uid;
      if (!targetId) {
        setError("No user ID provided");
        return;
      }

      const result = await setUserRole(targetId, "admin", true);

      if (result.success) {
        setMessage(
          `Successfully made user ${targetId} an admin. Please log out and log back in.`
        );
        setError("");
      } else {
        setError(
          "Failed to set admin role: " +
            (result.error?.message || "Unknown error")
        );
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Setup
        </Typography>

        {user && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6">Make yourself an admin</Typography>
            <Typography variant="body1" paragraph>
              Your user ID: {user.uid}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => makeAdmin(user.uid)}
            >
              Make Me Admin
            </Button>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Make another user an admin</Typography>
          <TextField
            fullWidth
            label="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            margin="normal"
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={() => makeAdmin(userId)}
            disabled={!userId}
            sx={{ mt: 2 }}
          >
            Make Admin
          </Button>
        </Box>

        {message && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" sx={{ mt: 4 }}>
          Note: After becoming an admin, please log out and log back in for
          changes to take effect.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AdminSetup;

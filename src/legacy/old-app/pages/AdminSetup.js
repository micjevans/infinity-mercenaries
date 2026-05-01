import React, { useState } from "react";
import {
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  Box,
  Alert,
  Divider,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { setUserRole } from "../services/userService";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

const AdminSetup = () => {
  const { user } = useAuth();
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");

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

  // Add this function to repair events missing organizers
  const fixEventsOrganizers = async () => {
    try {
      setUpdateMessage("Updating events...");

      // Get all events
      const eventsSnapshot = await getDocs(collection(db, "events"));
      let updatedCount = 0;

      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();

        // If the event doesn't have organizers array or it's empty
        if (
          !eventData.organizers ||
          !Array.isArray(eventData.organizers) ||
          eventData.organizers.length === 0
        ) {
          // Set the current user as organizer (or use a default admin ID)
          await updateDoc(doc(db, "events", eventDoc.id), {
            organizers: [user.uid],
          });
          updatedCount++;
        }
      }

      setUpdateMessage(`Successfully updated ${updatedCount} events!`);
    } catch (error) {
      console.error("Error updating events:", error);
      setUpdateMessage(`Error updating events: ${error.message}`);
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

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" gutterBottom>
          Event Repair Tools
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" paragraph>
            Fix events missing organizers. This will set you as the organizer
            for any events that don't have organizers.
          </Typography>
          <Button
            variant="contained"
            color="warning"
            onClick={fixEventsOrganizers}
            sx={{ mt: 1 }}
          >
            Repair Events Organizers
          </Button>

          {updateMessage && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {updateMessage}
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminSetup;

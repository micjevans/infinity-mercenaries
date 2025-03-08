import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import { createEvent } from "../services/eventService";
import { useAuth } from "../auth/AuthContext";

const EventCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get the current user
  const [eventData, setEventData] = useState({
    name: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    maxParticipants: 0,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format dates properly for Firestore
      const formattedData = {
        ...eventData,
        maxParticipants: parseInt(eventData.maxParticipants, 10) || 0,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
      };

      // Pass the creator's userId to createEvent
      const eventId = await createEvent(formattedData, user.uid);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/events/${eventId}`);
      }, 1500);
    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to create event. Please try again.");
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Event
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="name"
                name="name"
                label="Event Name"
                value={eventData.name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="description"
                name="description"
                label="Description"
                multiline
                rows={4}
                value={eventData.description}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="location"
                name="location"
                label="Location"
                value={eventData.location}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="startDate"
                name="startDate"
                label="Start Date"
                type="date"
                value={eventData.startDate}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="endDate"
                name="endDate"
                label="End Date"
                type="date"
                value={eventData.endDate}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: eventData.startDate,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="maxParticipants"
                name="maxParticipants"
                label="Maximum Participants"
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                value={eventData.maxParticipants}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              type="button"
              onClick={() => navigate("/events")}
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Create Event
            </Button>
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
      >
        <Alert onClose={() => setSuccess(false)} severity="success">
          Event created successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EventCreatePage;

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  getEvent,
  signupForEvent,
  isEventOrganizer,
} from "../services/eventService";
import { useAuth } from "../auth/AuthContext";
import { getUserCompanies } from "../services/companyService";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import PersonIcon from "@mui/icons-material/Person";

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const { user, isAdmin, isMod } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signupOpen, setSignupOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadEventAndCompanies = async () => {
      try {
        const eventData = await getEvent(eventId);
        setEvent(eventData);

        // Debug logging
        console.log("Event data:", eventData);
        console.log("User ID:", user?.uid);
        console.log("isAdmin:", isAdmin);
        console.log("isMod:", isMod);

        // Check if user is registered
        if (user && eventData.participants) {
          const registered = eventData.participants.some(
            (p) => p.userId === user.uid
          );
          setIsUserRegistered(registered);
        }

        // Check if user is an organizer
        if (user && eventData) {
          const organizer = isEventOrganizer(eventData, user.uid);
          console.log("Is user an organizer?", organizer);
          console.log("Organizers array:", eventData.organizers);
          setIsOrganizer(organizer);
        }

        if (user) {
          try {
            console.log("Loading companies for user:", user.uid);
            const userCompanies = await getUserCompanies(user.uid);
            console.log("User companies loaded:", userCompanies);

            if (userCompanies.length === 0) {
              console.warn("No companies found for this user");
            }

            setCompanies(userCompanies);
          } catch (companyError) {
            console.error("Error loading user companies:", companyError);
          }
        }
      } catch (error) {
        console.error("Error loading event details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEventAndCompanies();
  }, [eventId, user]);

  const handleSignupOpen = async () => {
    if (companies.length === 0 && user) {
      // If companies weren't loaded yet, try loading them again
      try {
        const userCompanies = await getUserCompanies(user.uid);
        setCompanies(userCompanies);
      } catch (error) {
        console.error("Error loading companies when opening dialog:", error);
      }
    }
    setSignupOpen(true);
  };

  const handleSignupClose = () => setSignupOpen(false);

  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
  };

  const handleEventSignup = async () => {
    try {
      await signupForEvent(eventId, user.uid, selectedCompany);
      setIsUserRegistered(true);
      handleSignupClose();

      // Refresh event data to show updated participants
      const updatedEvent = await getEvent(eventId);
      setEvent(updatedEvent);
    } catch (error) {
      console.error("Error signing up for event:", error);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!event) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5">Event not found</Typography>
      </Container>
    );
  }

  const registeredCompany =
    user && event.participants?.find((p) => p.userId === user.uid)?.companyId;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4" component="h1">
            {event.name}
          </Typography>
          {/* Show manage button only for admins, mods, or organizers */}
          {(isAdmin || isMod || isOrganizer) && (
            <Button
              component={Link}
              to={`/events/${eventId}/manage`}
              variant="contained"
              color="primary"
              startIcon={
                isAdmin ? (
                  <AdminPanelSettingsIcon />
                ) : isMod ? (
                  <SupervisorAccountIcon />
                ) : (
                  <PersonIcon />
                )
              }
            >
              Manage Event
              {isAdmin ? " (Admin)" : isMod ? " (Mod)" : " (Organizer)"}
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {event.description}
            </Typography>

            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    <strong>Location:</strong> {event.location}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    <strong>Start Date:</strong>{" "}
                    {new Date(
                      event.startDate?.seconds * 1000
                    ).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    <strong>End Date:</strong>{" "}
                    {new Date(
                      event.endDate?.seconds * 1000
                    ).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">
                    <strong>Participants:</strong>{" "}
                    {event.participants?.length || 0} /{" "}
                    {event.maxParticipants || "Unlimited"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Participation Status
                </Typography>

                {isUserRegistered ? (
                  <Box>
                    <Chip color="success" label="Registered" sx={{ mb: 2 }} />
                    {registeredCompany && (
                      <Typography variant="body2">
                        You're registered with company:{" "}
                        {companies.find((c) => c.id === registeredCompany)
                          ?.name || "Loading..."}
                      </Typography>
                    )}
                  </Box>
                ) : user ? (
                  <Box>
                    <Typography variant="body2" paragraph>
                      You're not registered for this event yet.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSignupOpen}
                      disabled={
                        event.participants?.length >= event.maxParticipants
                      }
                      fullWidth
                    >
                      Sign Up
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2">
                    Please sign in to register for this event.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Signup Dialog */}
      <Dialog open={signupOpen} onClose={handleSignupClose}>
        <DialogTitle>Sign Up for {event.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph sx={{ mt: 1 }}>
            Choose which company you'd like to register with:
          </Typography>

          {companies.length === 0 ? (
            <>
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                You don't have any companies yet. Please create a company first.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={() => {
                  handleSignupClose();
                  navigate("/companies");
                }}
              >
                Create Company
              </Button>
            </>
          ) : (
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Select Company</InputLabel>
              <Select
                value={selectedCompany}
                onChange={handleCompanyChange}
                label="Select Company"
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSignupClose}>Cancel</Button>
          {companies.length > 0 && (
            <Button
              onClick={handleEventSignup}
              variant="contained"
              color="primary"
              disabled={!selectedCompany}
            >
              Sign Up
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventDetailsPage;

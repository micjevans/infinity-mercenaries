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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  TextField,
  Stack,
} from "@mui/material";
// Replace date-fns adapter with Day.js adapter
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs"; // Import dayjs
import {
  getEvent,
  signupForEvent,
  isEventOrganizer,
  updateEvent,
  createRound,
  completeRound,
  updateRoundDates,
} from "../services/eventService";
import { useAuth } from "../auth/AuthContext";
import { getUserCompanies } from "../services/companyService";
import { createCompany } from "../services/companyService"; // Add this import
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GroupIcon from "@mui/icons-material/Group";
import EventIcon from "@mui/icons-material/Event";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";

// Add this helper function above the component
const getRoundStatus = (round) => {
  const now = new Date();

  // Check for end date to determine if complete
  if (round.endDate && round.endDate.seconds) {
    const endDate = new Date(round.endDate.seconds * 1000);
    if (now > endDate) {
      return {
        label: "Complete",
        color: "success",
        icon: <CheckCircleIcon />,
      };
    }
  }

  // Check for start date to determine if started
  if (round.startDate && round.startDate.seconds) {
    const startDate = new Date(round.startDate.seconds * 1000);
    if (now < startDate) {
      return {
        label: "Not Started",
        color: "info",
        icon: <PendingIcon />,
      };
    }
  }

  // Default: round has started but not ended
  return {
    label: "In Progress",
    color: "warning",
    icon: <PendingIcon />,
  };
};

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const { user, isAdmin, isMod } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signupOpen, setSignupOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  console.log(event);
  // New state for edit mode
  const [editMode, setEditMode] = useState(false);
  const [editedEvent, setEditedEvent] = useState({});

  // State for create round dialog - enhanced with dates
  const [roundDialogOpen, setRoundDialogOpen] = useState(false);
  const [newRoundName, setNewRoundName] = useState("");
  const [roundStartDate, setRoundStartDate] = useState(null);
  const [roundEndDate, setRoundEndDate] = useState(null);

  // Add state for new company name
  const [newCompanyName, setNewCompanyName] = useState("");

  // Check if user can manage the event
  const canManageEvent = isAdmin || isMod || isOrganizer;

  useEffect(() => {
    const loadEventAndCompanies = async () => {
      try {
        const eventData = await getEvent(eventId);
        setEvent(eventData);

        // Initialize edited event data for form - updated to use dayjs
        setEditedEvent({
          name: eventData.name || "",
          description: eventData.description || "",
          location: eventData.location || "",
          startDate: eventData.startDate
            ? dayjs.unix(eventData.startDate.seconds)
            : null,
          endDate: eventData.endDate
            ? dayjs.unix(eventData.endDate.seconds)
            : null,
          maxParticipants: eventData.maxParticipants || "",
        });

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
          setIsOrganizer(organizer);
        }

        if (user) {
          try {
            const userCompanies = await getUserCompanies(user.uid);
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

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Event edit handlers
  const handleToggleEditMode = () => {
    setEditMode(!editMode);

    // Reset form to original values when canceling
    if (editMode) {
      setEditedEvent({
        name: event.name || "",
        description: event.description || "",
        location: event.location || "",
        startDate: event.startDate ? dayjs.unix(event.startDate.seconds) : null,
        endDate: event.endDate ? dayjs.unix(event.endDate.seconds) : null,
        maxParticipants: event.maxParticipants || "",
      });
    }
  };

  const handleEventFieldChange = (field, value) => {
    setEditedEvent({
      ...editedEvent,
      [field]: value,
    });
  };

  const handleSaveEventChanges = async () => {
    try {
      // Convert dates back to Firebase timestamp format
      const updatedEvent = {
        ...editedEvent,
        // Only include these if they exist to avoid errors
        ...(editedEvent.startDate && {
          startDate: {
            seconds: editedEvent.startDate.unix(),
            nanoseconds: 0,
          },
        }),
        ...(editedEvent.endDate && {
          endDate: {
            seconds: editedEvent.endDate.unix(),
            nanoseconds: 0,
          },
        }),
        maxParticipants: Number(editedEvent.maxParticipants) || null,
      };

      await updateEvent(eventId, updatedEvent);

      // Refresh event data
      const refreshedEvent = await getEvent(eventId);
      setEvent(refreshedEvent);

      // Exit edit mode
      setEditMode(false);
    } catch (error) {
      console.error("Error saving event changes:", error);
    }
  };

  // Round creation handlers
  const handleOpenRoundDialog = () => {
    // Autopopulate name based on existing rounds count
    const nextRoundNumber = (event.rounds?.length || 0) + 1;
    setNewRoundName(`Round ${nextRoundNumber}`);

    // Default dates:
    // - start = current time (now)
    // - end = one week from now at end of day (23:59:59)
    const now = dayjs();
    const oneWeekLater = dayjs().add(7, "day").hour(23).minute(59).second(59);

    setRoundStartDate(now);
    setRoundEndDate(oneWeekLater);

    setRoundDialogOpen(true);
  };

  const handleCloseRoundDialog = () => {
    setRoundDialogOpen(false);
  };

  const handleCreateRound = async () => {
    try {
      if (!newRoundName.trim()) return;

      await createRound(eventId, {
        name: newRoundName,
        number: (event.rounds?.length || 0) + 1,
        // Add dates in Firebase timestamp format
        startDate: roundStartDate
          ? {
              seconds: roundStartDate.unix(),
              nanoseconds: 0,
            }
          : null,
        endDate: roundEndDate
          ? {
              seconds: roundEndDate.unix(),
              nanoseconds: 0,
            }
          : null,
      });

      // Close dialog and refresh event data
      handleCloseRoundDialog();
      const refreshedEvent = await getEvent(eventId);
      setEvent(refreshedEvent);
    } catch (error) {
      console.error("Error creating round:", error);
    }
  };

  // Toggle round completion status
  const handleToggleRoundCompletion = async (roundId, currentStatus) => {
    try {
      await completeRound(eventId, roundId, !currentStatus);

      // Refresh event data
      const refreshedEvent = await getEvent(eventId);
      setEvent(refreshedEvent);
    } catch (error) {
      console.error("Error toggling round completion status:", error);
    }
  };

  // Add these new functions for starting and ending rounds
  const handleStartRound = async (roundId) => {
    try {
      const now = dayjs();

      await updateRoundDates(eventId, roundId, {
        startDate: {
          seconds: now.unix(),
          nanoseconds: 0,
        },
      });

      // Refresh event data
      const refreshedEvent = await getEvent(eventId);
      setEvent(refreshedEvent);
    } catch (error) {
      console.error("Error starting round:", error);
    }
  };

  const handleEndRound = async (roundId) => {
    try {
      const now = dayjs();

      await updateRoundDates(eventId, roundId, {
        endDate: {
          seconds: now.unix(),
          nanoseconds: 0,
        },
      });

      // Refresh event data
      const refreshedEvent = await getEvent(eventId);
      setEvent(refreshedEvent);
    } catch (error) {
      console.error("Error ending round:", error);
    }
  };

  // Existing code for signup dialog and related functions
  const handleSignupOpen = () => {
    setNewCompanyName(""); // Reset company name field
    setSignupOpen(true);
  };

  const handleSignupClose = () => setSignupOpen(false);

  // Replace handleCompanyChange with handleCompanyNameChange
  const handleCompanyNameChange = (e) => {
    setNewCompanyName(e.target.value);
  };

  // Update handleEventSignup to create a company first
  const handleEventSignup = async () => {
    try {
      if (!newCompanyName.trim() || !user) return;

      // Create new company data
      const newCompanyData = {
        name: newCompanyName,
        sectorial1: null,
        sectorial2: null,
        credits: 0, // Starting credits
        swc: 0,
        sponsor: "",
        notoriety: 0,
        description: `Company created for ${event.name}`,
        eventSpecific: true, // Flag to identify event-specific companies
      };

      // Create the company in database
      const companyId = await createCompany(user.uid, newCompanyData, false); // false = database company

      // Now sign up for the event with the new company
      await signupForEvent(eventId, user.uid, companyId);

      setIsUserRegistered(true);
      handleSignupClose();

      // Refresh event data to show updated participants
      const updatedEvent = await getEvent(eventId);
      setEvent(updatedEvent);
    } catch (error) {
      console.error("Error signing up for event:", error);
    }
  };

  const handleRoundClick = (roundId) => {
    navigate(`/events/${eventId}/rounds/${roundId}`);
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Top Section with Event Info and Signup Status */}
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        {/* Header with Back Button and Title/Edit Button */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box display="flex" alignItems="center">
            <Tooltip title="Back to Events">
              <IconButton
                onClick={() => navigate("/events")}
                color="primary"
                sx={{ mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            {editMode ? (
              <TextField
                value={editedEvent.name}
                onChange={(e) => handleEventFieldChange("name", e.target.value)}
                variant="outlined"
                fullWidth
                sx={{ maxWidth: 400 }}
              />
            ) : (
              <Typography variant="h4" component="h1">
                {event.name}
              </Typography>
            )}
          </Box>

          {canManageEvent && (
            <Box>
              {editMode ? (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={handleToggleEditMode}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveEventChanges}
                  >
                    Save
                  </Button>
                </Stack>
              ) : (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={handleToggleEditMode}
                >
                  Edit Event
                </Button>
              )}
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={4}>
          {/* Left Column with Description */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            {editMode ? (
              <TextField
                value={editedEvent.description}
                onChange={(e) =>
                  handleEventFieldChange("description", e.target.value)
                }
                variant="outlined"
                fullWidth
                multiline
                rows={4}
                sx={{ mb: 3 }}
              />
            ) : (
              <Typography variant="body1" paragraph>
                {event.description || "No description provided."}
              </Typography>
            )}

            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Location
                  </Typography>
                  {editMode ? (
                    <TextField
                      value={editedEvent.location}
                      onChange={(e) =>
                        handleEventFieldChange("location", e.target.value)
                      }
                      variant="outlined"
                      fullWidth
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1">
                      {event.location || "TBD"}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Max Participants
                  </Typography>
                  {editMode ? (
                    <TextField
                      value={editedEvent.maxParticipants}
                      onChange={(e) =>
                        handleEventFieldChange(
                          "maxParticipants",
                          e.target.value
                        )
                      }
                      variant="outlined"
                      fullWidth
                      size="small"
                      type="number"
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  ) : (
                    <Typography variant="body1">
                      {event.maxParticipants || "Unlimited"}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Start Date
                  </Typography>
                  {editMode ? (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DateTimePicker
                        value={editedEvent.startDate}
                        onChange={(value) =>
                          handleEventFieldChange("startDate", value)
                        }
                        renderInput={(params) => (
                          <TextField size="small" fullWidth {...params} />
                        )}
                      />
                    </LocalizationProvider>
                  ) : (
                    <Typography variant="body1">
                      {event.startDate
                        ? new Date(
                            event.startDate.seconds * 1000
                          ).toLocaleDateString()
                        : "TBD"}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    End Date
                  </Typography>
                  {editMode ? (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DateTimePicker
                        value={editedEvent.endDate}
                        onChange={(value) =>
                          handleEventFieldChange("endDate", value)
                        }
                        renderInput={(params) => (
                          <TextField size="small" fullWidth {...params} />
                        )}
                      />
                    </LocalizationProvider>
                  ) : (
                    <Typography variant="body1">
                      {event.endDate
                        ? new Date(
                            event.endDate.seconds * 1000
                          ).toLocaleDateString()
                        : "TBD"}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body1">
                    <strong>Participants:</strong>{" "}
                    {event.participants?.length || 0} /{" "}
                    {event.maxParticipants || "Unlimited"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Right Column with Signup Status */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Participation Status
                </Typography>

                {isUserRegistered ? (
                  <Box>
                    <Chip color="success" label="Registered" sx={{ mb: 2 }} />
                    {event.detailedParticipants?.find(
                      (p) => p.userId === user?.uid
                    )?.companyId && (
                      <Typography variant="body2">
                        You're registered with company:{" "}
                        {event.detailedParticipants.find(
                          (p) => p.userId === user.uid
                        )?.companyDetails?.name || "Unknown Company"}
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

      {/* Tabs for Participants and Rounds */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="event details tabs"
        >
          <Tab icon={<GroupIcon />} label="Participants" id="tab-0" />
          <Tab icon={<EventIcon />} label="Rounds" id="tab-1" />
        </Tabs>
      </Box>

      {/* Tab Content for Participants */}
      {activeTab === 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Registered Participants
          </Typography>
          {event.detailedParticipants &&
          event.detailedParticipants.length > 0 ? (
            <List>
              {event.detailedParticipants.map((participant, index) => (
                <ListItem
                  key={index}
                  divider={index < event.detailedParticipants.length - 1}
                >
                  <ListItemAvatar>
                    <Avatar src={participant.userDetails?.photoURL}>
                      {participant.userDetails?.displayName?.charAt(0) || "?"}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      participant.userDetails?.displayName || "Unknown User"
                    }
                    secondary={`Company: ${
                      participant.companyDetails?.name || "Unknown Company"
                    }`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography
              variant="body1"
              color="textSecondary"
              sx={{ textAlign: "center", py: 3 }}
            >
              No participants have registered yet.
            </Typography>
          )}
        </Paper>
      )}

      {/* Tab Content for Rounds */}
      {activeTab === 1 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Event Rounds
            </Typography>
            {canManageEvent && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenRoundDialog}
              >
                Create Round
              </Button>
            )}
          </Box>

          {event.rounds && event.rounds.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Round Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Pairings</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {event.rounds.map((round) => (
                    <TableRow key={round.id} hover>
                      <TableCell component="th" scope="row">
                        {round.name || `Round ${round.number || ""}`}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const status = getRoundStatus(round);
                          return (
                            <Chip
                              icon={status.icon}
                              label={status.label}
                              color={status.color}
                              size="small"
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {round.pairings?.length || 0} pairings
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{ display: "flex", justifyContent: "flex-end" }}
                        >
                          {canManageEvent && (
                            <>
                              <Tooltip title="Start Round">
                                <IconButton
                                  onClick={() => handleStartRound(round.id)}
                                  color="primary"
                                  size="small"
                                  sx={{ mr: 1 }}
                                >
                                  <PlayArrowIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="End Round">
                                <IconButton
                                  onClick={() => handleEndRound(round.id)}
                                  color="error"
                                  size="small"
                                  sx={{ mr: 1 }}
                                >
                                  <StopIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="View Round Details">
                            <IconButton
                              onClick={() => handleRoundClick(round.id)}
                              size="small"
                              color="primary"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography
              variant="body1"
              color="textSecondary"
              sx={{ textAlign: "center", py: 3 }}
            >
              No rounds have been created for this event yet.
              {canManageEvent && (
                <Box mt={2}>
                  <Button
                    variant="outlined"
                    onClick={handleOpenRoundDialog}
                    startIcon={<AddIcon />}
                  >
                    Create First Round
                  </Button>
                </Box>
              )}
            </Typography>
          )}
        </Paper>
      )}

      {/* Signup Dialog - Updated to create a new company instead of selecting */}
      <Dialog open={signupOpen} onClose={handleSignupClose}>
        <DialogTitle>Sign Up for {event.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph sx={{ mt: 1 }}>
            Create a new company to participate in this event:
          </Typography>

          <TextField
            label="Company Name"
            value={newCompanyName}
            onChange={handleCompanyNameChange}
            fullWidth
            margin="normal"
            variant="outlined"
            helperText="This will create a new company specifically for this event"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSignupClose}>Cancel</Button>
          <Button
            onClick={handleEventSignup}
            variant="contained"
            color="primary"
            disabled={!newCompanyName.trim()}
          >
            Create Company & Sign Up
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Round Dialog - Updated with date fields */}
      <Dialog open={roundDialogOpen} onClose={handleCloseRoundDialog}>
        <DialogTitle>Create New Round</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="round-name"
            label="Round Name"
            fullWidth
            value={newRoundName}
            onChange={(e) => setNewRoundName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <DateTimePicker
                label="Start Date & Time"
                value={roundStartDate}
                onChange={(value) => setRoundStartDate(value)}
                renderInput={(params) => <TextField {...params} />}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DateTimePicker
                label="End Date & Time"
                value={roundEndDate}
                onChange={(value) => setRoundEndDate(value)}
                renderInput={(params) => <TextField {...params} />}
                slotProps={{ textField: { fullWidth: true } }}
                minDateTime={roundStartDate}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoundDialog}>Cancel</Button>
          <Button
            onClick={handleCreateRound}
            color="primary"
            disabled={!newRoundName.trim() || !roundStartDate}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventDetailsPage;

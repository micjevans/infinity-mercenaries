import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Chip,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import {
  getEvent,
  updateRoundDates,
  createPairing,
  isEventOrganizer,
} from "../services/eventService";
import { useAuth } from "../auth/AuthContext";

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

const RoundDetailsPage = () => {
  const { eventId, roundId } = useParams();
  const { user, isAdmin, isMod } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [round, setRound] = useState(null);
  const [isOrganizer, setIsOrganizer] = useState(false);

  // New state for dialogs and form fields
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pairingDialogOpen, setPairingDialogOpen] = useState(false);
  const [editedRound, setEditedRound] = useState({
    startDate: null,
    endDate: null,
    mission: "",
    description: "",
  });
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [mission, setMission] = useState("");

  // Check if user can manage the event/round
  const canManage = isAdmin || isMod || isOrganizer;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get event data which includes rounds
        const eventData = await getEvent(eventId);
        setEvent(eventData);

        // Find the specific round
        const roundData = eventData?.rounds?.find((r) => r.id === roundId);
        if (roundData) {
          setRound(roundData);

          // Initialize edit form with current values
          setEditedRound({
            startDate: roundData.startDate
              ? dayjs.unix(roundData.startDate.seconds)
              : null,
            endDate: roundData.endDate
              ? dayjs.unix(roundData.endDate.seconds)
              : null,
            mission: roundData.mission || "",
            description: roundData.description || "",
          });
        }

        // Check if user is an organizer
        if (user && eventData) {
          const userIsOrganizer = isEventOrganizer(eventData, user.uid);
          setIsOrganizer(userIsOrganizer);
        }
      } catch (error) {
        console.error("Error loading round data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [eventId, roundId, user, isAdmin, isMod]);

  // Handle viewing a specific pairing
  const handleViewPairing = (pairingId) => {
    navigate(`/events/${eventId}/rounds/${roundId}/pairings/${pairingId}`);
  };

  // Handle opening edit dialog
  const handleOpenEditDialog = () => {
    setEditDialogOpen(true);
  };

  // Handle closing edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };

  // Handle saving round updates
  const handleSaveRoundChanges = async () => {
    try {
      // Update dates
      await updateRoundDates(eventId, roundId, {
        startDate: editedRound.startDate
          ? {
              seconds: editedRound.startDate.unix(),
              nanoseconds: 0,
            }
          : null,
        endDate: editedRound.endDate
          ? {
              seconds: editedRound.endDate.unix(),
              nanoseconds: 0,
            }
          : null,
        mission: editedRound.mission,
        description: editedRound.description,
      });

      // Refresh data
      const updatedEvent = await getEvent(eventId);
      setEvent(updatedEvent);
      const updatedRound = updatedEvent?.rounds?.find((r) => r.id === roundId);
      if (updatedRound) setRound(updatedRound);

      // Close dialog
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating round:", error);
    }
  };

  // Add functions for starting/ending the round
  const handleStartRound = async () => {
    try {
      const now = dayjs();
      await updateRoundDates(eventId, roundId, {
        startDate: {
          seconds: now.unix(),
          nanoseconds: 0,
        },
      });

      // Refresh data
      const updatedEvent = await getEvent(eventId);
      setEvent(updatedEvent);
      const updatedRound = updatedEvent?.rounds?.find((r) => r.id === roundId);
      if (updatedRound) setRound(updatedRound);
    } catch (error) {
      console.error("Error starting round:", error);
    }
  };

  const handleEndRound = async () => {
    try {
      const now = dayjs();
      await updateRoundDates(eventId, roundId, {
        endDate: {
          seconds: now.unix(),
          nanoseconds: 0,
        },
      });

      // Refresh data
      const updatedEvent = await getEvent(eventId);
      setEvent(updatedEvent);
      const updatedRound = updatedEvent?.rounds?.find((r) => r.id === roundId);
      if (updatedRound) setRound(updatedRound);
    } catch (error) {
      console.error("Error ending round:", error);
    }
  };

  // Handle pairing creation
  const handleOpenPairingDialog = () => {
    setPlayer1("");
    setPlayer2("");
    setMission("");
    setPairingDialogOpen(true);
  };

  const handleClosePairingDialog = () => {
    setPairingDialogOpen(false);
  };

  const handleCreatePairing = async () => {
    try {
      if (!player1 || !player2 || player1 === player2) return;

      await createPairing(eventId, roundId, {
        player1Id: player1,
        player2Id: player2,
        mission: mission || undefined,
      });

      // Refresh data
      const updatedEvent = await getEvent(eventId);
      setEvent(updatedEvent);
      const updatedRound = updatedEvent?.rounds?.find((r) => r.id === roundId);
      if (updatedRound) setRound(updatedRound);

      // Close dialog
      handleClosePairingDialog();
    } catch (error) {
      console.error("Error creating pairing:", error);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!event || !round) {
    return (
      <Container sx={{ mt: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton
            component={Link}
            to={`/events/${eventId}`}
            color="primary"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">Round not found</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header with Back Button and Title */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box display="flex" alignItems="center">
          <IconButton
            component={Link}
            to={`/events/${eventId}`}
            color="primary"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <div>
            <Typography variant="h4" component="h1">
              {round.name || `Round ${round.number || ""}`}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {event.name}
            </Typography>
          </div>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {(() => {
            const status = getRoundStatus(round);
            return (
              <Chip
                icon={status.icon}
                label={status.label}
                color={status.color}
              />
            );
          })()}

          {/* Add edit button for mods/organizers */}
          {canManage && (
            <Tooltip title="Edit Round Details">
              <IconButton
                color="primary"
                onClick={handleOpenEditDialog}
                sx={{ ml: 1 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Round Information */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Round Details
            </Typography>
            <Typography variant="body1">
              <strong>Created:</strong>{" "}
              {round.createdAt
                ? new Date(round.createdAt.seconds * 1000).toLocaleString()
                : "N/A"}
            </Typography>
            <Typography variant="body1">
              <strong>Start Date:</strong>{" "}
              {round.startDate
                ? new Date(round.startDate.seconds * 1000).toLocaleString()
                : "N/A"}
            </Typography>
            <Typography variant="body1">
              <strong>End Date:</strong>{" "}
              {round.endDate
                ? new Date(round.endDate.seconds * 1000).toLocaleString()
                : "N/A"}
            </Typography>

            {/* Add mission display */}
            {round.mission && (
              <Box mt={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Mission
                </Typography>
                <Typography variant="body1">{round.mission}</Typography>
              </Box>
            )}

            {round.description && (
              <Box mt={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Description
                </Typography>
                <Typography variant="body1">{round.description}</Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Stats
            </Typography>
            <Typography variant="body1">
              <strong>Total Pairings:</strong> {round.pairings?.length || 0}
            </Typography>
            <Typography variant="body1">
              <strong>Completed Pairings:</strong>{" "}
              {round.pairings?.filter((pairing) => pairing.complete).length ||
                0}
            </Typography>

            {/* Add quick actions for mods/organizers */}
            {canManage && (
              <Box mt={3}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Quick Actions
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleStartRound}
                  >
                    Start Round
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={handleEndRound}
                  >
                    End Round
                  </Button>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Pairings */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" gutterBottom>
          Pairings
        </Typography>

        {/* Add create pairing button for mods/organizers */}
        {canManage && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenPairingDialog}
          >
            Create Pairing
          </Button>
        )}
      </Box>

      {round.pairings && round.pairings.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mission</TableCell>
                <TableCell>Player 1</TableCell>
                <TableCell>Player 2</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {round.pairings.map((pairing) => (
                <TableRow key={pairing.id} hover>
                  <TableCell>{pairing.mission || "N/A"}</TableCell>
                  <TableCell>
                    {event.detailedParticipants?.find(
                      (p) =>
                        p.userId === pairing.player1Id ||
                        p.userId === pairing.players?.[0]
                    )?.userDetails?.displayName || "Player 1"}
                  </TableCell>
                  <TableCell>
                    {event.detailedParticipants?.find(
                      (p) =>
                        p.userId === pairing.player2Id ||
                        p.userId === pairing.players?.[1]
                    )?.userDetails?.displayName || "Player 2"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={
                        pairing.complete ? <CheckCircleIcon /> : <PendingIcon />
                      }
                      label={pairing.complete ? "Complete" : "In Progress"}
                      color={pairing.complete ? "success" : "warning"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewPairing(pairing.id)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            No pairings have been created for this round yet.
          </Typography>
        </Paper>
      )}

      {/* Edit Round Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Round Details</DialogTitle>
        <DialogContent>
          <Box py={1}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ mb: 3, mt: 1 }}>
                <DateTimePicker
                  label="Start Date & Time"
                  value={editedRound.startDate}
                  onChange={(newValue) =>
                    setEditedRound((prev) => ({ ...prev, startDate: newValue }))
                  }
                  slotProps={{
                    textField: { fullWidth: true, margin: "normal" },
                  }}
                />

                <DateTimePicker
                  label="End Date & Time"
                  value={editedRound.endDate}
                  onChange={(newValue) =>
                    setEditedRound((prev) => ({ ...prev, endDate: newValue }))
                  }
                  minDateTime={editedRound.startDate}
                  slotProps={{
                    textField: { fullWidth: true, margin: "normal" },
                  }}
                />
              </Box>
            </LocalizationProvider>

            <TextField
              label="Mission"
              fullWidth
              margin="normal"
              value={editedRound.mission}
              onChange={(e) =>
                setEditedRound((prev) => ({ ...prev, mission: e.target.value }))
              }
            />

            <TextField
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={editedRound.description}
              onChange={(e) =>
                setEditedRound((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button
            onClick={handleSaveRoundChanges}
            color="primary"
            variant="contained"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Pairing Dialog */}
      <Dialog
        open={pairingDialogOpen}
        onClose={handleClosePairingDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Pairing</DialogTitle>
        <DialogContent>
          <Box py={1}>
            <TextField
              label="Mission"
              fullWidth
              margin="normal"
              type="text"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Player 1</InputLabel>
              <Select
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
                label="Player 1"
              >
                {event.detailedParticipants?.map((participant, index) => (
                  <MenuItem key={index} value={participant.userId}>
                    {participant.userDetails?.displayName || participant.userId}
                    {participant.companyDetails?.name &&
                      ` (${participant.companyDetails.name})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Player 2</InputLabel>
              <Select
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                label="Player 2"
              >
                {event.detailedParticipants?.map((participant, index) => (
                  <MenuItem key={index} value={participant.userId}>
                    {participant.userDetails?.displayName || participant.userId}
                    {participant.companyDetails?.name &&
                      ` (${participant.companyDetails.name})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePairingDialog}>Cancel</Button>
          <Button
            onClick={handleCreatePairing}
            color="primary"
            variant="contained"
            disabled={!player1 || !player2 || player1 === player2}
          >
            Create Pairing
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RoundDetailsPage;

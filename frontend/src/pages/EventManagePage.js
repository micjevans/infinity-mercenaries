import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  ListItemSecondaryAction,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  getEvent,
  getRounds,
  createRound,
  getPairings,
  createPairing,
  completeRound,
  completePairing,
  isEventOrganizer,
} from "../services/eventService";
import { getUserCompanies } from "../services/companyService";

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EventManagePage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isMod } = useAuth();

  const [event, setEvent] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [participantDetails, setParticipantDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  const [openNewRound, setOpenNewRound] = useState(false);
  const [roundName, setRoundName] = useState("");

  const [openNewPairing, setOpenNewPairing] = useState(false);
  const [selectedRound, setSelectedRound] = useState("");
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");

  const [roundPairings, setRoundPairings] = useState({});
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const loadEventData = async () => {
      try {
        const eventData = await getEvent(eventId);
        setEvent(eventData);

        // Check if user has permission to manage this event
        if (user) {
          const isOrganizer = isEventOrganizer(eventData, user.uid);
          if (!isAdmin && !isMod && !isOrganizer) {
            setUnauthorized(true);
            return;
          }
        } else {
          // No user logged in
          setUnauthorized(true);
          return;
        }

        // Load participants
        const participantList = eventData.participants || [];
        setParticipants(participantList);

        // Load participant company details
        const details = {};
        for (const participant of participantList) {
          try {
            const company = await getUserCompanies(participant.userId);
            const participantCompany = company.find(
              (c) => c.id === participant.companyId
            );
            details[participant.userId] = {
              company: participantCompany || { name: "Unknown Company" },
            };
          } catch (err) {
            console.error("Error loading participant details:", err);
          }
        }
        setParticipantDetails(details);

        // Load rounds
        const roundsData = await getRounds(eventId);
        setRounds(roundsData);

        // Load pairings for each round
        const pairingsData = {};
        for (const round of roundsData) {
          try {
            const roundPairings = await getPairings(eventId, round.id);
            pairingsData[round.id] = roundPairings;
          } catch (err) {
            console.error(`Error loading pairings for round ${round.id}:`, err);
          }
        }
        setRoundPairings(pairingsData);
      } catch (error) {
        console.error("Error loading event management data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId, user, isAdmin, isMod]);

  // Redirect if unauthorized
  useEffect(() => {
    if (unauthorized) {
      navigate(`/events/${eventId}`);
    }
  }, [unauthorized, eventId, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // New Round Dialog
  const handleOpenNewRound = () => setOpenNewRound(true);
  const handleCloseNewRound = () => setOpenNewRound(false);

  const handleCreateRound = async () => {
    try {
      if (roundName.trim() === "") return;

      const roundId = await createRound(eventId, { name: roundName });

      // Refresh rounds
      const updatedRounds = await getRounds(eventId);
      setRounds(updatedRounds);

      // Update round pairings
      setRoundPairings((prev) => ({
        ...prev,
        [roundId]: [],
      }));

      // Reset and close dialog
      setRoundName("");
      handleCloseNewRound();
    } catch (error) {
      console.error("Error creating round:", error);
    }
  };

  // New Pairing Dialog
  const handleOpenNewPairing = (roundId) => {
    setSelectedRound(roundId);
    setOpenNewPairing(true);
  };

  const handleCloseNewPairing = () => {
    setSelectedRound("");
    setPlayer1("");
    setPlayer2("");
    setOpenNewPairing(false);
  };

  const handleCreatePairing = async () => {
    try {
      if (!player1 || !player2 || player1 === player2) return;

      await createPairing(eventId, selectedRound, {
        players: [player1, player2],
      });

      // Refresh pairings for the round
      const updatedPairings = await getPairings(eventId, selectedRound);
      setRoundPairings((prev) => ({
        ...prev,
        [selectedRound]: updatedPairings,
      }));

      // Reset and close dialog
      handleCloseNewPairing();
    } catch (error) {
      console.error("Error creating pairing:", error);
    }
  };

  // Handle round completion
  const handleToggleRoundCompletion = async (roundId, currentStatus) => {
    try {
      await completeRound(eventId, roundId, !currentStatus);

      // Update rounds in state
      setRounds((prev) =>
        prev.map((round) =>
          round.id === roundId ? { ...round, complete: !currentStatus } : round
        )
      );
    } catch (error) {
      console.error("Error toggling round completion:", error);
    }
  };

  // Handle pairing completion
  const handleTogglePairingCompletion = async (
    roundId,
    pairingId,
    currentStatus
  ) => {
    try {
      await completePairing(eventId, roundId, pairingId, !currentStatus);

      // Update pairing in state
      setRoundPairings((prev) => ({
        ...prev,
        [roundId]: prev[roundId].map((pairing) =>
          pairing.id === pairingId
            ? { ...pairing, complete: !currentStatus }
            : pairing
        ),
      }));
    } catch (error) {
      console.error("Error toggling pairing completion:", error);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Manage Event: {event?.name}
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Participants" />
            <Tab label="Rounds" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">
              Registered Participants ({participants.length}/
              {event.maxParticipants || "Unlimited"})
            </Typography>
          </Box>

          {participants.length === 0 ? (
            <Typography variant="body1">
              No participants have registered yet.
            </Typography>
          ) : (
            <List>
              {participants.map((participant, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`Player ID: ${participant.userId}`}
                    secondary={`Company: ${
                      participantDetails[participant.userId]?.company?.name ||
                      "Loading..."
                    }`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Event Rounds</Typography>
            <Button
              onClick={handleOpenNewRound}
              variant="contained"
              color="primary"
            >
              Create New Round
            </Button>
          </Box>

          {rounds.length === 0 ? (
            <Typography variant="body1">
              No rounds have been created yet.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {rounds.map((round) => (
                <Grid item xs={12} key={round.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="h6">
                          {round.name}
                          {round.complete && (
                            <Chip
                              size="small"
                              label="Complete"
                              color="success"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                        <Box>
                          <IconButton
                            color={round.complete ? "error" : "success"}
                            onClick={() =>
                              handleToggleRoundCompletion(
                                round.id,
                                round.complete
                              )
                            }
                          >
                            {round.complete ? (
                              <CancelIcon />
                            ) : (
                              <CheckCircleIcon />
                            )}
                          </IconButton>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <Typography variant="subtitle1">Pairings</Typography>
                        <Button
                          onClick={() => handleOpenNewPairing(round.id)}
                          variant="outlined"
                          size="small"
                        >
                          Create Pairing
                        </Button>
                      </Box>

                      {!roundPairings[round.id] ||
                      roundPairings[round.id].length === 0 ? (
                        <Typography variant="body2" color="textSecondary">
                          No pairings yet
                        </Typography>
                      ) : (
                        <List dense>
                          {roundPairings[round.id].map((pairing) => (
                            <ListItem key={pairing.id}>
                              <ListItemText
                                primary={`Pairing: ${pairing.players[0]} vs ${pairing.players[1]}`}
                                secondary={
                                  pairing.complete ? "Complete" : "In progress"
                                }
                              />
                              <ListItemSecondaryAction>
                                <IconButton
                                  edge="end"
                                  color={pairing.complete ? "error" : "success"}
                                  onClick={() =>
                                    handleTogglePairingCompletion(
                                      round.id,
                                      pairing.id,
                                      pairing.complete
                                    )
                                  }
                                >
                                  {pairing.complete ? (
                                    <CancelIcon />
                                  ) : (
                                    <CheckCircleIcon />
                                  )}
                                </IconButton>
                                <IconButton
                                  edge="end"
                                  component={Link}
                                  to={`/events/${eventId}/rounds/${round.id}/pairings/${pairing.id}`}
                                  sx={{ ml: 1 }}
                                >
                                  View
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>

      {/* New Round Dialog */}
      <Dialog open={openNewRound} onClose={handleCloseNewRound}>
        <DialogTitle>Create New Round</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="round-name"
            label="Round Name"
            fullWidth
            value={roundName}
            onChange={(e) => setRoundName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewRound}>Cancel</Button>
          <Button onClick={handleCreateRound} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Pairing Dialog */}
      <Dialog open={openNewPairing} onClose={handleCloseNewPairing}>
        <DialogTitle>Create New Pairing</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Player 1</InputLabel>
            <Select
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              label="Player 1"
            >
              {participants.map((participant, index) => (
                <MenuItem key={index} value={participant.userId}>
                  {participant.userId} (
                  {participantDetails[participant.userId]?.company?.name ||
                    "Loading..."}
                  )
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>Player 2</InputLabel>
            <Select
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              label="Player 2"
            >
              {participants.map((participant, index) => (
                <MenuItem key={index} value={participant.userId}>
                  {participant.userId} (
                  {participantDetails[participant.userId]?.company?.name ||
                    "Loading..."}
                  )
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewPairing}>Cancel</Button>
          <Button
            onClick={handleCreatePairing}
            color="primary"
            disabled={!player1 || !player2 || player1 === player2}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventManagePage;

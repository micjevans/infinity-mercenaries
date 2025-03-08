import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Grid,
  CircularProgress,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Divider,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  getEvent,
  getPairings,
  submitResult,
  getResults,
} from "../services/eventService";
import { useAuth } from "../auth/AuthContext";
import { getTroopersForCompany } from "../services/companyService";

const DOWNTIME_EVENTS = [
  "Training",
  "Recovery",
  "Supply Run",
  "Intel Gathering",
  "Recruitment",
];

const DOWNTIME_RESULTS = ["Critical Success", "Success", "Failure"];

const XP_CATEGORIES = [
  "Survived Mission",
  "Completed Objective",
  "First Blood",
  "Eliminated Enemy Officer",
  "Support Action",
];

const PairingPage = () => {
  const { eventId, roundId, pairingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Page data
  const [event, setEvent] = useState(null);
  const [pairing, setPairing] = useState(null);
  const [troopers, setTroopers] = useState([]);
  const [activeStep, setActiveStep] = useState(0);

  // Form data
  const [resultData, setResultData] = useState({
    player: user?.uid,
    op: 0,
    won: false,
    downtime: {
      event: "",
      result: "",
    },
    troopers: [],
  });

  // Check if user has already submitted a result
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const loadPairingData = async () => {
      try {
        // Load event data
        const eventData = await getEvent(eventId);
        setEvent(eventData);

        // Find user's registered company for this event
        const userParticipation = eventData.participants?.find(
          (p) => p.userId === user?.uid
        );

        if (!userParticipation) {
          setError("You are not registered for this event.");
          setLoading(false);
          return;
        }

        // Load pairing details
        const pairingsData = await getPairings(eventId, roundId);
        const pairingData = pairingsData.find((p) => p.id === pairingId);

        if (!pairingData) {
          setError("Pairing not found.");
          setLoading(false);
          return;
        }

        setPairing(pairingData);

        // Check if the user is part of this pairing
        if (!pairingData.players.includes(user?.uid)) {
          setError("You are not part of this pairing.");
          setLoading(false);
          return;
        }

        // Load existing results
        const resultsData = await getResults(eventId, roundId, pairingId);

        // Check if user has already submitted a result
        const userResult = resultsData.find((r) => r.player === user?.uid);
        if (userResult) {
          setHasSubmitted(true);
          setResultData(userResult);
        }

        // Load user's troopers for this company
        const companyTroopers = await getTroopersForCompany(
          userParticipation.companyId
        );
        setTroopers(companyTroopers);
      } catch (error) {
        console.error("Error loading pairing data:", error);
        setError("Failed to load pairing data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadPairingData();
    } else {
      setError("You must be logged in to view this pairing.");
      setLoading(false);
    }
  }, [eventId, roundId, pairingId, user]);

  // Handle trooper selection
  const handleAddTrooper = (trooperId) => {
    if (resultData.troopers.some((t) => t.trooper === trooperId)) {
      return; // Already added
    }

    setResultData((prev) => ({
      ...prev,
      troopers: [
        ...prev.troopers,
        {
          trooper: trooperId,
          injuries: [],
          xp: {},
        },
      ],
    }));
  };

  const handleRemoveTrooper = (trooperId) => {
    setResultData((prev) => ({
      ...prev,
      troopers: prev.troopers.filter((t) => t.trooper !== trooperId),
    }));
  };

  // Handle injuries
  const handleAddInjury = (trooperIndex, injury) => {
    const updatedTroopers = [...resultData.troopers];
    if (!updatedTroopers[trooperIndex].injuries.includes(injury)) {
      updatedTroopers[trooperIndex].injuries.push(injury);

      setResultData((prev) => ({
        ...prev,
        troopers: updatedTroopers,
      }));
    }
  };

  const handleRemoveInjury = (trooperIndex, injuryIndex) => {
    const updatedTroopers = [...resultData.troopers];
    updatedTroopers[trooperIndex].injuries.splice(injuryIndex, 1);

    setResultData((prev) => ({
      ...prev,
      troopers: updatedTroopers,
    }));
  };

  // Handle XP
  const handleXpChange = (trooperIndex, category, value) => {
    const updatedTroopers = [...resultData.troopers];
    updatedTroopers[trooperIndex].xp[category] = parseInt(value, 10) || 0;

    setResultData((prev) => ({
      ...prev,
      troopers: updatedTroopers,
    }));
  };

  // Handle form fields
  const handleInputChange = (field, value) => {
    setResultData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDowntimeChange = (field, value) => {
    setResultData((prev) => ({
      ...prev,
      downtime: {
        ...prev.downtime,
        [field]: value,
      },
    }));
  };

  // Stepper navigation
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Form submission
  const handleSubmit = async () => {
    try {
      // Validate form data
      if (resultData.troopers.length === 0) {
        setError("You must deploy at least one trooper.");
        return;
      }

      if (!resultData.downtime.event || !resultData.downtime.result) {
        setError("You must select a downtime event and result.");
        return;
      }

      await submitResult(eventId, roundId, pairingId, resultData);
      setSuccess(true);

      // Refresh results - Remove the problematic line
      // const updatedResults = await getResults(eventId, roundId, pairingId);
      // setResults(updatedResults); // This line causes the error - remove it
      setHasSubmitted(true);

      // Navigate back to event details
      setTimeout(() => {
        navigate(`/events/${eventId}`);
      }, 2000);
    } catch (error) {
      console.error("Error submitting result:", error);
      setError("Failed to submit result. Please try again.");
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !pairing) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const steps = [
    "Deploy Troopers",
    "Record Downtime",
    "Add Injuries & XP",
    "Mission Results",
  ];

  // Find trooper details from ID
  const getTrooperById = (trooperId) => {
    return (
      troopers.find((t) => t.id === trooperId) || { name: "Unknown Trooper" }
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Mission Pairing
        </Typography>

        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Event: {event?.name} • Round: {roundId}
        </Typography>

        {hasSubmitted && !loading && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You have already submitted your results for this mission. You can
            view the details below.
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Deploy Troopers */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Troopers to Deploy
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Available Troopers
                    </Typography>
                    <List dense>
                      {troopers.map((trooper) => (
                        <ListItem key={trooper.id}>
                          <ListItemText
                            primary={trooper.name}
                            secondary={`${trooper.type} - ${trooper.rank}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              disabled={
                                resultData.troopers.some(
                                  (t) => t.trooper === trooper.id
                                ) || hasSubmitted
                              }
                              onClick={() => handleAddTrooper(trooper.id)}
                            >
                              <AddIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Deployed Troopers
                    </Typography>
                    {resultData.troopers.length === 0 ? (
                      <Typography variant="body2" color="textSecondary">
                        No troopers deployed yet
                      </Typography>
                    ) : (
                      <List dense>
                        {resultData.troopers.map((deployedTrooper) => {
                          const trooperDetails = getTrooperById(
                            deployedTrooper.trooper
                          );
                          return (
                            <ListItem key={deployedTrooper.trooper}>
                              <ListItemText
                                primary={trooperDetails.name}
                                secondary={`${trooperDetails.type} - ${trooperDetails.rank}`}
                              />
                              <ListItemSecondaryAction>
                                <IconButton
                                  edge="end"
                                  disabled={hasSubmitted}
                                  onClick={() =>
                                    handleRemoveTrooper(deployedTrooper.trooper)
                                  }
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          );
                        })}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button
                onClick={handleNext}
                variant="contained"
                color="primary"
                disabled={resultData.troopers.length === 0}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: Record Downtime */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Record Downtime
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={hasSubmitted}>
                  <InputLabel>Downtime Activity</InputLabel>
                  <Select
                    value={resultData.downtime.event}
                    onChange={(e) =>
                      handleDowntimeChange("event", e.target.value)
                    }
                    label="Downtime Activity"
                  >
                    {DOWNTIME_EVENTS.map((event) => (
                      <MenuItem key={event} value={event}>
                        {event}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={hasSubmitted}>
                  <InputLabel>Result</InputLabel>
                  <Select
                    value={resultData.downtime.result}
                    onChange={(e) =>
                      handleDowntimeChange("result", e.target.value)
                    }
                    label="Result"
                  >
                    {DOWNTIME_RESULTS.map((result) => (
                      <MenuItem key={result} value={result}>
                        {result}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
            >
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Back
              </Button>
              <Button
                onClick={handleNext}
                variant="contained"
                color="primary"
                disabled={
                  !resultData.downtime.event || !resultData.downtime.result
                }
              >
                Next
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 3: Add Injuries & XP */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Record Injuries & Experience Points
            </Typography>

            {resultData.troopers.map((deployedTrooper, trooperIndex) => {
              const trooperDetails = getTrooperById(deployedTrooper.trooper);

              return (
                <Card
                  variant="outlined"
                  key={deployedTrooper.trooper}
                  sx={{ mb: 3 }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {trooperDetails.name} ({trooperDetails.type} -{" "}
                      {trooperDetails.rank})
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    {/* Injuries section */}
                    <Typography variant="subtitle2" gutterBottom>
                      Injuries
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          label="Add Injury"
                          variant="outlined"
                          fullWidth
                          size="small"
                          disabled={hasSubmitted}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && e.target.value) {
                              handleAddInjury(trooperIndex, e.target.value);
                              e.target.value = "";
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Button
                          variant="outlined"
                          onClick={(e) => {
                            const input =
                              e.target.previousSibling?.querySelector("input");
                            if (input && input.value) {
                              handleAddInjury(trooperIndex, input.value);
                              input.value = "";
                            }
                          }}
                          disabled={hasSubmitted}
                          fullWidth
                        >
                          Add Injury
                        </Button>
                      </Grid>
                    </Grid>

                    <Box sx={{ mb: 2 }}>
                      {deployedTrooper.injuries.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">
                          No injuries recorded
                        </Typography>
                      ) : (
                        deployedTrooper.injuries.map((injury, injuryIndex) => (
                          <Chip
                            key={injuryIndex}
                            label={injury}
                            onDelete={
                              hasSubmitted
                                ? undefined
                                : () =>
                                    handleRemoveInjury(
                                      trooperIndex,
                                      injuryIndex
                                    )
                            }
                            sx={{ m: 0.5 }}
                          />
                        ))
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* XP section */}
                    <Typography variant="subtitle2" gutterBottom>
                      Experience Points
                    </Typography>

                    <Grid container spacing={2}>
                      {XP_CATEGORIES.map((category) => (
                        <Grid item xs={12} sm={6} key={category}>
                          <TextField
                            label={category}
                            type="number"
                            InputProps={{ inputProps: { min: 0 } }}
                            value={deployedTrooper.xp[category] || 0}
                            onChange={(e) =>
                              handleXpChange(
                                trooperIndex,
                                category,
                                e.target.value
                              )
                            }
                            disabled={hasSubmitted}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
            >
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Back
              </Button>
              <Button onClick={handleNext} variant="contained" color="primary">
                Next
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 4: Mission Results */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Mission Results
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Objective Points"
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                  value={resultData.op}
                  onChange={(e) =>
                    handleInputChange("op", parseInt(e.target.value, 10) || 0)
                  }
                  disabled={hasSubmitted}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={resultData.won}
                      onChange={(e) =>
                        handleInputChange("won", e.target.checked)
                      }
                      disabled={hasSubmitted}
                    />
                  }
                  label="Mission Won"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Summary
              </Typography>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2">
                    <strong>Deployed Troopers:</strong>{" "}
                    {resultData.troopers.length} troopers
                  </Typography>

                  <Typography variant="body2">
                    <strong>Downtime:</strong> {resultData.downtime.event} -{" "}
                    {resultData.downtime.result}
                  </Typography>

                  <Typography variant="body2">
                    <strong>Objective Points:</strong> {resultData.op}
                  </Typography>

                  <Typography variant="body2">
                    <strong>Mission Status:</strong>{" "}
                    {resultData.won ? "Victory" : "Defeat"}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
            >
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                color="primary"
                disabled={hasSubmitted}
              >
                Submit Results
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Feedback messages */}
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
          Results submitted successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PairingPage;

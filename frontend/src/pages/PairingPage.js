import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  getEvent,
  getPairings,
  submitResult,
  getResults,
  addResult,
  updateResult,
} from "../services/eventService";
import { useAuth } from "../auth/AuthContext";
// Import the new service
import { getTroopers } from "../services/trooperService";
// Import components
import DeployTroopers from "../components/pairing/DeployTroopers";
import Mission from "../components/pairing/Mission";
import PostMission from "../components/pairing/PostMission";
import { getCompany } from "../services/companyService";
// Constants moved to top level for clarity
const DOWNTIME_EVENTS = [
  "Training",
  "Recovery",
  "Supply Run",
  "Intel Gathering",
  "Recruitment",
];

const DOWNTIME_RESULTS = ["Critical Success", "Success", "Failure"];

// Add this import for company service

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

  // Add state for confirmation dialog
  const [deployConfirmOpen, setDeployConfirmOpen] = useState(false);

  // Add state for opponent data
  const [opponentId, setOpponentId] = useState(null);
  const [opponentTroopers, setOpponentTroopers] = useState([]);
  const [allResults, setAllResults] = useState([]);

  // Add state for company data
  const [playerCompany, setPlayerCompany] = useState(null);
  const [opponentCompany, setOpponentCompany] = useState(null);

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

        // Load player's company data
        try {
          const playerCompanyData = await getCompany(
            userParticipation.companyId,
            user.uid
          );
          setPlayerCompany(playerCompanyData);
        } catch (companyError) {
          console.error("Error loading player company:", companyError);
        }

        // Find opponent's ID from the pairing players array
        const opponent = pairingData.players.find(
          (playerId) => playerId !== user.uid
        );
        setOpponentId(opponent);

        // Find opponent's company
        if (opponent) {
          const opponentParticipation = eventData.participants?.find(
            (p) => p.userId === opponent
          );

          if (opponentParticipation?.companyId) {
            try {
              // Load opponent's company data
              const opponentCompanyData = await getCompany(
                opponentParticipation.companyId,
                opponent
              );
              setOpponentCompany(opponentCompanyData);
            } catch (companyError) {
              console.error("Error loading opponent company:", companyError);
            }
          }
        }

        // Load existing results
        const resultsData = await getResults(eventId, roundId, pairingId);
        setAllResults(resultsData);

        // Load user's troopers for this company using the new service
        // We need to pass both the companyId and userId
        const companyTroopers = await getTroopers(
          userParticipation.companyId,
          user.uid
        );
        setTroopers(companyTroopers);

        // Load opponent's troopers if they've submitted a result
        const opponentResult = resultsData.find((r) => r.player === opponent);
        if (opponentResult && opponentResult.troopers) {
          // Find opponent's company
          const opponentParticipation = eventData.participants?.find(
            (p) => p.userId === opponent
          );

          if (opponentParticipation?.companyId) {
            try {
              // Get opponent's troopers
              const opponentTroops = await getTroopers(
                opponentParticipation.companyId,
                opponent
              );

              // Filter to just the deployed ones from their result
              const deployedOpponentTroopers = opponentTroops.filter(
                (trooper) =>
                  opponentResult.troopers.some((t) => t.trooper === trooper.id)
              );

              setOpponentTroopers(deployedOpponentTroopers);
            } catch (error) {
              console.error("Error loading opponent troopers:", error);
            }
          }
        }

        // Check if user has already submitted a result
        const userResult = resultsData.find((r) => r.player === user?.uid);
        if (userResult) {
          setHasSubmitted(userResult.complete);
          setResultData({
            ...userResult,
            resultId: userResult.id, // Make sure to include the resultId
          });
          setActiveStep(userResult.troopers.length > 0 ? 1 : 0);
          return;
        }

        setResultData((prev) => {
          return {
            ...prev,
            troopers: companyTroopers
              .filter((t) => t.captain)
              .map((t) => {
                return { trooper: t.id, injuries: [], xp: {} };
              }),
          };
        });
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

  // Handle form fields
  const handleInputChange = (field, value) => {
    setResultData((prev) => ({
      ...prev,
      [field]: value,
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

  const handleDowntimeChange = (field, value) => {
    setResultData((prev) => ({
      ...prev,
      downtime: {
        ...prev.downtime,
        [field]: value,
      },
    }));
  };

  // Update to show confirmation dialog instead of immediately saving
  const handleDeployNext = () => {
    // Validate that troopers are selected
    if (resultData.troopers.length === 0) {
      setError("You must deploy at least one trooper.");
      return;
    }

    // Show confirmation dialog
    setDeployConfirmOpen(true);
  };

  // Add function to handle dialog close
  const handleDeployConfirmClose = () => {
    setDeployConfirmOpen(false);
  };

  // Move the existing save logic to this new confirmation handler
  const handleDeployConfirm = async () => {
    try {
      // Close dialog first
      setDeployConfirmOpen(false);

      // Use addResult to create the initial result record
      const resultId = await addResult(eventId, roundId, pairingId, {
        ...resultData,
        player: user.uid,
        phase: "deploy",
      });

      // Store the resultId in the local state
      setResultData((prev) => ({
        ...prev,
        resultId: resultId,
      }));

      // Move to next step
      setActiveStep((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving deployed troopers:", error);
      setError("Failed to save deployed troopers. Please try again.");
    }
  };

  // New function to save mission results
  const saveMissionResults = async () => {
    try {
      // Will implement validation here
      if (!resultData.resultId) {
        setError("Missing result ID. Please try again.");
        return;
      }

      // Save partial result with mission details
      await updateResult(eventId, roundId, pairingId, resultData.resultId, {
        ...resultData,
        phase: "mission",
      });

      // Move to next step
      setActiveStep((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving mission results:", error);
      setError("Failed to save mission results. Please try again.");
    }
  };

  // Final submission function
  const handleSubmit = async () => {
    try {
      // Final validation
      if (resultData.troopers.length === 0) {
        setError("You must deploy at least one trooper.");
        return;
      }

      if (!resultData.resultId) {
        setError("Missing result ID. Please try again.");
        return;
      }

      // Submit final result with verified status
      await updateResult(eventId, roundId, pairingId, resultData.resultId, {
        ...resultData,
        phase: "complete",
        status: "verified",
      });

      setSuccess(true);
      setHasSubmitted(true);

      // Check if all players have verified their results
      const allResults = await getResults(eventId, roundId, pairingId);
      const allVerified = allResults.every(
        (result) => result.status === "verified"
      );

      if (allVerified) {
        // Mark pairing as complete - This would be implemented in your backend
        console.log("All players have verified their results");
      }

      // Navigate back to event details
      setTimeout(() => {
        navigate(`/events/${eventId}`);
      }, 2000);
    } catch (error) {
      console.error("Error submitting result:", error);
      setError("Failed to submit result. Please try again.");
    }
  };

  // Handle going back a step
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
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

  // Updated steps for the new workflow
  const steps = ["Deploy Troopers", "Mission", "Post Mission"];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header with Back Button */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box display="flex" alignItems="center">
          <Tooltip title="Back to Round Details">
            <IconButton
              onClick={() => navigate(`/events/${eventId}/rounds/${roundId}`)}
              color="primary"
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" component="h1">
            {/* Keep existing heading */}
            Pairing Details
          </Typography>
        </Box>
        {/* Keep any existing action buttons */}
      </Box>

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

        {/* Render appropriate component based on activeStep */}
        {activeStep === 0 && (
          <DeployTroopers
            troopers={troopers}
            resultData={resultData}
            hasSubmitted={hasSubmitted}
            onAddTrooper={handleAddTrooper}
            onRemoveTrooper={handleRemoveTrooper}
            onNext={handleDeployNext} // Changed from saveDeployedTroopers to handleDeployNext
          />
        )}

        {activeStep === 1 && (
          <Mission
            resultData={resultData}
            hasSubmitted={hasSubmitted}
            onBack={handleBack}
            onNext={saveMissionResults}
            handleInputChange={handleInputChange}
            handleDowntimeChange={handleDowntimeChange}
            handleXpChange={handleXpChange}
            troopers={troopers}
            DOWNTIME_EVENTS={DOWNTIME_EVENTS}
            DOWNTIME_RESULTS={DOWNTIME_RESULTS}
            enemyTroopers={opponentTroopers} // Pass opponent's troopers
            allResults={allResults} // Pass all results
            opponentId={opponentId} // Pass opponent's ID
            setResultData={setResultData} // Pass setResultData to the Mission component
            eventId={eventId} // Pass through eventId
            roundId={roundId} // Pass through roundId
            pairingId={pairingId} // Pass through pairingId
            playerCompany={playerCompany} // Pass player company
            opponentCompany={opponentCompany} // Pass opponent company
          />
        )}

        {activeStep === 2 && (
          <PostMission
            resultData={resultData}
            hasSubmitted={hasSubmitted}
            onBack={handleBack}
            onSubmit={handleSubmit}
          />
        )}
      </Paper>

      {/* Add Deployment Confirmation Dialog */}
      <Dialog
        open={deployConfirmOpen}
        onClose={handleDeployConfirmClose}
        aria-labelledby="deploy-confirm-title"
        aria-describedby="deploy-confirm-description"
      >
        <DialogTitle id="deploy-confirm-title">
          Confirm Trooper Deployment
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="deploy-confirm-description">
            Deployed Troopers cannot be changed once the mission starts. Are you
            sure this is the list you wish to play with?
          </DialogContentText>
          {/* Optional: You could show the list of troopers here for final review */}
          {resultData.troopers.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Troopers to deploy:
              </Typography>
              <ul>
                {resultData.troopers.map((t) => {
                  const trooper = troopers.find((tr) => tr.id === t.trooper);
                  return (
                    <li key={t.trooper}>
                      {trooper ? trooper.name : `Trooper ${t.trooper}`}
                    </li>
                  );
                })}
              </ul>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeployConfirmClose}>Cancel</Button>
          <Button
            onClick={handleDeployConfirm}
            color="primary"
            variant="contained"
          >
            Confirm Deployment
          </Button>
        </DialogActions>
      </Dialog>

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

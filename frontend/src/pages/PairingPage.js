import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  getEvent,
  getPairings,
  getResults,
  addResult,
  updateResult,
} from "../services/eventService";
import { useAuth } from "../auth/AuthContext";
import { getTroopers } from "../services/trooperService";
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

  // Add state for opponent data
  const [opponentId, setOpponentId] = useState(null);
  const [opponentTroopers, setOpponentTroopers] = useState([]);
  const [allResults, setAllResults] = useState([]);

  // Add state for company data
  const [playerCompany, setPlayerCompany] = useState(null);
  const [opponentCompany, setOpponentCompany] = useState(null);

  // Add state for opponent results and submission status
  const [opponentResults, setOpponentResults] = useState(null);
  const [opponentHasSubmitted, setOpponentHasSubmitted] = useState(false);

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

        if (!userParticipation.companyId) {
          console.error("Missing companyId for user in event participants");
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

          if (!playerCompanyData) {
            console.error("getCompany returned null for player company");
          } else {
            setPlayerCompany(playerCompanyData);
          }
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

              if (!opponentCompanyData) {
                console.error("getCompany returned null for opponent company");
              } else {
                setOpponentCompany(opponentCompanyData);
              }
            } catch (companyError) {
              console.error("Error loading opponent company:", companyError);
            }
          } else {
            console.error(
              "Missing companyId for opponent in event participants"
            );
          }
        }

        // Load existing results
        const resultsData = await getResults(eventId, roundId, pairingId);
        setAllResults(resultsData);

        // Load user's troopers for this company
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
              setOpponentResults(opponentResult);
              setOpponentHasSubmitted(opponentResult.complete);
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
            resultId: userResult.id,
          });
          setActiveStep(userResult.troopers.length > 0 ? 1 : 0);
          return;
        }

        // Set up initial result data with captain
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

  // Step 1: Handle deployed troopers update and confirmation
  const handleDeployTroopersComplete = async (deployedTroopers) => {
    try {
      // Use the updated troopers from the component
      const updatedResultData = {
        ...resultData,
        troopers: deployedTroopers,
        player: user.uid,
        phase: "deploy",
      };

      // Save to database and get result ID
      const resultId = await addResult(
        eventId,
        roundId,
        pairingId,
        updatedResultData
      );

      // Update local state
      setResultData({
        ...updatedResultData,
        resultId: resultId,
      });

      // Move to next step
      setActiveStep(1);
    } catch (error) {
      console.error("Error saving deployed troopers:", error);
      setError("Failed to save deployed troopers. Please try again.");
    }
  };

  // Step 2: Handle mission results update
  const handleMissionComplete = async (missionData) => {
    try {
      if (!missionData.resultId) {
        setError("Missing result ID. Please try again.");
        return;
      }

      // Save updated mission data
      await updateResult(eventId, roundId, pairingId, missionData.resultId, {
        ...missionData,
        phase: "mission",
      });

      // Update local state
      setResultData(missionData);

      // Move to next step
      setActiveStep(2);
    } catch (error) {
      console.error("Error saving mission results:", error);
      setError("Failed to save mission results. Please try again.");
    }
  };

  // Step 3: Final submission
  const handleFinalSubmit = async () => {
    try {
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

      // Navigate back to event details after a short delay
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
            Pairing Details
          </Typography>
        </Box>
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
            initialSelection={resultData.troopers}
            hasSubmitted={hasSubmitted}
            onComplete={handleDeployTroopersComplete}
          />
        )}

        {activeStep === 1 && (
          <Mission
            initialData={resultData}
            hasSubmitted={hasSubmitted}
            onBack={handleBack}
            onComplete={handleMissionComplete}
            troopers={troopers}
            DOWNTIME_EVENTS={DOWNTIME_EVENTS}
            DOWNTIME_RESULTS={DOWNTIME_RESULTS}
            enemyTroopers={opponentTroopers}
            allResults={allResults}
            opponentId={opponentId}
            eventId={eventId}
            roundId={roundId}
            pairingId={pairingId}
            playerCompany={playerCompany}
            opponentCompany={opponentCompany}
          />
        )}

        {activeStep === 2 && (
          <PostMission
            resultData={resultData}
            opponentResults={opponentResults}
            playerCompany={playerCompany}
            opponentCompany={opponentCompany}
            troopers={troopers}
            opponentTroopers={opponentTroopers}
            hasSubmitted={hasSubmitted}
            opponentHasSubmitted={opponentHasSubmitted}
            onBack={handleBack}
            onSubmit={handleFinalSubmit}
          />
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

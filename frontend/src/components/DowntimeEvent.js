import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  Chip,
  Avatar,
  CircularProgress,
  Grid2,
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import StarIcon from "@mui/icons-material/Star";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";

// Define the downtime events
const DOWNTIME_EVENTS = [
  {
    id: 1,
    name: "Training Session",
    description: "Your trooper trains hard to improve their skills.",
    autoSelectTrooper: false,
  },
  {
    id: 2,
    name: "Recovery Time",
    description: "Your trooper spends time recovering from their injuries.",
    autoSelectTrooper: true,
    targetInjured: true,
  },
  {
    id: 3,
    name: "Supply Run",
    description: "Your trooper goes on a supply run to gather resources.",
    autoSelectTrooper: false,
  },
  {
    id: 4,
    name: "Intel Gathering",
    description: "Your trooper collects valuable intelligence.",
    autoSelectTrooper: false,
  },
  {
    id: 5,
    name: "Recruitment",
    description: "Your trooper seeks to recruit new members.",
    autoSelectTrooper: false,
  },
  {
    id: 6,
    name: "Maintenance",
    description: "Your trooper maintains their equipment.",
    autoSelectTrooper: false,
  },
];

// Define the outcome options
const OUTCOME_OPTIONS = [
  { id: "failure", label: "Failure", color: "error" },
  { id: "success", label: "Success", color: "success" },
  { id: "critical", label: "Critical Success", color: "warning" },
];

const DowntimeEvent = ({
  resultData,
  onUpdateDowntime, // Function to update downtime in parent component
  deployedTroopers, // Array of deployed troopers
  getTrooperById, // Function to get trooper details by ID
  disabled = false, // Whether the component is disabled (e.g., if already submitted)
  isLoading = false, // Add isLoading prop
  playerCompany = null, // Add player company prop
  opponentCompany = null, // Add opponent company prop
  inducements = 0, // Add inducements prop
}) => {
  console.log("DowntimeEvent props:", {
    resultData,
    deployedTroopers,
    playerCompany,
    opponentCompany,
  });
  // Track the state of the downtime process
  const [eventRolled, setEventRolled] = useState(
    Boolean(resultData.downtime?.event)
  );
  const [trooperSelected, setTrooperSelected] = useState(
    Boolean(resultData.downtime?.trooper)
  );
  const [outcomeSelected, setOutcomeSelected] = useState(
    Boolean(resultData.downtime?.result)
  );

  // Add local state for tracking selections before saving
  const [localEvent, setLocalEvent] = useState(
    resultData.downtime?.event || null
  );
  const [localTrooper, setLocalTrooper] = useState(
    resultData.downtime?.trooper || null
  );

  // Get the current event if one has been rolled
  const currentEvent = eventRolled
    ? DOWNTIME_EVENTS.find(
        (event) => event.id === (localEvent || resultData.downtime?.event)
      )
    : null;

  // Effect to initialize state based on existing resultData
  useEffect(() => {
    setEventRolled(Boolean(resultData.downtime?.event));
    setTrooperSelected(Boolean(resultData.downtime?.trooper));
    setOutcomeSelected(Boolean(resultData.downtime?.result));
    setLocalEvent(resultData.downtime?.event || null);
    setLocalTrooper(resultData.downtime?.trooper || null);
  }, [resultData.downtime]);

  // Add a helper function to clean object for Firestore (remove undefined values)
  const cleanForFirestore = (obj) => {
    const cleaned = {};
    Object.keys(obj).forEach((key) => {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    });
    return cleaned;
  };

  // Function to roll a random event
  const rollEvent = () => {
    // Generate a random index for the events array
    const randomIndex = Math.floor(Math.random() * DOWNTIME_EVENTS.length);
    const event = DOWNTIME_EVENTS[randomIndex];

    // Set local event state
    setLocalEvent(event.id);
    setEventRolled(true);

    // Update the database immediately with just the event
    // Use null instead of undefined for Firestore compatibility
    const newDowntime = cleanForFirestore({
      ...resultData.downtime,
      event: event.id,
      trooper: null,
      result: null,
    });

    // Explicitly pass true to ensure saving to database
    onUpdateDowntime(newDowntime, true);
    console.log("Rolling event and saving:", event.id);

    // If this event auto-selects a trooper, do that locally
    if (event.autoSelectTrooper) {
      autoSelectTrooper(event);
    } else {
      // Reset trooper selection if we're rolling a new event
      setLocalTrooper(null);
      setTrooperSelected(false);
    }

    // Always reset outcome when rolling a new event
    setOutcomeSelected(false);
  };

  // Function to automatically select a trooper based on event requirements
  const autoSelectTrooper = (event) => {
    if (!event) return;

    let selectedTrooper = null;

    // If the event targets injured troopers, find the first injured one
    if (event.targetInjured) {
      selectedTrooper = deployedTroopers.find(
        (trooper) => trooper.injury && trooper.injury !== ""
      );
    }

    // If no specific target found (or no targeting criteria), select the first trooper
    if (!selectedTrooper && deployedTroopers.length > 0) {
      selectedTrooper = deployedTroopers[0];
    }

    // If we found a trooper to select, update local state
    if (selectedTrooper) {
      setLocalTrooper(selectedTrooper.trooper);
      setTrooperSelected(true);
    }
  };

  // Function to manually select a trooper - only updates local state
  const selectTrooper = (trooperId) => {
    setLocalTrooper(trooperId);
    setTrooperSelected(true);
  };

  // Function to select an outcome - this is where we save everything to the database
  const selectOutcome = (outcomeId) => {
    try {
      // Create the complete downtime event with all selections
      const newDowntime = {
        event: localEvent || resultData.downtime?.event,
        trooper: localTrooper,
        result: outcomeId,
      };

      console.log("SAVING OUTCOME:", {
        existingDowntime: resultData.downtime,
        newDowntime: newDowntime,
        resultId: resultData.resultId, // Log the resultId for debugging
      });

      // Explicitly pass true to ensure saving to database
      onUpdateDowntime(newDowntime, true);

      setOutcomeSelected(true);
    } catch (error) {
      console.error("ERROR IN selectOutcome:", error);
      // Continue and show the outcome anyway
      setOutcomeSelected(true);
    }
  };

  // Function to reset the downtime event (for testing)
  const resetDowntime = () => {
    onUpdateDowntime(
      cleanForFirestore({
        event: null,
        trooper: null,
        result: null,
      })
    );
    setEventRolled(false);
    setTrooperSelected(false);
    setOutcomeSelected(false);
    setLocalEvent(null);
    setLocalTrooper(null);
  };

  // Render the current trooper's details if one is selected
  const renderSelectedTrooper = () => {
    // Use local trooper state instead of resultData
    if (!localTrooper) return null;

    const trooperId = localTrooper;
    const trooperData = deployedTroopers.find((t) => t.trooper === trooperId);
    if (!trooperData) return null;

    const trooperDetails = getTrooperById(trooperId);

    return (
      <Box sx={{ mt: 2, display: "flex", alignItems: "center" }}>
        <Avatar
          src={trooperDetails.resume?.logo}
          alt={trooperDetails.name}
          sx={{ mr: 1 }}
        />
        <Typography variant="body1">{trooperDetails.name}</Typography>
      </Box>
    );
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Downtime Event
        </Typography>

        {/* Add company info and inducements display */}
        {(playerCompany || opponentCompany) && (
          <Box
            sx={{
              mb: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {playerCompany?.name || "Your Company"} vs{" "}
              {opponentCompany?.name || "Opponent"}
            </Typography>

            {inducements > 0 && (
              <Chip
                icon={<CurrencyExchangeIcon />}
                label={`Inducements: ${inducements}`}
                color="primary"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        )}

        {/* Show loading overlay when saving */}
        {isLoading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              zIndex: 1,
              borderRadius: "inherit",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {!eventRolled ? (
          // Step 1: Roll for an event
          <Box>
            <Typography variant="body1" paragraph>
              Roll to determine what happens during downtime after the mission.
            </Typography>
            <Button
              variant="contained"
              startIcon={<CasinoIcon />}
              onClick={rollEvent}
              disabled={disabled}
            >
              Roll Downtime Event
            </Button>
          </Box>
        ) : (
          // Event has been rolled
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              {currentEvent?.name || "Unknown Event"}
            </Typography>

            <Typography variant="body1" paragraph>
              {currentEvent?.description || "No description available."}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {!trooperSelected ? (
              // Step 2: Select a trooper (if not auto-selected)
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Select a trooper for this event:
                </Typography>
                <Grid2 container spacing={1} sx={{ mt: 1 }}>
                  {deployedTroopers.map((trooper) => {
                    const trooperDetails = getTrooperById(trooper.trooper);
                    return (
                      <Grid2 key={trooper.trooper}>
                        <Chip
                          avatar={<Avatar src={trooperDetails.resume?.logo} />}
                          label={trooperDetails.name}
                          onClick={() => selectTrooper(trooper.trooper)}
                          disabled={disabled}
                          clickable
                          color="primary"
                          variant="outlined"
                        />
                      </Grid2>
                    );
                  })}
                </Grid2>
              </Box>
            ) : !outcomeSelected ? (
              // Step 3: Roll for/select outcome
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Trooper:
                </Typography>
                {renderSelectedTrooper()}

                {/* Add ability to change trooper selection */}
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setTrooperSelected(false)}
                  sx={{ mt: 1, mb: 2 }}
                  disabled={disabled}
                >
                  Change Trooper
                </Button>

                <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
                  Select the outcome of the event:
                </Typography>
                <Grid2 container spacing={2} sx={{ mt: 1 }}>
                  {OUTCOME_OPTIONS.map((outcome) => (
                    <Grid2 key={outcome.id}>
                      <Button
                        variant="contained"
                        color={outcome.color}
                        onClick={() => selectOutcome(outcome.id)}
                        disabled={disabled}
                        startIcon={
                          outcome.id === "critical" ? (
                            <StarIcon />
                          ) : outcome.id === "success" ? (
                            <CheckCircleIcon />
                          ) : (
                            <CancelIcon />
                          )
                        }
                      >
                        {outcome.label}
                      </Button>
                    </Grid2>
                  ))}
                </Grid2>
              </Box>
            ) : (
              // Step 4: Show completed downtime event
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Downtime event completed!
                </Alert>

                <Typography variant="subtitle1" gutterBottom>
                  Event: {currentEvent?.name}
                </Typography>

                <Typography variant="subtitle1" gutterBottom>
                  Trooper:
                </Typography>
                {renderSelectedTrooper()}

                <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
                  Outcome:
                </Typography>
                <Chip
                  label={
                    OUTCOME_OPTIONS.find(
                      (o) => o.id === resultData.downtime?.result
                    )?.label || "Unknown"
                  }
                  color={
                    OUTCOME_OPTIONS.find(
                      (o) => o.id === resultData.downtime?.result
                    )?.color || "default"
                  }
                />
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      {/* Only show reset button if not disabled (for testing/development) */}
      {!disabled && (
        <CardActions sx={{ justifyContent: "flex-end" }}>
          <Button
            size="small"
            color="secondary"
            onClick={resetDowntime}
            disabled={!eventRolled}
          >
            Reset
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export default DowntimeEvent;

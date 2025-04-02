import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Divider,
  Alert,
  Paper,
  Avatar,
  CircularProgress,
  Stack,
  Tooltip,
  Grid2,
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import EventIcon from "@mui/icons-material/Event";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { events } from "../data/downtime/events";
import { traits as traitsDefinitions } from "../data/downtime/traits";
import { useAuth } from "../auth/AuthContext";

// Icons for different traits
const TRAIT_ICONS = {
  chaotic: "🔥",
  lawful: "⚖️",
  attack: "⚔️",
  cr: "💰",
  xp: "⭐",
  weapon: "🔫",
  swc: "💎",
  p2p: "🤝",
  skill: "🔧",
  lt: "👑",
  mvp: "🏆",
  captain: "🎖️",
  renowned: "📊",
  opponent: "🎯",
  merc: "👤",
  crNeg: "📉",
  requireHacker: "💻",
  requireTrinity: "🔮",
  skillNaturalBornWarrior: "👊",
  skillStealth: "🥷",
};

const DowntimeEvent = ({
  resultData,
  onUpdateDowntime,
  deployedTroopers = [],
  getTrooperById,
  disabled = false,
  isLoading = false,
  playerCompany,
  opponentCompany,
  inducements = 0,
  saveImmediately = false, // New prop to control saving behavior
}) => {
  const { isAdmin } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedTrooper, setSelectedTrooper] = useState("");
  const [rolledEventId, setRolledEventId] = useState(null);
  const [isRolling, setIsRolling] = useState(false);

  // Load any existing downtime data when component mounts
  useEffect(() => {
    if (resultData?.downtime) {
      // If a specific event was previously selected
      if (resultData.downtime.eventId) {
        const event = events.find((e) => e.id === resultData.downtime.eventId);
        setSelectedEvent(event);

        // If an option was previously selected
        if (resultData.downtime.optionId) {
          const option = event?.options.find(
            (o) => o.id === resultData.downtime.optionId
          );
          setSelectedOption(option);
        }
      }

      // If a trooper was previously selected
      if (resultData.downtime.trooper) {
        setSelectedTrooper(resultData.downtime.trooper);
      }
    }
  }, [resultData]);

  // Roll for a random event
  const handleRollEvent = () => {
    setIsRolling(true);

    // Simulate rolling animation
    setTimeout(() => {
      const min = 1;
      const max = events.length;
      const rolledId = Math.floor(Math.random() * (max - min + 1)) + min;

      // Find the event that corresponds to the rolled number
      const rolledEvent = events.find((event) => event.id === rolledId);

      setRolledEventId(rolledId);
      setSelectedEvent(rolledEvent);
      setSelectedOption(null);
      setIsRolling(false);

      // Update the downtime data - pass saveImmediately flag
      onUpdateDowntime(
        {
          ...resultData.downtime,
          eventId: rolledEvent.id,
          event: rolledEvent.description,
          optionId: null,
          option: null,
          result: null,
          trooper: null,
        },
        saveImmediately
      );
    }, 1000);
  };

  // Handle selecting a specific option
  const handleSelectOption = (option) => {
    setSelectedOption(option);

    // Update the downtime data with the selected option - pass saveImmediately flag
    onUpdateDowntime(
      {
        ...resultData.downtime,
        optionId: option.id,
        option: option.description,
      },
      saveImmediately
    );
  };

  // Handle selecting a trooper for the downtime event
  const handleTrooperChange = (event) => {
    const trooperId = event.target.value;
    setSelectedTrooper(trooperId);

    // Update the downtime data with the selected trooper - pass saveImmediately flag
    onUpdateDowntime(
      {
        ...resultData.downtime,
        trooper: trooperId,
      },
      saveImmediately
    );
  };

  // Process traits based on selected result
  const processTraits = (result) => {
    if (!selectedEvent || !selectedOption) return;

    // Map result string to the corresponding key in trait objects
    const resultKey =
      result === "Critical Success"
        ? "crit"
        : result === "Success"
        ? "pass"
        : result === "Failure"
        ? "fail"
        : null;

    if (!resultKey) return;

    console.group(`Trait Processing for ${result}`);

    // Process all traits from event and option
    const combinedTraits = getCombinedTraits();

    combinedTraits.forEach((trait) => {
      const traitName = trait.name;
      const traitDefinition = traitsDefinitions[traitName]?.(); // Most traits are functions

      if (!traitDefinition) {
        console.log(`Trait ${traitName}: No definition found`);
        return;
      }

      // Log what this trait would do with this result
      const resultEffect = traitDefinition[resultKey];

      if (!resultEffect) {
        console.log(`Trait ${traitName}: No effect for ${result}`);
        return;
      }

      console.log(`Trait ${traitName} (${result}):`, resultEffect);

      // Special handling for some trait types
      if (resultEffect.key && resultEffect.value) {
        console.log(
          `  → Modifies ${resultEffect.key} to ${resultEffect.value}`
        );
      } else if (Array.isArray(resultEffect)) {
        resultEffect.forEach((effect) => {
          console.log(`  → Modifies ${effect.key} to ${effect.value}`);
        });
      }
    });

    console.groupEnd();
  };

  // Handle selecting a result (success, failure, etc.)
  const handleResultChange = (event) => {
    const result = event.target.value;

    // Process traits and log their effects
    if (result) {
      processTraits(result);
    }

    // Update the downtime data with the result - pass saveImmediately flag
    onUpdateDowntime(
      {
        ...resultData.downtime,
        result,
      },
      saveImmediately
    );
  };

  // Handle reset button click
  const handleReset = () => {
    setSelectedEvent(null);
    setSelectedOption(null);
    setSelectedTrooper("");
    setRolledEventId(null);

    // Clear downtime data
    onUpdateDowntime(
      {
        event: "",
        eventId: null,
        option: "",
        optionId: null,
        result: "",
        trooper: null,
      },
      saveImmediately
    );
  };

  // Render trait chips for visual representation
  const renderTraitChips = (traitList) => {
    if (!traitList || traitList.length === 0) return null;

    return (
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
        {traitList.map((trait, index) => (
          <Tooltip key={index} title={trait.name} arrow>
            <Chip
              icon={<Typography>{TRAIT_ICONS[trait.name] || "🔶"}</Typography>}
              label={trait.name}
              size="small"
              sx={{ mb: 0.5, mr: 0.5 }}
            />
          </Tooltip>
        ))}
      </Stack>
    );
  };

  // Combine traits from both event and selected option
  const getCombinedTraits = () => {
    if (!selectedEvent) return [];

    const eventTraits = selectedEvent.traits || [];
    const optionTraits = selectedOption ? selectedOption.traits : [];

    // Combine and deduplicate traits
    return [...new Set([...eventTraits, ...optionTraits])];
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="Downtime Event"
        avatar={<EventIcon color="primary" />}
        action={
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isAdmin && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
                sx={{ mr: 2 }}
                disabled={isLoading}
              >
                Reset
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={
                isRolling ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CasinoIcon />
                )
              }
              onClick={handleRollEvent}
              disabled={disabled || isRolling}
              sx={{ mr: 2 }}
            >
              {isRolling ? "Rolling..." : "Roll Event"}
            </Button>
          </Box>
        }
      />
      <Divider />

      <CardContent>
        {!selectedEvent ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Roll a downtime event using the button above to see what happens to
            your company.
          </Alert>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              {selectedEvent.description}
            </Typography>

            {renderTraitChips(selectedEvent.traits)}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Choose Your Response:
            </Typography>

            {/* Changed Grid to stack options vertically */}
            <Box sx={{ mb: 2 }}>
              {selectedEvent.options.map((option) => (
                <Paper
                  key={option.id}
                  elevation={
                    selectedOption && selectedOption.id === option.id ? 8 : 1
                  }
                  sx={{
                    p: 2,
                    mb: 2, // Add bottom margin for vertical stacking
                    cursor: "pointer",
                    border:
                      selectedOption && selectedOption.id === option.id
                        ? "2px solid"
                        : "none",
                    borderColor: "primary.main",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => !disabled && handleSelectOption(option)}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Typography variant="body1" gutterBottom>
                      {option.description}
                    </Typography>

                    {selectedOption && selectedOption.id === option.id && (
                      <CheckCircleIcon color="success" sx={{ ml: 1 }} />
                    )}
                  </Box>

                  {/* Traits displayed horizontally */}
                  {renderTraitChips(option.traits)}
                </Paper>
              ))}
            </Box>

            {selectedOption && (
              <Box>
                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                  Outcome Details:
                </Typography>

                <Stack container spacing={2}>
                  <Grid2 item xs={12} md={12}>
                    <FormControl
                      fullWidth
                      margin="normal"
                      disabled={disabled || isLoading}
                    >
                      <InputLabel>Select Trooper</InputLabel>
                      <Select
                        value={selectedTrooper}
                        onChange={handleTrooperChange}
                        label="Select Trooper"
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {deployedTroopers.map((trooper) => {
                          const trooperDetails = getTrooperById(
                            trooper.trooper
                          );
                          return (
                            <MenuItem
                              key={trooper.trooper}
                              value={trooper.trooper}
                            >
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <Avatar
                                  src={trooperDetails?.resume?.logo}
                                  sx={{ width: 24, height: 24, mr: 1 }}
                                />
                                {trooperDetails?.name ||
                                  `Trooper ${trooper.trooper}`}
                              </Box>
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid2>
                  <Grid2 item xs={12} md={12}>
                    <FormControl
                      fullWidth
                      margin="normal"
                      disabled={disabled || isLoading}
                    >
                      <InputLabel>Select Result</InputLabel>
                      <Select
                        value={resultData?.downtime?.result || ""}
                        onChange={handleResultChange}
                        label="Select Result"
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        <MenuItem value="Critical Success">
                          Critical Success
                        </MenuItem>
                        <MenuItem value="Success">Success</MenuItem>
                        <MenuItem value="Failure">Failure</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid2>
                </Stack>

                {resultData?.downtime?.result && (
                  <Paper sx={{ p: 2, mt: 2, bgcolor: "background.paper" }}>
                    <Typography
                      variant="subtitle1"
                      color="primary"
                      gutterBottom
                    >
                      Traits Applied:
                    </Typography>
                    {renderTraitChips(getCombinedTraits())}

                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        These traits will affect your company based on the
                        outcome of the event.
                      </Typography>
                    </Alert>
                  </Paper>
                )}
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ display: "flex", justifyContent: "flex-end" }}>
        {isLoading && <CircularProgress size={24} sx={{ mr: 2 }} />}

        <Button
          startIcon={<InfoIcon />}
          color="secondary"
          disabled={disabled || isLoading || !selectedEvent}
          sx={{ mr: 2 }}
        >
          View Trait Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default DowntimeEvent;

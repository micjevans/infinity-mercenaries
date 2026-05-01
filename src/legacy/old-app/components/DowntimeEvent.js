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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import EventIcon from "@mui/icons-material/Event";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { events } from "../data/downtime/events";
import { traits as traitsDefinitions } from "../data/downtime/traits";
import { useAuth } from "../auth/AuthContext";

const DowntimeEvent = ({
  resultData,
  onUpdateDowntime,
  deployedTroopers = [],
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
  const [selectableTroopers, setSelectableTroopers] =
    useState(deployedTroopers);
  const [rolledEventId, setRolledEventId] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [traits, setTraits] = useState([]);
  const [traitData, setTraitData] = useState({
    resultData: resultData,
    company: playerCompany,
    trooper: selectedTrooper,
    troopers: deployedTroopers,
  });
  const disabled = resultData?.downtime?.result;

  useEffect(() => {
    setTraitData({
      resultData: resultData,
      company: playerCompany,
      trooper: selectedTrooper,
      troopers: deployedTroopers,
    });
  }, [resultData, playerCompany, selectedTrooper, deployedTroopers]);

  console.log("Trait Data:", traitData);
  // Combine traits from both event and selected option
  useEffect(() => {
    if (selectedEvent && selectedOption) {
      const eventTraits = selectedEvent.traits || [];
      const optionTraits = selectedOption.traits || [];

      // Don't pass setTraitData anymore
      setTraits(
        [...new Set([...eventTraits, ...optionTraits])].map(
          (trait) => trait(traitData, setTraitData) // Pass traitData to the trait function
        )
      );
    }
  }, [selectedEvent, selectedOption, traitData]);

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

  useEffect(() => {
    let trooperTraits = traits.filter(
      (trait) => trait.type === "participant" || trait.type === "consequence"
    );

    if (trooperTraits.length === 1) {
      let troopersToSelect = trooperTraits[0].troopers;
      if (troopersToSelect?.length > 0) {
        setSelectableTroopers(troopersToSelect);
        setSelectedTrooper(troopersToSelect[0].id);
      }
    }
  }, [traits, deployedTroopers, traitData.troopers]);

  // Roll for a random event
  const handleRollEvent = () => {
    setIsRolling(true);

    // Simulate rolling animation
    setTimeout(() => {
      const min = 1;
      const max = events.length;
      const rolledId = Math.floor(Math.random() * (max - min + 1)) + min;

      // Find the event that corresponds to the rolled number
      // const rolledEvent = events.find((event) => event.id === rolledId);
      const rolledEvent = events.find((event) => event.id === 1);
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
        ...traitData.resultData.downtime,
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
        ...traitData.resultData.downtime,
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
    traits.forEach((trait) => {
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
    console.log("Result changed:", traitData.resultData.downtime);
    onUpdateDowntime(
      {
        ...traitData.resultData.downtime,
        result,
      },
      true // Save immediately when result changes
    );
  };

  // Handle reset button click
  const handleReset = () => {
    setSelectedEvent(null);
    setSelectedOption(null);
    setSelectedTrooper("");
    setSelectableTroopers(deployedTroopers);
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
        {traitList.map((trait, index) => {
          let renderedTrait =
            typeof trait === "function" ? trait(traitData) : trait;

          // Create tooltip content with details table
          const tooltipContent = (
            <Box sx={{ p: 1, maxWidth: 300 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                {renderedTrait.name}
              </Typography>
              <Table size="small">
                <TableBody>
                  {renderedTrait.specialDesc && (
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", padding: "4px 8px" }}
                      >
                        Special
                      </TableCell>
                      <TableCell sx={{ padding: "4px 8px" }}>
                        {renderedTrait.specialDesc}
                      </TableCell>
                    </TableRow>
                  )}
                  {renderedTrait.failDetails && (
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", padding: "4px 8px" }}
                      >
                        Fail
                      </TableCell>
                      <TableCell sx={{ padding: "4px 8px" }}>
                        {renderedTrait.failDetails}
                      </TableCell>
                    </TableRow>
                  )}
                  {renderedTrait.passDetails && (
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", padding: "4px 8px" }}
                      >
                        Pass
                      </TableCell>
                      <TableCell sx={{ padding: "4px 8px" }}>
                        {renderedTrait.passDetails}
                      </TableCell>
                    </TableRow>
                  )}
                  {renderedTrait.critDetails && (
                    <TableRow>
                      <TableCell
                        component="th"
                        sx={{ fontWeight: "bold", padding: "4px 8px" }}
                      >
                        Crit
                      </TableCell>
                      <TableCell sx={{ padding: "4px 8px" }}>
                        {renderedTrait.critDetails}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          );

          return (
            <Tooltip
              key={index}
              title={tooltipContent}
              arrow
              placement="top"
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: "background.paper",
                    color: "text.primary",
                    boxShadow: 3,
                  },
                },
              }}
            >
              <Chip
                icon={<Typography>{renderedTrait.icon || "🔶"}</Typography>}
                label={renderedTrait.name}
                size="small"
                sx={{ mb: 0.5, mr: 0.5 }}
              />
            </Tooltip>
          );
        })}
      </Stack>
    );
  };

  // Function to generate the combined traits details table
  const renderTraitsDetailsTable = (traitList) => {
    if (!traitList || traitList.length === 0) return null;

    // Get rendered trait objects
    const renderedTraits = traitList.map((trait) =>
      typeof trait === "function" ? trait(traitData) : trait
    );

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Trait</TableCell>
              <TableCell>Special</TableCell>
              <TableCell>Fail</TableCell>
              <TableCell>Pass</TableCell>
              <TableCell>Crit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderedTraits.map((trait, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography>{trait.icon || "🔶"}</Typography>
                    {trait.name}
                  </Box>
                </TableCell>
                <TableCell>{trait.specialDesc || "-"}</TableCell>
                <TableCell>{trait.failDetails || "-"}</TableCell>
                <TableCell>{trait.passDetails || "-"}</TableCell>
                <TableCell>{trait.critDetails || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
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
                  <Grid2 size={12}>
                    {traits.map((trait) => trait.render && trait.render())}
                  </Grid2>
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
                        disabled={
                          disabled ||
                          selectableTroopers.length == null ||
                          selectableTroopers.length === 1 ||
                          selectableTroopers.length === 0
                        }
                        label="Select Trooper"
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {selectableTroopers.map((trooper) => (
                          <MenuItem key={trooper.id} value={trooper.id}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Avatar
                                src={trooper?.resume?.logo}
                                sx={{ width: 24, height: 24, mr: 1 }}
                              />
                              {trooper?.name || `Trooper ${trooper.id}`}
                            </Box>
                          </MenuItem>
                        ))}
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

                {traits?.length > 0 && (
                  <Paper sx={{ p: 2, mt: 2, bgcolor: "background.paper" }}>
                    <Typography
                      variant="subtitle1"
                      color="primary"
                      gutterBottom
                    >
                      Traits Applied:
                    </Typography>
                    {renderTraitChips([
                      ...selectedEvent.traits,
                      ...selectedOption.traits,
                    ])}

                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        These traits will affect your company based on the
                        outcome of the event.
                      </Typography>
                    </Alert>

                    {/* Add the combined traits details table */}
                    {renderTraitsDetailsTable([
                      ...selectedEvent.traits,
                      ...selectedOption.traits,
                    ])}
                  </Paper>
                )}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DowntimeEvent;

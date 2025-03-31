import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Button,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  RadioGroup,
  Radio,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Checkbox,
  Avatar,
} from "@mui/material";
import { submitResult, updateResult } from "../../services/eventService";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import Trooper from "../Trooper";
import DowntimeEvent from "../DowntimeEvent";

const INJURY_OPTIONS = [
  "",
  "Battle Fury (1-6)",
  "Punctured Lung (7-8)",
  "Arms Injury (9-10)",
  "Brain Injury (11-12)",
  "Legs Injury (13-14)",
  "Body Compromised (15-16)",
  "Eye Damage (17-18)",
  "Shell Shocked (19-20)",
];

const OBJECTIVE_OPTIONS = [
  { value: "", label: "None", xp: 0 },
  { value: "attempt", label: "Attempt", xp: 1 },
  { value: "success", label: "Success", xp: 2 },
];

const TAG_OPTIONS = [
  { value: "", label: "None", xp: 0 },
  { value: "scan", label: "Scan", xp: 1 },
  { value: "tag", label: "Tag", xp: 2 },
];

const Mission = ({
  resultData,
  hasSubmitted,
  onBack,
  onNext,
  handleInputChange,
  handleDowntimeChange,
  handleXpChange,
  troopers,
  DOWNTIME_EVENTS,
  DOWNTIME_RESULTS,
  enemyTroopers = [],
  allResults = [],
  opponentId = null,
  setResultData,
  eventId,
  roundId,
  pairingId,
  playerCompany = null,
  opponentCompany = null,
}) => {
  const [inducements, setInducements] = useState(0);

  const [expandedSections, setExpandedSections] = useState({
    missionRules: true,
    troopers: true,
    inducements: true,
    missionResults: true,
  });

  const handleAccordionChange = (section) => (event, isExpanded) => {
    setExpandedSections({
      ...expandedSections,
      [section]: isExpanded,
    });
  };

  const getTrooperById = useCallback(
    (trooperId) => {
      return (
        troopers.find((t) => t.id === trooperId) || {
          name: "Unknown Trooper",
          type: "Unknown",
          rank: "Unknown",
          renown: 0,
        }
      );
    },
    [troopers]
  );

  useEffect(() => {
    const playerPoints = resultData.troopers.reduce(
      (total, deployedTrooper) => {
        const trooper = troopers.find((t) => t.id === deployedTrooper.trooper);
        if (
          !trooper ||
          !trooper.profileGroups ||
          !trooper.profileGroups[0]?.options[0]?.points
        ) {
          return total;
        }
        return total + trooper.profileGroups[0].options[0].points;
      },
      0
    );

    const opponentPoints = enemyTroopers.reduce((total, trooper) => {
      if (
        !trooper ||
        !trooper.profileGroups ||
        !trooper.profileGroups[0]?.options[0]?.points
      ) {
        return total;
      }
      return total + trooper.profileGroups[0].options[0].points;
    }, 0);

    const calculatedInducements = opponentPoints - playerPoints;
    setInducements(calculatedInducements > 0 ? calculatedInducements : 0);

    console.log("Inducements calculation:", {
      playerPoints,
      opponentPoints,
      inducements: calculatedInducements > 0 ? calculatedInducements : 0,
    });
  }, [resultData.troopers, troopers, enemyTroopers]);

  const calculateTotalXp = (trooper) => {
    let total = 0;

    if (trooper.aid) total += 2;
    if (trooper.state) total += 2;
    if (trooper.alive) total += 2;

    if (trooper.objective === "attempt") total += 1;
    if (trooper.objective === "success") total += 2;
    if (trooper.tag === "scan") total += 1;
    if (trooper.tag === "tag") total += 2;

    if (trooper.injury && trooper.injury !== "") total += 1;

    if (trooper.mvp) total += 2;

    return total;
  };

  const handleCheckboxChange = (trooperIndex, field) => {
    const updatedTroopers = [...resultData.troopers];
    updatedTroopers[trooperIndex][field] =
      !updatedTroopers[trooperIndex][field];

    handleInputChange("troopers", updatedTroopers);
  };

  const handleDropdownChange = (trooperIndex, field, value) => {
    const updatedTroopers = [...resultData.troopers];
    updatedTroopers[trooperIndex][field] = value;

    if (field === "injury" && value !== "") {
      const injuryPerk = { id: value };

      if (!updatedTroopers[trooperIndex].perks) {
        updatedTroopers[trooperIndex].perks = [injuryPerk];
      } else if (
        !updatedTroopers[trooperIndex].perks.some((p) => p.id === value)
      ) {
        updatedTroopers[trooperIndex].perks.push(injuryPerk);
      }
    }

    handleInputChange("troopers", updatedTroopers);
  };

  const handleMvpChange = (trooperId) => {
    const updatedTroopers = [...resultData.troopers].map((trooper) => ({
      ...trooper,
      mvp: trooper.trooper === trooperId,
    }));

    handleInputChange("troopers", updatedTroopers);
  };

  const [savingDowntime, setSavingDowntime] = useState(false);
  const [downtimeError, setDowntimeError] = useState(null);

  const cleanForFirestore = (obj) => {
    const cleaned = {};
    Object.keys(obj).forEach((key) => {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      } else {
        cleaned[key] = null;
      }
    });
    return cleaned;
  };

  const saveDowntime = async (newDowntime) => {
    try {
      setSavingDowntime(true);
      setDowntimeError(null);

      const cleanDowntime = cleanForFirestore(newDowntime);

      console.log("Saving downtime to Firestore:", {
        originalDowntime: newDowntime,
        cleanedDowntime: cleanDowntime,
      });

      const updatedResultData = {
        ...resultData,
        downtime: cleanDowntime,
      };

      if (resultData.resultId) {
        await updateResult(
          eventId,
          roundId,
          pairingId,
          resultData.resultId,
          updatedResultData
        );
      } else {
        await submitResult(eventId, roundId, pairingId, updatedResultData);
      }

      console.log("Downtime saved successfully");
    } catch (error) {
      console.error("Error saving downtime:", error);
      setDowntimeError("Failed to save downtime. Changes may not persist.");
    } finally {
      setSavingDowntime(false);
    }
  };

  const updateDowntime = (newDowntime, save = true) => {
    setResultData((prev) => ({
      ...prev,
      downtime: newDowntime,
    }));

    console.log("Downtime updated - Save flag:", save);
    if (save && !hasSubmitted) {
      console.log("Saving downtime to database:", newDowntime);
      saveDowntime(newDowntime);
    }
  };

  return (
    <Box>
      <Accordion
        expanded={expandedSections.missionRules}
        onChange={handleAccordionChange("missionRules")}
        sx={{
          mb: 3,
          boxShadow: 3,
          "&:before": { display: "none" },
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "primary.contrastText" }} />}
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            height: 64,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <MenuBookIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Mission Rules</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Box sx={{ width: "100%", height: "500px", mb: 2 }}>
            <iframe
              src="https://docs.google.com/document/d/e/2PACX-1vTe9jPeOOQMNIGbfqeRua_CKXw9wnIfiIzdro4S9gGuCCpaR0Vcx4pVyBMpzQaEkY23piUGk-sSn_jP/pub?embedded=true"
              width="100%"
              height="100%"
              frameBorder="0"
              title="Mission Rules"
            ></iframe>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expandedSections.inducements}
        onChange={handleAccordionChange("inducements")}
        sx={{
          mb: 3,
          boxShadow: 3,
          "&:before": { display: "none" },
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "primary.contrastText" }} />}
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            height: 64,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CurrencyExchangeIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Inducements</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                  <CurrencyExchangeIcon />
                </Avatar>
                <Typography variant="h5">
                  Available Inducements: {inducements}
                </Typography>
              </Box>

              <Typography variant="body1" paragraph>
                Inducements are calculated based on the difference in deployed
                trooper points between you and your opponent.
              </Typography>

              <Box sx={{ bgcolor: "background.paper", p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Your Company: {playerCompany?.name || "Unknown"}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Opponent's Company: {opponentCompany?.name || "Unknown"}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">
                  Note: Use inducements to balance gameplay when facing a
                  stronger opponent.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Inducement Details
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Company</TableCell>
                      <TableCell align="right">Deployed Points</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Your Company</TableCell>
                      <TableCell align="right">
                        {resultData.troopers.reduce(
                          (total, deployedTrooper) => {
                            const trooper = troopers.find(
                              (t) => t.id === deployedTrooper.trooper
                            );
                            if (
                              !trooper ||
                              !trooper.profileGroups?.[0]?.options?.[0]?.points
                            )
                              return total;
                            return (
                              total + trooper.profileGroups[0].options[0].points
                            );
                          },
                          0
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Opponent's Company</TableCell>
                      <TableCell align="right">
                        {enemyTroopers.reduce((total, trooper) => {
                          if (
                            !trooper ||
                            !trooper.profileGroups?.[0]?.options?.[0]?.points
                          )
                            return total;
                          return (
                            total + trooper.profileGroups[0].options[0].points
                          );
                        }, 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Inducements
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        {inducements}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expandedSections.troopers}
        onChange={handleAccordionChange("troopers")}
        sx={{
          mb: 3,
          boxShadow: 3,
          "&:before": { display: "none" },
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "primary.contrastText" }} />}
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            height: 64,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <PeopleIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Troopers</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Trooper Performance
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Trooper</TableCell>
                  <TableCell align="center">XP Gained</TableCell>
                  <TableCell align="center">Aid</TableCell>
                  <TableCell align="center">State</TableCell>
                  <TableCell align="center">Objective</TableCell>
                  <TableCell align="center">Tag</TableCell>
                  <TableCell align="center">Alive</TableCell>
                  <TableCell align="center">Injury</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resultData.troopers.map((trooper, index) => {
                  const trooperDetails = getTrooperById(trooper.trooper);

                  return (
                    <TableRow key={trooper.trooper}>
                      <TableCell component="th" scope="row">
                        <Box display="flex" alignItems="center">
                          <img
                            src={trooperDetails.resume?.logo}
                            alt={trooperDetails.isc}
                            style={{
                              height: 24,
                              marginRight: 8,
                            }}
                          />
                          {trooperDetails.name}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="bold">
                          {calculateTotalXp(trooper)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={trooper.aid || false}
                          onChange={() => handleCheckboxChange(index, "aid")}
                          disabled={hasSubmitted}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={trooper.state || false}
                          onChange={() => handleCheckboxChange(index, "state")}
                          disabled={hasSubmitted}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select
                            value={trooper.objective || ""}
                            onChange={(e) =>
                              handleDropdownChange(
                                index,
                                "objective",
                                e.target.value
                              )
                            }
                            disabled={hasSubmitted}
                            displayEmpty
                          >
                            {OBJECTIVE_OPTIONS.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select
                            value={trooper.tag || ""}
                            onChange={(e) =>
                              handleDropdownChange(index, "tag", e.target.value)
                            }
                            disabled={hasSubmitted}
                            displayEmpty
                          >
                            {TAG_OPTIONS.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={trooper.alive || false}
                          onChange={() => handleCheckboxChange(index, "alive")}
                          disabled={hasSubmitted}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={trooper.injury || ""}
                            onChange={(e) =>
                              handleDropdownChange(
                                index,
                                "injury",
                                e.target.value
                              )
                            }
                            disabled={hasSubmitted}
                            displayEmpty
                          >
                            {INJURY_OPTIONS.map((option) => (
                              <MenuItem key={option} value={option}>
                                {option || "None"}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Deployed Forces
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Your Deployed Troopers
            </Typography>
            {resultData.troopers.length > 0 ? (
              <Box
                sx={{
                  maxHeight: "500px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  pr: 1,
                }}
              >
                {resultData.troopers.map((deployedTrooper) => {
                  const trooperData = troopers.find(
                    (t) => t.id === deployedTrooper.trooper
                  );
                  return trooperData ? (
                    <Box key={deployedTrooper.trooper} sx={{ mb: 2 }}>
                      <Trooper trooper={trooperData} onClick={() => {}} />
                    </Box>
                  ) : null;
                })}
              </Box>
            ) : (
              <Alert severity="warning">No troopers deployed</Alert>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Opponent's Deployed Troopers
            </Typography>
            {enemyTroopers.length > 0 ? (
              <Box
                sx={{
                  maxHeight: "500px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  pr: 1,
                }}
              >
                {enemyTroopers.map((enemyTrooper) => (
                  <Box key={enemyTrooper.id} sx={{ mb: 2 }}>
                    <Trooper trooper={enemyTrooper} onClick={() => {}} />
                  </Box>
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                {opponentId
                  ? "Your opponent hasn't deployed troopers yet or their data isn't available"
                  : "No opponent information available"}
              </Alert>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expandedSections.missionResults}
        onChange={handleAccordionChange("missionResults")}
        sx={{
          mb: 3,
          boxShadow: 3,
          "&:before": { display: "none" },
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "primary.contrastText" }} />}
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            height: 64,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <AssignmentTurnedInIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Mission Results</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Mission Outcome
              </Typography>
              <RadioGroup
                row
                value={resultData.won}
                onChange={(e) =>
                  handleInputChange("won", e.target.value === "true")
                }
                name="mission-outcome"
              >
                <FormControlLabel
                  value={true}
                  control={<Radio />}
                  label="Victory"
                  disabled={hasSubmitted}
                />
                <FormControlLabel
                  value={false}
                  control={<Radio />}
                  label="Defeat"
                  disabled={hasSubmitted}
                />
              </RadioGroup>

              <Box mt={2}>
                <TextField
                  label="Objective Points Scored"
                  type="number"
                  value={resultData.op || 0}
                  onChange={(e) =>
                    handleInputChange("op", parseInt(e.target.value) || 0)
                  }
                  fullWidth
                  disabled={hasSubmitted}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Box>

              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Most Valuable Player (MVP)
                </Typography>
                <FormControl fullWidth margin="normal" disabled={hasSubmitted}>
                  <InputLabel>Select MVP</InputLabel>
                  <Select
                    value={
                      resultData.troopers.find((t) => t.mvp)?.trooper || ""
                    }
                    onChange={(e) => handleMvpChange(e.target.value)}
                    label="Select MVP"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {resultData.troopers.map((trooper) => {
                      const trooperDetails = getTrooperById(trooper.trooper);
                      return (
                        <MenuItem key={trooper.trooper} value={trooper.trooper}>
                          {trooperDetails.name}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary">
                  The selected trooper will receive +2 XP
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Downtime Activity
              </Typography>

              {downtimeError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {downtimeError}
                </Alert>
              )}

              <DowntimeEvent
                resultData={resultData}
                onUpdateDowntime={updateDowntime}
                deployedTroopers={resultData.troopers}
                getTrooperById={getTrooperById}
                disabled={hasSubmitted || savingDowntime}
                isLoading={savingDowntime}
                playerCompany={playerCompany}
                opponentCompany={opponentCompany}
                inducements={inducements}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <Button
          onClick={onNext}
          variant="contained"
          color="primary"
          disabled={hasSubmitted}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default Mission;

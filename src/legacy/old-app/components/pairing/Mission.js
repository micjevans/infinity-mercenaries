import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Button,
  Box,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
  Table,
  TableContainer,
  Divider,
  Avatar,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { updateResult } from "../../services/eventService";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import Trooper from "../Trooper";
import TrooperPerformanceTable from "../mission/TrooperPerformanceTable";
import MissionResultSummary from "../mission/MissionResultSummary";

// Constants moved to component level
const DOWNTIME_EVENTS = [
  "Training",
  "Recovery",
  "Supply Run",
  "Intel Gathering",
  "Recruitment",
];

const DOWNTIME_RESULTS = ["Critical Success", "Success", "Failure"];

const Mission = ({
  initialData,
  hasSubmitted,
  onBack,
  onComplete,
  troopers,
  enemyTroopers = [],
  allResults = [],
  opponentId = null,
  eventId,
  roundId,
  pairingId,
  playerCompany = null,
  opponentCompany = null,
}) => {
  // Manage form data locally in the component
  const [missionData, setMissionData] = useState(initialData);
  const [inducements, setInducements] = useState(0);
  const [savingDowntime, setSavingDowntime] = useState(false);
  const [downtimeError, setDowntimeError] = useState(null);

  // Other state for UI
  const [expandedSections, setExpandedSections] = useState({
    missionRules: true,
    troopers: true,
    inducements: true,
    missionResults: true,
  });

  // Initialize from props
  useEffect(() => {
    setMissionData(initialData);
  }, [initialData]);

  // Handle accordion expansion
  const handleAccordionChange = (section) => (event, isExpanded) => {
    setExpandedSections({
      ...expandedSections,
      [section]: isExpanded,
    });
  };

  // Get trooper by ID helper
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

  // Calculate inducements
  useEffect(() => {
    const playerPoints = missionData.troopers.reduce(
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
  }, [missionData.troopers, troopers, enemyTroopers]);

  // Form update handlers
  const handleCheckboxChange = (trooperIndex, field) => {
    const updatedTroopers = [...missionData.troopers];
    updatedTroopers[trooperIndex][field] =
      !updatedTroopers[trooperIndex][field];

    setMissionData({
      ...missionData,
      troopers: updatedTroopers,
    });
  };

  const handleDropdownChange = (trooperIndex, field, value) => {
    const updatedTroopers = [...missionData.troopers];
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

    setMissionData({
      ...missionData,
      troopers: updatedTroopers,
    });
  };

  const handleMvpChange = (trooperId) => {
    const updatedTroopers = [...missionData.troopers].map((trooper) => ({
      ...trooper,
      mvp: trooper.trooper === trooperId,
    }));

    setMissionData({
      ...missionData,
      troopers: updatedTroopers,
    });
  };

  const handleInputChange = (field, value) => {
    setMissionData({
      ...missionData,
      [field]: value,
    });
  };

  // Downtime handlers
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
        ...missionData,
        downtime: cleanDowntime,
      };

      if (missionData.resultId) {
        await updateResult(
          eventId,
          roundId,
          pairingId,
          missionData.resultId,
          updatedResultData
        );
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
    setMissionData((prev) => ({
      ...prev,
      downtime: newDowntime,
    }));

    console.log("Downtime updated - Save flag:", save);
    if (save && !hasSubmitted) {
      console.log("Saving downtime to database:", newDowntime);
      saveDowntime(newDowntime);
    }
  };

  // Handle next button
  const handleNext = () => {
    // Additional validation could be done here
    onComplete(missionData);
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
                        {missionData.troopers.reduce(
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

          {/* Use the new TrooperPerformanceTable component */}
          <TrooperPerformanceTable
            trooperResults={missionData.troopers}
            getTrooperById={getTrooperById}
            readOnly={hasSubmitted}
            onCheckboxChange={handleCheckboxChange}
            onDropdownChange={handleDropdownChange}
            onMvpChange={handleMvpChange}
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Deployed Forces
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Your Deployed Troopers
            </Typography>
            {missionData.troopers.length > 0 ? (
              <Box
                sx={{
                  maxHeight: "500px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  pr: 1,
                }}
              >
                {missionData.troopers.map((deployedTrooper) => {
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
          {/* Use the new MissionResultSummary component */}
          <MissionResultSummary
            resultData={missionData}
            companyName={playerCompany?.name || "Your Company"}
            readOnly={hasSubmitted}
            onInputChange={handleInputChange}
            onMvpChange={handleMvpChange}
            troopersData={troopers}
            getTrooperById={getTrooperById}
            updateDowntime={updateDowntime}
            savingDowntime={savingDowntime}
            downtimeError={downtimeError}
            playerCompany={playerCompany}
            opponentCompany={opponentCompany}
            inducements={inducements}
          />
        </AccordionDetails>
      </Accordion>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button onClick={onBack}>Back</Button>
        <Button
          onClick={handleNext}
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

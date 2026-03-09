import React, { useState } from "react";
import {
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  CircularProgress,
  Alert,
  Avatar,
} from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import Chip from "@mui/material/Chip";

import TrooperPerformanceTable from "../mission/TrooperPerformanceTable";
import MissionResultSummary from "../mission/MissionResultSummary";
import { traits as traitsDefinitions } from "../../data/downtime/traits";
import { events } from "../../data/downtime/events"; // Import the events array

const PostMission = ({
  resultData,
  opponentResults,
  playerCompany,
  opponentCompany,
  troopers = [],
  opponentTroopers = [],
  hasSubmitted,
  opponentHasSubmitted,
  onBack,
  onSubmit,
}) => {
  const [submitting, setSubmitting] = useState(false);

  // Helper function to find a trooper by ID across all trooper arrays
  const getTrooperById = (trooperId) => {
    return (
      [...troopers, ...opponentTroopers].find((t) => t.id === trooperId) || {
        name: "Unknown Trooper",
      }
    );
  };

  // Process downtime traits based on result
  const processDowntimeTraits = () => {
    // Skip if no downtime data exists
    if (
      !resultData?.downtime ||
      !resultData.downtime.eventId ||
      !resultData.downtime.optionId ||
      !resultData.downtime.result
    ) {
      console.log("No downtime event data to process");
      return resultData;
    }

    console.group("Processing Downtime Event Traits");

    try {
      // Find the appropriate result key based on the selected outcome
      const resultKey =
        resultData.downtime.result === "Critical Success"
          ? "crit"
          : resultData.downtime.result === "Success"
          ? "pass"
          : resultData.downtime.result === "Failure"
          ? "fail"
          : null;

      if (!resultKey) {
        console.log("Invalid result type:", resultData.downtime.result);
        return resultData;
      }

      console.log(
        `Processing traits for outcome: ${resultData.downtime.result} (${resultKey})`
      );

      // Find the event and option objects
      const event = events.find((e) => e.id === resultData.downtime.eventId);
      if (!event) {
        console.log(`Event with ID ${resultData.downtime.eventId} not found`);
        return resultData;
      }

      const option = event.options.find(
        (o) => o.id === resultData.downtime.optionId
      );
      if (!option) {
        console.log(`Option with ID ${resultData.downtime.optionId} not found`);
        return resultData;
      }

      console.log("Found event:", event.description);
      console.log("Found option:", option.description);

      // Prepare the trait data
      let traitData = {
        resultData: resultData,
        company: playerCompany,
        trooper: resultData.downtime.trooper,
        troopers: troopers,
        p2p: resultData.downtime.p2p || 0,
      };

      // Get all traits from the event and option
      const eventTraits = event.traits || [];
      const optionTraits = option.traits || [];

      console.log(
        `Event traits: ${eventTraits.length}, Option traits: ${optionTraits.length}`
      );

      // Process each trait in sequence
      [...eventTraits, ...optionTraits].forEach((traitRaw) => {
        const trait = traitRaw(traitData); // Call the trait function with the updated data
        const traitFunction = trait[resultKey];
        if (traitFunction && trait.type === "consequence") {
          console.log(`Processing trait: ${trait.name}`);
          // Update the data with each trait's effect
          traitData = traitFunction();
          console.log("Trait processed, updated data:", traitData);
        } else {
          console.log(`Trait ${trait.name} has no ${resultKey} function`);
        }
      });

      console.log("Trait processing complete");
      return traitData;
    } catch (error) {
      console.error("Error processing downtime traits:", error);
      return resultData;
    } finally {
      console.groupEnd();
    }
  };

  // Handle submit button click
  const handleSubmit = () => {
    setSubmitting(true);

    try {
      // Process the downtime traits
      const processedData = processDowntimeTraits();
      onSubmit(processedData); // Call the parent's onSubmit with processed data
      setSubmitting(false);
    } catch (error) {
      console.error("Error during submission:", error);
      setSubmitting(false);
      // You might want to show an error message to the user here
    }
  };

  // Check if both players have completed their results
  const bothPlayersReady = Boolean(resultData) && Boolean(opponentResults);

  return (
    <Box>
      <Typography variant="h5" gutterBottom mb={3}>
        Mission Results Summary
      </Typography>

      {!bothPlayersReady && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Waiting for both players to complete their mission results...
        </Alert>
      )}

      {/* Mission Overview Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader
          title="Mission Overview"
          avatar={<AssignmentTurnedInIcon />}
          sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
        />
        <CardContent>
          <Grid container spacing={3}>
            {/* Player Results */}
            <Grid item xs={12} md={6}>
              <MissionResultSummary
                resultData={resultData}
                companyName={playerCompany?.name || "Your Company"}
                readOnly={true}
                getTrooperById={getTrooperById}
              />
            </Grid>

            {/* Opponent Results */}
            <Grid item xs={12} md={6}>
              <MissionResultSummary
                resultData={opponentResults}
                companyName={opponentCompany?.name || "Opponent's Company"}
                readOnly={true}
                getTrooperById={getTrooperById}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Trooper Performance Tables */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader
          title="Trooper Performance"
          sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
        />
        <CardContent>
          {/* Player's Troopers Table */}
          <TrooperPerformanceTable
            trooperResults={resultData?.troopers || []}
            getTrooperById={getTrooperById}
            readOnly={true}
            companyName={playerCompany?.name || "Your Company"}
            showCompanyHeader={true}
            companyColor="primary.main"
            emptyMessage="No trooper data available"
          />

          {/* Opponent's Troopers Table */}
          <TrooperPerformanceTable
            trooperResults={opponentResults?.troopers || []}
            getTrooperById={getTrooperById}
            readOnly={true}
            companyName={opponentCompany?.name || "Opponent's Company"}
            showCompanyHeader={true}
            companyColor="secondary.main"
            emptyMessage="No opponent trooper data available"
          />

          {/* Injuries Section */}
          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            Injuries Sustained
          </Typography>

          {/* Keep the existing injuries section as it has a unique layout */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Your Company
              </Typography>
              {resultData?.troopers?.filter((t) => t.injury && t.injury !== "")
                .length > 0 ? (
                resultData.troopers
                  .filter((t) => t.injury && t.injury !== "")
                  .map((trooper) => {
                    const trooperDetails = getTrooperById(trooper.trooper);
                    return (
                      <Box
                        key={trooper.trooper}
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Avatar
                          src={trooperDetails?.resume?.logo}
                          sx={{ mr: 1, width: 24, height: 24 }}
                        />
                        <Typography variant="body2">
                          <strong>{trooperDetails.name}:</strong>{" "}
                          {trooper.injury}
                        </Typography>
                      </Box>
                    );
                  })
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No injuries sustained
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Opponent's Company
              </Typography>
              {opponentResults?.troopers?.filter(
                (t) => t.injury && t.injury !== ""
              ).length > 0 ? (
                opponentResults.troopers
                  .filter((t) => t.injury && t.injury !== "")
                  .map((trooper) => {
                    const trooperDetails = getTrooperById(trooper.trooper);
                    return (
                      <Box
                        key={trooper.trooper}
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Avatar
                          src={trooperDetails?.resume?.logo}
                          sx={{ mr: 1, width: 24, height: 24 }}
                        />
                        <Typography variant="body2">
                          <strong>{trooperDetails.name}:</strong>{" "}
                          {trooper.injury}
                        </Typography>
                      </Box>
                    );
                  })
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No injuries sustained
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Submission Status */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Submission Status
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              Your submission:
            </Typography>
            {hasSubmitted ? (
              <Chip
                icon={<CheckCircleIcon />}
                label="Submitted"
                color="success"
              />
            ) : (
              <Chip icon={<PendingIcon />} label="Pending" color="default" />
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              Opponent submission:
            </Typography>
            {opponentHasSubmitted ? (
              <Chip
                icon={<CheckCircleIcon />}
                label="Submitted"
                color="success"
              />
            ) : (
              <Chip icon={<PendingIcon />} label="Pending" color="default" />
            )}
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button onClick={onBack} sx={{ mr: 1 }}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={hasSubmitted || !bothPlayersReady || submitting}
          startIcon={
            submitting ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {submitting ? "Submitting..." : "Finalize Results"}
        </Button>
      </Box>
    </Box>
  );
};

export default PostMission;

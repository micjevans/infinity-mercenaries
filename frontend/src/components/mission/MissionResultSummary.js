import React from "react";
import {
  Typography,
  Box,
  Paper,
  Grid,
  Divider,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
} from "@mui/material";
import DowntimeEvent from "../DowntimeEvent";

const MissionResultSummary = ({
  resultData,
  companyName,
  readOnly = false,
  onInputChange,
  onMvpChange,
  troopersData = [],
  getTrooperById,
  updateDowntime,
  savingDowntime = false,
  downtimeError = null,
  playerCompany = null,
  opponentCompany = null,
  inducements = 0,
}) => {
  // Format downtime event name
  const formatDowntimeEvent = (eventName) => {
    if (!eventName) return "None";

    // Convert from identifier to display name if needed
    const eventMap = {
      Training: "Training Session",
      Recovery: "Recovery Time",
      "Supply Run": "Supply Run",
      "Intel Gathering": "Intelligence Gathering",
      Recruitment: "Recruitment Drive",
    };

    return eventMap[eventName] || eventName;
  };

  // Format downtime result
  const formatDowntimeResult = (result) => {
    if (!result) return "None";

    // Standardize result names
    if (result === "Critical Success" || result === "critical")
      return "Critical Success";
    if (result === "Success" || result === "success") return "Success";
    if (result === "Failure" || result === "failure") return "Failure";

    return result;
  };

  if (readOnly) {
    // Read-only mode for PostMission
    return (
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {companyName}
        </Typography>

        <Box display="flex" alignItems="center" mb={1}>
          <Typography variant="body1" sx={{ mr: 1 }}>
            Outcome:
          </Typography>
          <Chip
            label={resultData?.won ? "Victory" : "Defeat"}
            color={resultData?.won ? "success" : "error"}
            size="small"
          />
        </Box>

        <Typography variant="body1" gutterBottom>
          Objective Points: {resultData?.op || 0}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Downtime Activity
        </Typography>

        <Typography variant="body2">
          Event: {formatDowntimeEvent(resultData?.downtime?.event)}
        </Typography>

        {resultData?.downtime?.trooper && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Trooper:
            </Typography>
            <Chip
              size="small"
              label={
                getTrooperById(resultData.downtime.trooper)?.name || "Unknown"
              }
              avatar={
                <Avatar
                  src={
                    getTrooperById(resultData.downtime.trooper)?.resume?.logo
                  }
                />
              }
            />
          </Box>
        )}

        <Typography variant="body2" sx={{ mt: 1 }}>
          Result: {formatDowntimeResult(resultData?.downtime?.result)}
        </Typography>
      </Paper>
    );
  } else {
    // Editable mode for Mission
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Mission Outcome
          </Typography>
          <RadioGroup
            row
            value={resultData.won}
            onChange={(e) => onInputChange("won", e.target.value === "true")}
            name="mission-outcome"
          >
            <FormControlLabel
              value={true}
              control={<Radio />}
              label="Victory"
              disabled={readOnly}
            />
            <FormControlLabel
              value={false}
              control={<Radio />}
              label="Defeat"
              disabled={readOnly}
            />
          </RadioGroup>

          <Box mt={2}>
            <TextField
              label="Objective Points Scored"
              type="number"
              value={resultData.op || 0}
              onChange={(e) =>
                onInputChange("op", parseInt(e.target.value) || 0)
              }
              fullWidth
              disabled={readOnly}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Box>

          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>
              Most Valuable Player (MVP)
            </Typography>
            <FormControl fullWidth margin="normal" disabled={readOnly}>
              <InputLabel>Select MVP</InputLabel>
              <Select
                value={resultData.troopers.find((t) => t.mvp)?.trooper || ""}
                onChange={(e) => onMvpChange(e.target.value)}
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

          <DowntimeEvent
            resultData={resultData}
            onUpdateDowntime={updateDowntime}
            deployedTroopers={resultData.troopers}
            getTrooperById={getTrooperById}
            disabled={readOnly || savingDowntime}
            isLoading={savingDowntime}
            playerCompany={playerCompany}
            opponentCompany={opponentCompany}
            inducements={inducements}
            saveImmediately={false} // Set to false to prevent immediate saving
          />
        </Grid>
      </Grid>
    );
  }
};

export default MissionResultSummary;

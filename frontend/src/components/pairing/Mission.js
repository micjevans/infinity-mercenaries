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
  Card,
  CardContent,
} from "@mui/material";

const XP_CATEGORIES = [
  { key: "aid", label: "Aid" },
  { key: "state", label: "State" },
  { key: "yt", label: "YT" },
  { key: "op", label: "OP" },
  { key: "scan", label: "Scan" },
  { key: "fo", label: "FO" },
  { key: "tandb", label: "T&B" },
  { key: "alive", label: "Alive" },
  { key: "mvp", label: "MVP" },
];

const INJURY_OPTIONS = [
  "None",
  "Light Injury",
  "Severe Injury",
  "Critical Injury",
  "Captured",
  "KIA",
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
}) => {
  const [inducements, setInducements] = useState(0);

  // Mock function to get trooper details by ID
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

  // Calculate inducements (mock calculation - would need actual implementation)
  useEffect(() => {
    // In a real implementation, this would compare opponent's renown to player's renown
    // Here we're just showing a dummy calculation for demonstration
    const playerRenown = resultData.troopers.reduce((total, t) => {
      const trooper = getTrooperById(t.trooper);
      return total + (trooper.renown || 0);
    }, 0);

    // This would be fetched from the pairing data
    const opponentRenown = playerRenown + 25; // Mock value - replace with actual calculation

    setInducements(opponentRenown - playerRenown);
    console.info(inducements); // Log the calculated inducements for debugging
  }, [resultData.troopers, inducements, getTrooperById]);

  // Handle injury selection for a trooper
  const handleInjuryChange = (trooperIndex, injury) => {
    const updatedTroopers = [...resultData.troopers];

    // If injury exists, update it; otherwise add it
    if (!updatedTroopers[trooperIndex].injury) {
      updatedTroopers[trooperIndex].injury = injury;
    } else {
      updatedTroopers[trooperIndex].injury = injury;
    }

    handleInputChange("troopers", updatedTroopers);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Mission Results
      </Typography>

      {/* Mission outcome section */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Mission Outcome
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={hasSubmitted}>
                <InputLabel>Did you win the mission?</InputLabel>
                <Select
                  value={resultData.won ? "yes" : "no"}
                  onChange={(e) =>
                    handleInputChange("won", e.target.value === "yes")
                  }
                  label="Did you win the mission?"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Objective Points"
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                value={resultData.op}
                onChange={(e) =>
                  handleInputChange("op", parseInt(e.target.value) || 0)
                }
                disabled={hasSubmitted}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Downtime section */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Downtime Activity
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={hasSubmitted}>
                <InputLabel>Activity Type</InputLabel>
                <Select
                  value={resultData.downtime.event}
                  onChange={(e) =>
                    handleDowntimeChange("event", e.target.value)
                  }
                  label="Activity Type"
                >
                  {DOWNTIME_EVENTS.map((event) => (
                    <MenuItem key={event} value={event}>
                      {event}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
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
        </CardContent>
      </Card>

      {/* Trooper performance section */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Trooper Performance
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Trooper</TableCell>
                  <TableCell>Injury</TableCell>
                  {XP_CATEGORIES.map((cat) => (
                    <TableCell key={cat.key} align="center">
                      {cat.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {resultData.troopers.map((trooper, index) => {
                  const trooperDetails = getTrooperById(trooper.trooper);
                  return (
                    <TableRow key={trooper.trooper}>
                      <TableCell>{trooperDetails.name}</TableCell>
                      <TableCell>
                        <FormControl
                          fullWidth
                          size="small"
                          disabled={hasSubmitted}
                        >
                          <Select
                            value={trooper.injury || "None"}
                            onChange={(e) =>
                              handleInjuryChange(index, e.target.value)
                            }
                          >
                            {INJURY_OPTIONS.map((option) => (
                              <MenuItem key={option} value={option}>
                                {option}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      {XP_CATEGORIES.map((cat) => (
                        <TableCell key={cat.key} align="center">
                          <TextField
                            type="number"
                            size="small"
                            inputProps={{
                              min: 0,
                              style: { textAlign: "center" },
                              disabled: hasSubmitted,
                            }}
                            value={trooper.xp?.[cat.key] || 0}
                            onChange={(e) =>
                              handleXpChange(index, cat.key, e.target.value)
                            }
                            sx={{ width: "60px" }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button onClick={onBack} sx={{ mr: 1 }}>
          Back
        </Button>
        <Button onClick={onNext} variant="contained" color="primary">
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default Mission;

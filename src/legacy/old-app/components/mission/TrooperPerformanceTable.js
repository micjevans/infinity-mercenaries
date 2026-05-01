import React from "react";
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Avatar,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";

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

const TrooperPerformanceTable = ({
  troopers = [],
  trooperResults = [],
  getTrooperById,
  readOnly = false,
  onCheckboxChange,
  onDropdownChange,
  onMvpChange,
  companyName = "",
  showCompanyHeader = false,
  companyColor = "primary.main",
  emptyMessage = "No trooper data available",
}) => {
  // Calculate total XP for a trooper
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

  // Render editable or read-only rows based on mode
  const renderTrooperRow = (trooperResult, index) => {
    const trooperDetails = getTrooperById(trooperResult.trooper);

    if (readOnly) {
      // Read-only display (PostMission)
      return (
        <TableRow key={`${trooperResult.trooper}`}>
          <TableCell>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                src={trooperDetails?.resume?.logo}
                sx={{ width: 24, height: 24, mr: 1 }}
              />
              <Typography variant="body2">{trooperDetails.name}</Typography>
            </Box>
          </TableCell>
          <TableCell align="center">
            <Chip
              size="small"
              color="primary"
              label={`+${calculateTotalXp(trooperResult)} XP`}
            />
          </TableCell>
          <TableCell align="center">
            {trooperResult.objective === "success" ? (
              <Chip size="small" color="success" label="Success" />
            ) : trooperResult.objective === "attempt" ? (
              <Chip size="small" color="info" label="Attempt" />
            ) : (
              "—"
            )}
          </TableCell>
          <TableCell align="center">
            {trooperResult.aid ? <CheckCircleIcon color="success" /> : "—"}
          </TableCell>
          <TableCell align="center">
            {trooperResult.state ? <CheckCircleIcon color="success" /> : "—"}
          </TableCell>
          <TableCell align="center">
            {trooperResult.tag === "tag" ? (
              <Chip size="small" color="success" label="Tag" />
            ) : trooperResult.tag === "scan" ? (
              <Chip size="small" color="info" label="Scan" />
            ) : (
              "—"
            )}
          </TableCell>
          <TableCell align="center">
            {trooperResult.alive ? (
              <Chip size="small" color="success" label="Alive" />
            ) : (
              <Chip size="small" color="error" label="Unconscious" />
            )}
          </TableCell>
          <TableCell align="center">
            {trooperResult.mvp ? <MilitaryTechIcon color="warning" /> : "—"}
          </TableCell>
        </TableRow>
      );
    } else {
      // Editable mode (Mission)
      return (
        <TableRow key={trooperResult.trooper}>
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
              {calculateTotalXp(trooperResult)}
            </Typography>
          </TableCell>
          <TableCell align="center">
            <Checkbox
              checked={trooperResult.aid || false}
              onChange={() => onCheckboxChange(index, "aid")}
              disabled={readOnly}
            />
          </TableCell>
          <TableCell align="center">
            <Checkbox
              checked={trooperResult.state || false}
              onChange={() => onCheckboxChange(index, "state")}
              disabled={readOnly}
            />
          </TableCell>
          <TableCell align="center">
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={trooperResult.objective || ""}
                onChange={(e) =>
                  onDropdownChange(index, "objective", e.target.value)
                }
                disabled={readOnly}
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
                value={trooperResult.tag || ""}
                onChange={(e) => onDropdownChange(index, "tag", e.target.value)}
                disabled={readOnly}
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
              checked={trooperResult.alive || false}
              onChange={() => onCheckboxChange(index, "alive")}
              disabled={readOnly}
            />
          </TableCell>
          <TableCell align="center">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={trooperResult.injury || ""}
                onChange={(e) =>
                  onDropdownChange(index, "injury", e.target.value)
                }
                disabled={readOnly}
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
    }
  };

  // Table headers differ slightly between edit and read-only modes
  const getTableHeaders = () => {
    const baseHeaders = ["Trooper", "XP Gained"];

    if (readOnly) {
      return [
        ...baseHeaders,
        "Objective",
        "Aid",
        "State",
        "Tag",
        "Status",
        "MVP",
      ];
    } else {
      return [
        ...baseHeaders,
        "Aid",
        "State",
        "Objective",
        "Tag",
        "Alive",
        "Injury",
      ];
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      {showCompanyHeader && (
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            pb: 1,
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Avatar sx={{ width: 28, height: 28, bgcolor: companyColor }}>
            {companyName.charAt(0)}
          </Avatar>
          {companyName}
        </Typography>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {getTableHeaders().map((header) => (
                <TableCell
                  key={header}
                  align={header !== "Trooper" ? "center" : "left"}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {trooperResults.length > 0 ? (
              trooperResults.map((trooperResult, index) =>
                renderTrooperRow(trooperResult, index)
              )
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TrooperPerformanceTable;

import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Divider,
  Box,
} from "@mui/material";
import UnitDetails from "./UnitDetails";
import ProfileDetails from "./ProfileDetails";
import {
  mapType,
  renderCharLogos,
  mapCategory,
} from "../utils/metadataMapping";

const AddTrooperDialog = ({ open, onClose, units }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [filteredUnits, setFilteredUnits] = useState([]);
  const theme = useTheme();

  // Debounce search term update
  useEffect(() => {
    const timer = setTimeout(() => {
      setUnitFilter(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Preprocess and cache filtered units
  useEffect(() => {
    if (!units) {
      setFilteredUnits([]);
      return;
    }
    const processed = units
      // Map units: filter options for each profileGroup
      .map((unit) => ({
        ...unit,
        profileGroups: unit.profileGroups.map((group) => ({
          ...group,
          options: group.options.filter(
            (option) =>
              (option.swc === "0" || option.swc === "-") &&
              !option.skills.some((skill) => skill.id === 119)
          ),
        })),
      }))
      // Filter out units missing valid options, non-character resumes,
      // and those that do not match the ISC search term
      .filter(
        (unit) =>
          unit.profileGroups.every(
            (group) => group.options && group.options.length > 0
          ) &&
          unit.resume.category !== 10 &&
          unit.isc.toLowerCase().includes(unitFilter.toLowerCase()) &&
          !unit.slug.startsWith("merc-")
      )
      // Sort units by their resume type
      .sort((a, b) => a.resume.type - b.resume.type);
    setFilteredUnits(processed);
  }, [units, unitFilter]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Select a Trooper Unit</DialogTitle>
      {/* Filter box placed outside the scrollable DialogContent */}
      <div style={{ padding: "16px" }}>
        <TextField
          label="Filter by ISC"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </div>
      <DialogContent
        dividers
        sx={{
          maxHeight: "70vh",
          background: theme.palette.background.default,
          overflowY: "auto",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // Internet Explorer 10+
          "&::-webkit-scrollbar": { display: "none" }, // WebKit-based browsers
        }}
      >
        {filteredUnits.map((unit, unitIndex) => (
          <Accordion
            key={`unit-${unit.isc}-${unitIndex}`}
            sx={{ mb: 0.5 }}
            TransitionProps={{ unmountOnExit: true }}
          >
            <AccordionSummary
              expandIcon={
                <Typography color="white">
                  {mapType(unit.resume.type)}
                </Typography>
              }
              sx={{
                "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
                  transform: "none",
                },
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <img
                  src={unit.resume.logo}
                  alt={unit.isc}
                  style={{ height: 40, marginRight: 8 }}
                />
                <Typography>{unit.isc}</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              {unit.profileGroups.map((group, grpIndex) =>
                group.options.length > 0 ? (
                  <div
                    key={`group-${unit.isc}-${grpIndex}`}
                    style={{ marginBottom: 8 }}
                  >
                    {/* Dark neon blue category line */}
                    <Box
                      sx={{
                        backgroundColor: theme.palette.primary.dark, // using theme palette
                        color: theme.palette.common.white,
                        px: 1,
                        py: 0.5,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption">
                        {mapCategory(group.category)}
                      </Typography>
                    </Box>
                    {group.profiles && group.profiles[0] && (
                      <>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            border: "1px solid transparent", // to keep layout consistent
                          }}
                        >
                          <Typography variant="h6">
                            {group.profiles[0].name}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {renderCharLogos(group.profiles[0].chars)}
                          </Box>
                        </Box>
                        <UnitDetails profile={group.profiles[0]} />
                      </>
                    )}
                    {/* Existing header bar with three titles */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "inherit",
                        color: "white",
                        px: 2,
                        py: 1,
                        mt: 1,
                      }}
                    >
                      <Typography variant="body2">Name</Typography>
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Typography variant="body2">SWC</Typography>
                        <Typography variant="body2">PTS</Typography>
                      </Box>
                    </Box>
                    {/* Render options... */}
                    {group.options.map((option, optIndex) => (
                      <div key={`option-${group.isc}-${optIndex}`}>
                        <ProfileDetails option={option} />
                        <Divider />
                      </div>
                    ))}
                  </div>
                ) : null
              )}
              {unit.options && unit.options.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Typography variant="subtitle1">Unit Options</Typography>
                  {unit.options.map((option, idx) => (
                    <Typography
                      key={`unit-option-${unit.isc}-${idx}`}
                      variant="body2"
                    >
                      {option.name}
                    </Typography>
                  ))}
                </div>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default AddTrooperDialog;

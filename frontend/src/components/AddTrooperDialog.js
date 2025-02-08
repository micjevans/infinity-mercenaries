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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import UnitDetails from "./UnitDetails";
import ProfileDetails from "./ProfileDetails";
import { mapType } from "../utils/metadataMapping";

const AddTrooperDialog = ({ open, onClose, units }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      setUnitFilter(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
        style={{
          maxHeight: "70vh",
          background: theme.palette.background.default,
          overflowY: "auto",
        }}
      >
        {units
          // For each unit, filter each profileGroup's options to only those with swc === "0" and no lieutenant skill
          .map((unit) => ({
            ...unit,
            profileGroups: unit.profileGroups.map((group) => ({
              ...group,
              options: group.options.filter(
                (option) =>
                  option.swc === "0" &&
                  !option.skills.some((skill) => skill.id === 119)
              ),
            })),
          }))
          // Filter units by valid options, non-character resume, and ISC search term
          .filter((unit) => {
            return (
              unit.profileGroups.some(
                (group) => group.options && group.options.length > 0
              ) &&
              unit.resume.category !== 10 &&
              unit.isc.toLowerCase().includes(unitFilter.toLowerCase())
            );
          })
          .sort((a, b) => a.resume.type - b.resume.type)
          .map((unit, unitIndex) => (
            <Accordion key={`unit-${unit.isc}-${unitIndex}`}>
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
                  {unit.profileGroups &&
                    unit.profileGroups[0] &&
                    unit.profileGroups[0].profiles &&
                    unit.profileGroups[0].profiles[0] && (
                      <img
                        src={unit.profileGroups[0].profiles[0].logo}
                        alt={unit.isc}
                        style={{ width: 20, height: 20, marginRight: 8 }}
                      />
                    )}
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
                      <Typography variant="h6">{group.isc}</Typography>
                      {group.profiles && group.profiles[0] && (
                        <UnitDetails profile={group.profiles[0]} />
                      )}
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

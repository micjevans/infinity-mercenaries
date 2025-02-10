import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Dialog, DialogTitle, DialogContent, TextField } from "@mui/material";
import Trooper from "./Trooper";

const AddTrooperDialog = ({ open, onClose, units, onAddTrooper }) => {
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
          <Trooper
            key={unitIndex}
            trooper={unit}
            onClick={(group, option) => {
              const cleanedUpUnit = {
                ...unit,
                profileGroups: [
                  {
                    ...group,
                    category: 10,
                    profiles: group.profiles.map((profile) => ({
                      ...profile,
                      skills: option.skills
                        ? profile.skills.concat(option.skills)
                        : profile.skills,
                      equip: option.equip
                        ? profile.equip.concat(option.equip)
                        : profile.equip,
                      peripheral: option.peripheral
                        ? profile.peripheral.concat(option.peripheral)
                        : profile.peripheral,
                      weapons: option.weapons
                        ? profile.weapons.concat(option.weapons)
                        : profile.weapons,
                    })),
                    options: [
                      {
                        ...option,
                        skills: [],
                        equip: [],
                        peripheral: [],
                        weapons: [],
                      },
                    ],
                  },
                ],
              };
              console.log(cleanedUpUnit);
              onAddTrooper(cleanedUpUnit);
            }}
          />
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default AddTrooperDialog;

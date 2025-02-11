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
              // Filter out options with no SWC
              (option.swc === "0" || option.swc === "-") &&
              // Filter out LT options
              !option.skills.some((skill) => skill.id === 119)
          ),
        })),
      }))
      // After filtering once, go back through and remove unused peripheral options
      .map((unit) => ({
        ...unit,
        profileGroups: unit.profileGroups.map((group) => {
          // If the group isn't a peripheral then return as is
          if (
            !group.profiles.some((profile) =>
              profile.chars.some((char) => char === 27)
            )
          ) {
            return group;
          }
          // Otherwise, filter out peripherals that aren't used
          return {
            ...group,
            options: group.options.filter((option) =>
              unit.profileGroups.some((group) =>
                group.options.some((parentOption) =>
                  parentOption.includes.some(
                    (include) => include.option === option.id
                  )
                )
              )
            ),
          };
        }),
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
              const cleanUpUnit = (
                unitToClean,
                groupToClean,
                optionToClean
              ) => ({
                ...unitToClean,
                profileGroups: [
                  {
                    ...groupToClean,
                    category: 10,
                    profiles: groupToClean.profiles.map((profile) => ({
                      ...profile,
                      skills: optionToClean.skills
                        ? profile.skills.concat(optionToClean.skills)
                        : profile.skills,
                      equip: optionToClean.equip
                        ? profile.equip.concat(optionToClean.equip)
                        : profile.equip,
                      peripheral: optionToClean.peripheral
                        ? profile.peripheral.concat(optionToClean.peripheral)
                        : profile.peripheral,
                      weapons: optionToClean.weapons
                        ? profile.weapons.concat(optionToClean.weapons)
                        : profile.weapons,
                    })),
                    options: [
                      {
                        ...optionToClean,
                        skills: [],
                        equip: [],
                        peripheral: [],
                        weapons: [],
                        orders:
                          option.orders.length > 0
                            ? option.orders
                            : [
                                {
                                  type: "REGULAR",
                                  list: 1,
                                  total: 1,
                                },
                              ],
                      },
                    ],
                  },
                ],
              });
              onAddTrooper(cleanUpUnit(unit, group, option));

              option.includes.forEach((include) => {
                const includeGroup = unit.profileGroups.find(
                  (group) => group.id === include.group
                );
                const includeOption = includeGroup.options.find(
                  (option) => option.id === include.option
                );
                onAddTrooper(cleanUpUnit(unit, includeGroup, includeOption));
              });
            }}
          />
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default AddTrooperDialog;

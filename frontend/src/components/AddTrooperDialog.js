import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import Trooper from "./Trooper";
import SpecOpsForm from "./SpecOpsForm";
import { produce } from "immer";
import { addItemToTrooper } from "../utils/trooperUtils";

const AddTrooperDialog = ({
  open,
  onClose,
  units,
  isCreatingCaptain,
  specops = { weapons: [], skills: [], equip: [] }, // Default empty arrays
  onAddTrooper,
  isLocal = true, // Add isLocal prop with default value
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [ogFilteredUnits, setOgFilteredUnits] = useState([]);
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
      setOgFilteredUnits([]);
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
              // Filter out options that cost SWC
              (option.swc === "0" ||
                option.swc === "-" ||
                option.swc.includes("+")) &&
              // Filter out LT options if not creating a captain
              option.skills.some((skill) => skill.id === 119) ===
                isCreatingCaptain
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
    setOgFilteredUnits(processed);
  }, [units, unitFilter, isCreatingCaptain]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {isCreatingCaptain ? "Create Captain" : "Select a Trooper Unit"}
        {isLocal && (
          <Typography
            variant="caption"
            color="text.secondary"
            style={{ display: "block", marginTop: 4 }}
          >
            This trooper will be stored locally on your device.
          </Typography>
        )}
      </DialogTitle>
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
                perks: [], // Reset perks to avoid duplicates
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
                // Add local flag to trooper if company is local
                ...(isLocal && { local: true }),
                xp: 0,
              });
              const cleanedUnit = cleanUpUnit(unit, group, option);
              if (
                isCreatingCaptain &&
                cleanedUnit.profileGroups[0].options[0].points >= 28
              ) {
                // If creating a captain and no config is needed, send to be added
                cleanedUnit.captain = true;
              }
              if (!isCreatingCaptain || cleanedUnit.captain) {
                (unit.perks || []).forEach((perk) => {
                  addItemToTrooper(cleanedUnit, perk, perk.key); // Add perks to the cleaned unit
                });
                onAddTrooper(cleanedUnit);
                return;
              }

              setFilteredUnits((currentUnits) =>
                currentUnits.map((currentUnit, i) =>
                  i === unitIndex
                    ? {
                        ...cleanedUnit,
                        captain: true,
                      }
                    : currentUnit
                )
              );
            }}
          >
            {/* Replace HelloWorld with the new SpecOpsForm component */}
            {unit.captain && (
              <SpecOpsForm
                editUnit={(key, val) => {
                  setFilteredUnits((currentUnits) =>
                    produce(currentUnits, (draft) => {
                      if (val) {
                        draft[unitIndex].profileGroups[0].profiles[0][key] =
                          val;
                      } else {
                        draft[unitIndex].perks = key;
                      }
                    })
                  );
                }}
                profile={
                  ogFilteredUnits[unitIndex].profileGroups[0].profiles[0]
                }
                xp={28 - unit.profileGroups[0].options[0].points}
                specops={specops}
              />
            )}
          </Trooper>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTrooperDialog;

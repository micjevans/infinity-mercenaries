import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import metadata from "../data/factions/metadata";

// Helper function to get background color based on value
const getRangeCellBg = (val, theme) => {
  const num = Number(val);
  if (val === "" || val == null) return theme.palette.grey[600];
  if (num === -3 || num === -6) return theme.palette.error.main;
  if (num === 0) return theme.palette.info.main;
  if (num === 3 || num === 6) return theme.palette.success.main;
  return undefined;
};

const MapWeapon = ({ weaponProfiles }) => {
  const theme = useTheme();

  const renderWeaponRanges = (distance) => {
    const order = ["short", "med", "long", "max"];
    let start = 0;

    return order.flatMap((key) => {
      const entry = distance[key];

      // Skip if key is missing or null
      if (!entry || entry.max == null || entry.mod == null) return [];

      const { max, mod } = entry;
      const cells = [];

      while (start < max) {
        const end = Math.min(start + 20, max);
        cells.push(
          <TableCell
            key={`${start}-${end}`}
            align="center"
            sx={{
              paddingTop: "2px",
              fontSize: "0.8rem",
              width: 1 / 7,
              backgroundColor: getRangeCellBg(mod, theme),
              color: "black",
              fontWeight: "bold",
            }}
          >
            {mod}
          </TableCell>
        );
        start = end;
      }

      return cells;
    });
  };

  const weaponProfilesWithRanges = weaponProfiles.map((weapon) => {
    let rangeCells = null;
    if (weapon.distance && typeof weapon.distance === "object") {
      rangeCells = renderWeaponRanges(weapon.distance);
      // Add empty cells if rangeCells has less than 7 cells
      if (rangeCells.length < 7) {
        for (let i = rangeCells.length; i < 7; i++) {
          rangeCells.push(
            <TableCell
              key={`empty-${i}`}
              align="center"
              sx={{
                padding: "2px 4px",
                width: `${100 / 7}%`,
                backgroundColor: getRangeCellBg("", theme),
              }}
            />
          );
        }
      }
    }
    return {
      ...weapon,
      rangeCells: rangeCells,
    };
  });

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ width: "100%" }}>
      <Table size="small" sx={{ width: "100%" }}>
        <TableBody>
          {/* Weapon Stats Section */}
          <TableRow>
            <TableCell colSpan={7} sx={{ fontWeight: "bold", borderBottom: 1 }}>
              {weaponProfiles[0].name}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell
              key={"Mode"}
              align="center"
              colSpan={2}
              sx={{
                padding: "2px 4px",
              }}
            >
              {"Mode"}
            </TableCell>
            {["PS", "B", "Ammo", "SR:Attrib", "SR: No."].map((label) => (
              <TableCell
                key={label}
                align="center"
                sx={{
                  padding: "2px 4px",
                }}
              >
                {label}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            {weaponProfilesWithRanges.some(
              (profile) => profile.rangeCells && profile.rangeCells.length
            ) &&
              ['8"', '16"', '24"', '32"', '40"', '48"', '96"'].map(
                (dist, index) => (
                  <TableCell
                    key={index}
                    align="center"
                    sx={{ padding: "2px 4px" }}
                  >
                    {dist}
                  </TableCell>
                )
              )}
          </TableRow>
          {weaponProfilesWithRanges.map((weapon) => (
            <>
              <TableRow sx={{ backgroundColor: theme.palette.grey[200] }}>
                <TableCell
                  key={weapon.mode}
                  align="center"
                  colSpan={2}
                  sx={{
                    padding: "2px 4px",
                    borderBottom: "none",
                    color: "black",
                  }}
                >
                  {weapon.mode || "-"}
                </TableCell>
                {[
                  weapon.damage,
                  weapon.burst,
                  metadata["ammunitions"].find(
                    (e) => e.id === weapon.ammunition
                  )?.name,
                  weapon.saving,
                  weapon.savingNum,
                ].map((value, index) => (
                  <TableCell
                    key={index}
                    align="center"
                    sx={{
                      padding: "2px 4px",
                      borderBottom: "none",
                      color: "black",
                    }}
                  >
                    {value}
                  </TableCell>
                ))}
              </TableRow>
              {weapon.properties && (
                <TableRow sx={{ backgroundColor: theme.palette.grey[200] }}>
                  <TableCell colSpan={7} sx={{ color: "black" }}>
                    {weapon.properties.length
                      ? `Traits: ${weapon.properties.join(", ")}`
                      : null}
                  </TableCell>
                </TableRow>
              )}
              {/* Range Details Section */}
              {weapon.rangeCells && (
                <>
                  <TableRow>{weapon.rangeCells}</TableRow>
                </>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MapWeapon;

import React, { useRef, useState } from "react";
import {
  Popover,
  Typography,
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

const MapImage = ({
  item,
  metaKey,
  action = () => {},
  width = 50,
  height = 50,
  style = {},
  alt = "",
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [clicked, setClicked] = useState(null);
  const clickTimeout = useRef(null);
  const delay = 300; // milliseconds

  const found = metadata[metaKey].find((e) => e.id === item);
  if (!found) return null;

  const img = found.img;
  const name = found.name || item;

  const handleMouseEnter = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMouseLeave = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

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

  // Render weapon details using MUI Table components
  const renderWeaponDetails = () => {
    // Prepare range values, if any.
    let rangeCells = null;
    if (found.distance && typeof found.distance === "object") {
      rangeCells = renderWeaponRanges(found.distance);
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

    return (
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ width: "100%" }}
      >
        <Table size="small" sx={{ width: "100%" }}>
          <TableBody>
            {/* Weapon Stats Section */}
            <TableRow>
              <TableCell
                colSpan={7}
                sx={{ fontWeight: "bold", borderBottom: 1 }}
              >
                {found.name} {found.mode ? `(${found.mode})` : ""}
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
              {rangeCells &&
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
            <TableRow sx={{ backgroundColor: theme.palette.grey[200] }}>
              <TableCell
                key={found.mode}
                align="center"
                colSpan={2}
                sx={{
                  padding: "2px 4px",
                  borderBottom: "none",
                  color: "black",
                }}
              >
                {found.mode || "-"}
              </TableCell>
              {[
                found.damage,
                found.burst,
                found.ammunition,
                found.saving,
                found.savingNum,
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
            {found.properties && (
              <TableRow sx={{ backgroundColor: theme.palette.grey[200] }}>
                <TableCell colSpan={7} sx={{ color: "black" }}>
                  {found.properties.length
                    ? `Traits: ${found.properties.join(", ")}`
                    : null}
                </TableCell>
              </TableRow>
            )}
            {/* Range Details Section */}
            {rangeCells && (
              <>
                <TableRow>{rangeCells}</TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderDefaultContent = () => (
    <Typography sx={{ p: 1 }}>{name}</Typography>
  );

  const content =
    metaKey === "weapons" ? renderWeaponDetails() : renderDefaultContent();

  return (
    <>
      <img
        src={img}
        alt={alt || name}
        width={width}
        height={height}
        style={{ ...style, cursor: "pointer" }}
        onClick={(event) => {
          if (clickTimeout.current !== null) {
            // Second click: clear the pending single click timeout.
            clearTimeout(clickTimeout.current);
            clickTimeout.current = null;
            action(item);
          } else {
            // First click: set a timeout to determine if it’s a single click.
            clickTimeout.current = setTimeout(() => {
              if (event.target) setAnchorEl(event.target);
              setClicked(true);
              clickTimeout.current = null;
            }, delay);
          }
        }}
        onMouseEnter={clicked ? undefined : handleMouseEnter}
        onMouseLeave={clicked ? undefined : handleMouseLeave}
      />
      <Popover
        open={open}
        sx={clicked ? undefined : { pointerEvents: "none" }}
        anchorEl={anchorEl}
        onClose={(event) => {
          setClicked(false);
          handleMouseLeave(event);
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        disableRestoreFocus
      >
        {content}
      </Popover>
    </>
  );
};

export default MapImage;

import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import MapDetails from "./MapDetails";
import { renderOrderIcons } from "../utils/metadataMapping";

const ProfileDetails = ({ option }) => {
  const theme = useTheme();
  if (!option) return null;

  const { name, skills, weapons, equip, swc, points, peripheral, orders } =
    option;

  return (
    <Box
      mb={1}
      sx={{
        backgroundColor: theme.palette.grey[300],
        color: "black",
        pt: 1,
        pb: 1,
        pl: 2,
        pr: 0, // Removed right padding
        m: 0,
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      {/* Orders icons column */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          mr: 2,
          ml: 0,
          height: "100%",
          alignSelf: "center",
        }}
      >
        {renderOrderIcons(orders)}
      </Box>
      {/* Main details */}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body1"
          color="inherit"
          sx={{ display: "inline-flex", alignItems: "center" }}
        >
          {name}
          <Box sx={{ ml: 1 }}>
            <MapDetails
              list={skills}
              metaKey="skills"
              preText="("
              postText=")"
            />
          </Box>
        </Typography>
        <MapDetails list={weapons} metaKey="weapons" preText="Weapons: " />
        <MapDetails list={equip} metaKey="equips" preText="Equipment: " />
        <MapDetails
          list={peripheral}
          metaKey="peripheral"
          preText="Peripherals: "
        />
      </Box>
      {/* SWC and Points */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          ml: 2,
          gap: 2,
          minWidth: 60,
        }}
      >
        <Typography variant="body2" color="inherit">
          {swc}
        </Typography>
        <Typography variant="body2" color="inherit">
          {points}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfileDetails;

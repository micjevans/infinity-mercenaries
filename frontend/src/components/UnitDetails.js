import React from "react";
import { Box, useTheme } from "@mui/material";
import { renderStat } from "../utils/metadataMapping";
import MapDetails from "./MapDetails";

const UnitDetails = ({ profile }) => {
  const { move, cc, bs, ph, wip, arm, bts, w, s, ava } = profile;
  const theme = useTheme();

  return (
    <Box
      mb={2}
      sx={{
        backgroundColor: theme.palette.grey[300],
        color: "black",
        pt: 1,
        pb: 1,
        px: 3,
        m: 0,
        width: "100%",
      }}
    >
      {/* Stat Titles Row */}
      <Box display="flex" justifyContent="space-between" fontWeight="bold">
        <span>MOV</span>
        <span>CC</span>
        <span>BS</span>
        <span>PH</span>
        <span>WIP</span>
        <span>ARM</span>
        <span>BTS</span>
        <span>W</span>
        <span>S</span>
        <span>AVA</span>
      </Box>
      {/* Divider */}
      <Box my={1} width="100%">
        <hr style={{ border: "none", borderTop: "1px solid #ccc" }} />
      </Box>
      {/* Stat Values Row */}
      <Box display="flex" justifyContent="space-between">
        <span>{renderStat(move)}</span>
        <span>{renderStat(cc)}</span>
        <span>{renderStat(bs)}</span>
        <span>{renderStat(ph)}</span>
        <span>{renderStat(wip)}</span>
        <span>{renderStat(arm)}</span>
        <span>{renderStat(bts)}</span>
        <span>{renderStat(w)}</span>
        <span>{renderStat(s)}</span>
        <span>{renderStat(ava)}</span>
      </Box>
      {/* Weapons Row */}
      <MapDetails
        list={profile.weapons}
        metaKey="weapons"
        preText="Weapons: "
      />
      {/* Equipment Row */}
      <MapDetails
        list={profile.equips}
        metaKey="equips"
        preText="Equipment: "
      />
      {/* Peripherals Row */}
      <MapDetails
        list={profile.peripherals}
        metaKey="peripheral"
        preText="Peripherals: "
      />
      {/* Skills Row */}
      <MapDetails list={profile.skills} metaKey="skills" preText="Skills: " />
    </Box>
  );
};

export default UnitDetails;

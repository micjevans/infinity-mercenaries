import React from "react";
import { Box, Typography } from "@mui/material";
import { renderStat, mapEquip, mapSkill } from "../utils/metadataMapping";

const UnitDetails = ({ profile }) => {
  const { move, cc, bs, ph, wip, arm, bts, w, s, ava, equip, skills } = profile;

  return (
    <Box mb={2}>
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
      {/* Equipment Row */}
      {equip && equip.length > 0 && (
        <Box mt={1}>
          <Typography variant="subtitle2">Equipment:</Typography>
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{
              __html: equip.map(mapEquip).join(", "),
            }}
          />
        </Box>
      )}
      {/* Skills Row */}
      {skills && skills.length > 0 && (
        <Box mt={1}>
          <Typography variant="subtitle2">Skills:</Typography>
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{
              __html: skills.map(mapSkill).join(", "),
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default UnitDetails;

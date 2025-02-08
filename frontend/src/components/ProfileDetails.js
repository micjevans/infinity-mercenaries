import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { mapSkill, mapWeapon, mapEquip } from "../utils/metadataMapping";

const ProfileDetails = ({ option }) => {
  const theme = useTheme();

  if (!option) return null;

  const { name, skills, weapons, equip } = option;
  const skillsHtml =
    skills && skills.length > 0 ? skills.map(mapSkill).join(", ") : "";
  const weaponsHtml =
    weapons && weapons.length > 0 ? weapons.map(mapWeapon).join(", ") : "";
  const equipHtml =
    equip && equip.length > 0 ? equip.map(mapEquip).join(", ") : "";

  return (
    <Box
      mb={1}
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
      <Typography variant="body1" color="inherit">
        {name}
        {skillsHtml && (
          <span style={{ marginLeft: 8, color: "inherit" }}>
            {" ("}
            <span dangerouslySetInnerHTML={{ __html: skillsHtml }} />
            {")"}
          </span>
        )}
      </Typography>

      {weaponsHtml && (
        <Typography
          variant="body2"
          color="inherit"
          dangerouslySetInnerHTML={{ __html: weaponsHtml }}
        />
      )}
      {equipHtml && (
        <Typography
          variant="body2"
          color="inherit"
          dangerouslySetInnerHTML={{ __html: `Equipment: ${equipHtml}` }}
        />
      )}
    </Box>
  );
};

export default ProfileDetails;

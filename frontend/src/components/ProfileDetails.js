import React from "react";
import { Box, Typography } from "@mui/material";
import { mapSkill, mapWeapon, mapEquip } from "../utils/metadataMapping";

const ProfileDetails = ({ option }) => {
  if (!option) return null;

  const { name, skills, weapons, equip } = option;
  const skillsHtml =
    skills && skills.length > 0 ? skills.map(mapSkill).join(", ") : "";
  const weaponsHtml =
    weapons && weapons.length > 0 ? weapons.map(mapWeapon).join(", ") : "";
  const equipHtml =
    equip && equip.length > 0 ? equip.map(mapEquip).join(", ") : "";

  return (
    <Box mb={1}>
      <Typography variant="body1">{name}</Typography>
      {skillsHtml && (
        <Typography
          variant="body2"
          dangerouslySetInnerHTML={{ __html: skillsHtml }}
        />
      )}
      {weaponsHtml && (
        <Typography
          variant="body2"
          dangerouslySetInnerHTML={{ __html: `Weapons: ${weaponsHtml}` }}
        />
      )}
      {equipHtml && (
        <Typography
          variant="body2"
          dangerouslySetInnerHTML={{ __html: `Equipment: ${equipHtml}` }}
        />
      )}
    </Box>
  );
};

export default ProfileDetails;

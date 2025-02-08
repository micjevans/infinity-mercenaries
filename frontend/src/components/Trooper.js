import React, { useState } from "react";
import { Box, Typography, TextField, Grid2, Divider } from "@mui/material";
import SkillSelect from "./SkillSelect";

const TrooperProfile = ({ initialTrooper, onUpdate }) => {
  const [trooper, setTrooper] = useState(initialTrooper);
  const [skills, setSkills] = useState([]);
  const [equipment, setEquipment] = useState([]);

  const handleChange = (field, value) => {
    const updatedTrooper = { ...trooper, [field]: value };
    setTrooper(updatedTrooper);
    onUpdate(updatedTrooper);
  };

  const handleSkillChange = (newSkills) => {
    if (Array.isArray(newSkills)) {
      setSkills(newSkills);
    }
  };

  const handleEquipmentChange = (newEquipment) => {
    if (Array.isArray(newEquipment)) {
      setEquipment(newEquipment);
    }
  };

  return (
    <Box
      sx={{
        border: "1px solid #333",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#1E1E1E",
        color: "#FFFFFF",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Profile Header */}
      <Typography
        variant="h6"
        style={{ color: "#FFFFFF", marginBottom: "16px" }}
      >
        {trooper.name || "Trooper Name"}
      </Typography>

      {/* Attribute Titles */}
      <Grid2 container spacing={2} alignItems="center">
        <Grid2 key={"mov"} size={2}>
          <Typography variant="subtitle2" align="center">
            MOV
          </Typography>
        </Grid2>
        {["CC", "BS", "PH", "WIP", "ARM", "BTS", "VITA", "S"].map(
          (attr, index) => (
            <Grid2 key={index} size={1}>
              <Typography variant="subtitle2" align="center">
                {attr}
              </Typography>
            </Grid2>
          )
        )}
      </Grid2>

      {/* Divider Line */}
      <Divider style={{ backgroundColor: "#444", margin: "8px 0" }} />

      {/* Attribute Values */}
      <Grid2 container spacing={2} alignItems="center">
        <Grid2 size={2}>
          <Grid2 container>
            <Grid2 size={5}>
              <TextField
                value={trooper["mov1"]}
                onChange={(e) => handleChange("mov1", e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
              />
            </Grid2>
            <Grid2 size={2}>
              <Typography variant="subtitle2" align="center">
                -
              </Typography>
            </Grid2>
            <Grid2 size={5}>
              <TextField
                value={trooper["mov2"]}
                onChange={(e) => handleChange("mov2", e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
              />
            </Grid2>
          </Grid2>
        </Grid2>
        {["cc", "bs", "ph", "wip", "arm", "bts", "vita", "s"].map(
          (field, index) => (
            <Grid2 key={index} size={1}>
              <TextField
                value={trooper[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
              />
            </Grid2>
          )
        )}
      </Grid2>
      {/* Equipment and Skills */}
      <Typography variant="subtitle2">Equipment</Typography>
      <Grid2 xs={12}>
        <SkillSelect value={equipment} onChange={handleEquipmentChange} />
      </Grid2>
      <Typography variant="subtitle2">Skills</Typography>
      <Grid2 xs={12}>
        <SkillSelect value={skills} onChange={handleSkillChange} />
      </Grid2>

      {/* Divider Line */}
      <Divider style={{ backgroundColor: "#444", margin: "8px 0" }} />
    </Box>
  );
};

export default TrooperProfile;

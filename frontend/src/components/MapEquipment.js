import React from "react";
import { Typography } from "@mui/material";

const MapEquipment = ({ equipment }) => {
  return (
    <div>
      <Typography variant="h6" align="center" gutterBottom>
        {equipment.name}
      </Typography>
      {equipment.wiki ? (
        <iframe
          src={equipment.wiki}
          width="500px"
          height="500px"
          style={{ border: "none" }}
          title={equipment.name}
        ></iframe>
      ) : (
        <Typography variant="body1">{equipment.name}</Typography>
      )}
    </div>
  );
};

export default MapEquipment;

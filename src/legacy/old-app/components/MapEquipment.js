import React, { useEffect, useState } from "react";
import { Typography, CircularProgress } from "@mui/material";
import { getEquipment } from "../services/firebaseService";

const MapEquipment = ({ equipmentId }) => {
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const response = await getEquipment(equipmentId);
        if (response.success) {
          setEquipment(response.data);
        } else {
          setError(response.error || "Failed to fetch equipment");
        }
      } catch (err) {
        setError("Error fetching equipment data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (equipmentId) {
      fetchEquipment();
    }
  }, [equipmentId]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!equipment) return <Typography>No equipment found</Typography>;

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
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

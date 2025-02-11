import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material";
import silhouette from "../assets/images/silhouette.png"; // import the image

const slotStyles = {
  position: "absolute",
  border: "2px dashed rgba(0,0,0,0.3)",
  borderRadius: 2,
  cursor: "pointer",
  bgcolor: "rgba(255, 255, 255, 0.3)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const EditTrooperDialog = ({
  open,
  onClose,
  trooper,
  companyInventory,
  onSelectEquipment,
}) => {
  const handleSlotClick = (slot) => {
    if (onSelectEquipment) {
      onSelectEquipment(slot);
    } else {
      console.log(`Select equipment for slot: ${slot}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Trooper - Inventory</DialogTitle>
      <DialogContent dividers sx={{ position: "relative", height: 500 }}>
        {/* Trooper Silhouette as background */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: `url(${silhouette}) no-repeat center`,
            backgroundSize: "contain",
            opacity: 0.3,
          }}
        />
        {/* Equipment Slots */}
        {/* Accessory Slot */}
        <Box
          sx={{
            ...slotStyles,
            top: "5%",
            left: "51%",
            transform: "translateX(-50%)",
            width: 60,
            height: 60,
          }}
          onClick={() => handleSlotClick("accessory")}
        >
          <Typography variant="caption">Accessory</Typography>
        </Box>
        {/* Armor Slot */}
        <Box
          sx={{
            ...slotStyles,
            top: "35%",
            left: "51%",
            transform: "translateX(-50%)",
            width: 100,
            height: 100,
          }}
          onClick={() => handleSlotClick("armor")}
        >
          <Typography variant="caption">Armor</Typography>
        </Box>
        {/* Right Arm Slot */}
        <Box
          sx={{
            ...slotStyles,
            top: "25%",
            left: "40%",
            transform: "translateX(-50%)",
            width: 60,
            height: 200,
          }}
          onClick={() => handleSlotClick("primary")}
        >
          <Typography variant="caption">Primary</Typography>
        </Box>
        {/* Left Arm Slot */}
        <Box
          sx={{
            ...slotStyles,
            top: "25%",
            right: "32%",
            transform: "translateX(-50%)",
            width: 60,
            height: 120,
          }}
          onClick={() => handleSlotClick("secondary")}
        >
          <Typography variant="caption">Secondary</Typography>
        </Box>
        {/* Leg Slot */}
        <Box
          sx={{
            ...slotStyles,
            top: "50%",
            right: "32%",
            transform: "translateX(-50%)",
            width: 60,
            height: 75,
          }}
          onClick={() => handleSlotClick("sidearm")}
        >
          <Typography variant="caption">Sidearm</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={onClose} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTrooperDialog;

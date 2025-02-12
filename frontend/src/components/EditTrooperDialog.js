import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Popover,
} from "@mui/material";
import MapItem from "./MapItem"; // Import MapItem component
import silhouette from "../assets/images/silhouette.png"; // Ensure the correct path
import TrooperSlot from "./TrooperSlot";
import { mapItemData } from "../utils/metadataMapping";

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
  trooperToEdit,
  companyInventory,
  saveChanges,
}) => {
  // State for Popover handling
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [trooper, setTrooper] = useState(trooperToEdit);
  const handleSlotClick = (slot, event) => {
    // Only open popover if the slot is empty (for simplicity, assume trooper[slot] is undefined)
    // Adjust according to how equipment is stored on your trooper object.
    if (!trooper.equipment || !trooper.equipment[slot]) {
      setSelectedSlot(slot);
      setAnchorEl(event.currentTarget);
    }
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setSelectedSlot(null);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Trooper - Inventory</DialogTitle>
      <DialogContent dividers sx={{ position: "relative", height: 500 }}>
        <>
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
          {/* Accessory Slot */}
          <TrooperSlot
            slot="accessory"
            trooper={trooper}
            handleSlotClick={handleSlotClick}
            style={{
              ...slotStyles,
              top: "5%",
              left: "51%",
              transform: "translateX(-50%)",
              width: 60,
              height: 60,
            }}
          />
          {/* Armor Slot */}
          <TrooperSlot
            slot="armor"
            trooper={trooper}
            handleSlotClick={handleSlotClick}
            style={{
              ...slotStyles,
              top: "35%",
              left: "51%",
              transform: "translateX(-50%)",
              width: 100,
              height: 100,
            }}
          />
          {/* Primary Slot */}
          <TrooperSlot
            slot="primary"
            trooper={trooper}
            handleSlotClick={handleSlotClick}
            style={{
              top: "25%",
              left: "40%",
              transform: "translateX(-50%)",
              width: 60,
              height: 200,
            }}
          />
          {/* Secondary Slot */}
          <TrooperSlot
            slot="secondary"
            trooper={trooper}
            handleSlotClick={handleSlotClick}
            style={{
              top: "25%",
              right: "32%",
              transform: "translateX(-50%)",
              width: 60,
              height: 120,
            }}
          />
          {/* Sidearm Slot */}
          <TrooperSlot
            slot="sidearm"
            trooper={trooper}
            handleSlotClick={handleSlotClick}
            style={{
              top: "50%",
              right: "32%",
              transform: "translateX(-50%)",
              width: 60,
              height: 75,
            }}
          />
          {/* Equipment Popover */}
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            transformOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Box sx={{ p: 2, display: "flex", flexWrap: "wrap", gap: 2 }}>
              {(() => {
                const filteredInventory = companyInventory
                  .filter(
                    (item) =>
                      mapItemData(item).filter(
                        (itemData) => itemData.slot === selectedSlot
                      ).length
                  )
                  .map((item) => (
                    <MapItem
                      item={item}
                      width={40}
                      height={40}
                      style={{ cursor: "pointer" }}
                      alt={item.name}
                      action={(itemData) => {
                        setTrooper({
                          ...trooper,
                          [selectedSlot]: itemData,
                        });
                        handlePopoverClose();
                      }}
                    />
                  ));

                return filteredInventory.length ? (
                  filteredInventory
                ) : (
                  <Typography>No items available</Typography>
                );
              })()}
            </Box>
          </Popover>
        </>
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

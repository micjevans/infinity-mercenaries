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
  Tabs,
  Tab,
} from "@mui/material";
import MapItem from "./MapItem"; // Import MapItem component
import silhouette from "../assets/images/silhouette.png"; // Ensure the correct path
import TrooperSlot from "./TrooperSlot";
import { mapItemData } from "../utils/metadataMapping";
import PerkTree from "./PerkTree"; // NEW: Import the new component

const perkStyles = {
  position: "absolute",
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const slotStyles = {
  ...perkStyles,
  border: "2px dashed rgba(0,0,0,0.3)",
  borderRadius: 2,
  bgcolor: "rgba(255, 255, 255, 0.3)",
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
  const [currentInventory, setCurrentInventory] = useState(companyInventory);
  // NEW: State for tab selection: 0 => Equipment, 1 => Perks
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPerkTree, setSelectedPerkTree] = useState(null);
  const handleTabChange = (event, newValue) => setSelectedTab(newValue);

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

  // NEW: handler for when a perk button is clicked
  const handlePerkButtonClick = (perkName) => {
    // Set the selected perk so that we render the perk tree view
    setSelectedPerkTree(perkName);
  };

  // Unified function to handle equipment changes
  const handleEquipmentChange = (slot, item) => {
    // Return current item to inventory if it exists
    if (trooper[slot] && trooper[slot].uuid) {
      setCurrentInventory((prev) => [...prev, trooper[slot]]);
    }

    // Set the new item or null if unequipping
    setTrooper((prev) => ({
      ...prev,
      [slot]: item, // Will be null when unequipping
    }));

    // If equipping a new item, remove it from the inventory
    if (item) {
      setCurrentInventory((prev) => prev.filter((i) => i.uuid !== item.uuid));
    }
  };

  // Function to handle unequipping an item
  const handleUnequipItem = () => {
    if (selectedSlot && trooper[selectedSlot]) {
      handleEquipmentChange(selectedSlot, null);
    }
    handlePopoverClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Equipment" />
          <Tab label="Perks" />
        </Tabs>
      </DialogTitle>
      <DialogContent dividers sx={{ position: "relative", height: 500 }}>
        {selectedPerkTree ? (
          // Render the perk tree view if a perk is selected
          <PerkTree
            trooper={trooper}
            perk={selectedPerkTree}
            setTrooper={setTrooper}
            onBack={() => setSelectedPerkTree(null)}
          />
        ) : (
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
            {selectedTab === 0 && (
              <>
                {/* Existing Equipment Content */}
                <Box sx={{ mt: 2 }}>
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
                    <Box
                      sx={{
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      {/* Add a "None" option at the top */}
                      <Button
                        variant="outlined"
                        onClick={handleUnequipItem}
                        sx={{ mb: 1 }}
                      >
                        None (Unequip)
                      </Button>

                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                        {(() => {
                          const filteredInventory = currentInventory
                            .filter(
                              (item) =>
                                mapItemData(item).filter(
                                  (itemData) => itemData.slot === selectedSlot
                                ).length
                            )
                            .map((item) => (
                              <MapItem
                                key={item.uuid}
                                item={item}
                                width={40}
                                height={40}
                                style={{ cursor: "pointer" }}
                                alt={item.name}
                                action={(itemData) => {
                                  handleEquipmentChange(selectedSlot, itemData);
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
                    </Box>
                  </Popover>
                </Box>
              </>
            )}
            {selectedTab === 1 && !selectedPerkTree && (
              // Perks tab content: Perk buttons layout in two columns
              <Box sx={{ mt: 2 }}>
                <Button
                  key="intelligence-button"
                  style={{
                    ...perkStyles,
                    top: "5%",
                    left: "51%",
                    transform: "translateX(-50%)",
                    height: 60,
                    width: 110,
                  }}
                  onClick={() => handlePerkButtonClick("intelligence")}
                  variant="outlined"
                >
                  Intelligence
                </Button>
                <Button
                  key="empathy-button"
                  style={{
                    ...perkStyles,
                    top: "20%",
                    left: "51%",
                    transform: "translateX(-50%)",
                    height: 60,
                    width: 110,
                  }}
                  onClick={() => handlePerkButtonClick("empathy")}
                  variant="outlined"
                >
                  Empathy
                </Button>
                <Button
                  key="body-button"
                  style={{
                    ...perkStyles,
                    top: "35%",
                    left: "51%",
                    transform: "translateX(-50%)",
                    height: 60,
                    width: 110,
                  }}
                  onClick={() => handlePerkButtonClick("body")}
                  variant="outlined"
                >
                  Body
                </Button>
                <Button
                  key="reflex-button"
                  style={{
                    ...perkStyles,
                    top: "25%",
                    left: "40%",
                    transform: "translateX(-50%)",
                    height: 200,
                    width: 60,
                  }}
                  onClick={() => handlePerkButtonClick("reflex")}
                  variant="outlined"
                >
                  Reflex
                </Button>
                <Button
                  key="cool-button"
                  style={{
                    ...perkStyles,
                    top: "25%",
                    left: "62%",
                    transform: "translateX(-50%)",
                    height: 200,
                    width: 60,
                  }}
                  onClick={() => handlePerkButtonClick("cool")}
                  variant="outlined"
                >
                  Cool
                </Button>
                <Button
                  key="initiative-button"
                  style={{
                    ...perkStyles,
                    top: "50%",
                    left: "51%",
                    transform: "translateX(-50%)",
                    height: 60,
                    width: 110,
                  }}
                  onClick={() => handlePerkButtonClick("initiative")}
                  variant="outlined"
                >
                  Initiative
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={() => {
            // Create cleaned copy of trooper with nulls instead of undefined
            const cleanedTrooper = { ...trooper };
            [
              "primary",
              "secondary",
              "sidearm",
              "accessory",
              "armor",
              "augment",
            ].forEach((slot) => {
              if (cleanedTrooper[slot] === undefined) {
                cleanedTrooper[slot] = null;
              }
            });

            saveChanges(cleanedTrooper, currentInventory);
            onClose();
          }}
          variant="contained"
          color="primary"
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTrooperDialog;

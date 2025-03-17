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
  LinearProgress,
  Tooltip,
  Chip,
  Divider,
  TextField,
} from "@mui/material";
import MapItem from "./MapItem"; // Import MapItem component
import silhouette from "../assets/images/silhouette.png"; // Ensure the correct path
import TrooperSlot from "./TrooperSlot";
import { mapItemData } from "../utils/metadataMapping";
import PerkTree from "./PerkTree"; // NEW: Import the new component
import StarIcon from "@mui/icons-material/Star";
import ExtensionIcon from "@mui/icons-material/Extension";
import {
  calculateLevel,
  calculateLevelProgress,
  calculatePerkPoints,
  calculateXpForLevel,
} from "../utils/experienceUtils";

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
  isLocal = false, // Default to false if not provided
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

  const xp = trooper.xp || 0;
  const level = calculateLevel(xp);
  const xpForNextLevel = calculateXpForLevel(level + 1);
  const xpProgress = calculateLevelProgress(xp, level);
  const availablePerkPoints = calculatePerkPoints(
    level,
    trooper.usedPerkPoints || 0
  );

  // Add handler for XP changes (only for local troopers)
  const handleXpChange = (e) => {
    const newValue = parseInt(e.target.value) || 0;
    setTrooper((prev) => ({
      ...prev,
      xp: newValue,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      {/* Add XP and Level Header Section */}
      <Box sx={{ px: 3, pt: 2, pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="h6">
            {trooper.name || trooper.isc || "Trooper"}
          </Typography>
          <Chip label={`Level ${level}`} color="primary" icon={<StarIcon />} />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            mb: 1,
            gap: 2,
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              {/* Conditionally render editable XP for local troopers */}
              {isLocal ? (
                <TextField
                  label="XP"
                  type="number"
                  size="small"
                  value={xp}
                  onChange={handleXpChange}
                  inputProps={{ min: 0 }}
                  sx={{ width: 120 }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Experience Points: {xp}
                </Typography>
              )}
              <Tooltip
                title={`${xpForNextLevel - xp} XP needed for next level`}
              >
                <Typography variant="caption" color="text.secondary">
                  Next Level: {xpForNextLevel}
                </Typography>
              </Tooltip>
            </Box>
            <LinearProgress
              variant="determinate"
              value={xpProgress}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>

          <Tooltip title="Available perk points to spend on skills">
            <Chip
              icon={<ExtensionIcon />}
              label={`${availablePerkPoints} Perk Points`}
              color={availablePerkPoints > 0 ? "secondary" : "default"}
              variant={availablePerkPoints > 0 ? "filled" : "outlined"}
            />
          </Tooltip>
        </Box>

        {/* Add note for local troopers */}
        {isLocal && (
          <Typography variant="caption" color="text.secondary">
            This trooper is stored locally. You can edit XP directly.
          </Typography>
        )}

        <Divider sx={{ my: 1 }} />
      </Box>

      <DialogTitle sx={{ pb: 0, pt: 0 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Equipment" />
          <Tab label="Perks" />
        </Tabs>
      </DialogTitle>

      <DialogContent dividers sx={{ position: "relative", height: 500 }}>
        {/* Trooper Silhouette as background - common to both tabs */}
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
            zIndex: 0,
          }}
        />

        {selectedTab === 0 ? (
          // Equipment Tab Content
          <>
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
                  ...slotStyles,
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
                  ...slotStyles,
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
                  ...slotStyles,
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
                  {/* Only show the None button if there's an item equipped in this slot */}
                  {trooper[selectedSlot] && (
                    <Button
                      variant="outlined"
                      onClick={handleUnequipItem}
                      sx={{ mb: 1 }}
                    >
                      None (Unequip)
                    </Button>
                  )}

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
        ) : (
          // Perks Tab Content
          <>
            {selectedPerkTree ? (
              // Show specific perk tree when selected with perk points display
              <>
                <PerkTree
                  trooper={trooper}
                  perk={selectedPerkTree}
                  setTrooper={setTrooper}
                  onBack={() => setSelectedPerkTree(null)}
                  availablePerkPoints={availablePerkPoints}
                />
              </>
            ) : (
              // Show perk buttons layout when no specific tree is selected
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: `url(${silhouette}) no-repeat center`,
                  backgroundSize: "contain",
                  opacity: 0.7,
                }}
              >
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

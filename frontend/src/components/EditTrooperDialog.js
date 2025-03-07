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
  const [removedItems, setRemovedItems] = useState([]);
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
                      sx={{ p: 2, display: "flex", flexWrap: "wrap", gap: 2 }}
                    >
                      {(() => {
                        const filteredInventory = companyInventory
                          .filter(
                            (item) =>
                              mapItemData(item).filter(
                                (itemData) =>
                                  itemData.slot === selectedSlot &&
                                  !removedItems.some(
                                    (removed) => removed.uuid === item.uuid
                                  )
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
                                if (trooper[selectedSlot]) {
                                  setRemovedItems((prev) =>
                                    prev.filter(
                                      (i) =>
                                        i.uuid !== trooper[selectedSlot].uuid
                                    )
                                  );
                                }
                                setTrooper({
                                  ...trooper,
                                  [selectedSlot]: itemData,
                                });
                                setRemovedItems((prev) => [...prev, itemData]);
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
                </Box>
              </>
            )}
            {selectedTab === 1 && !selectedPerkTree && (
              // Perks tab content: Perk buttons layout in two columns
              <Box sx={{ mt: 2 }}>
                <Button
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
            saveChanges(trooper, removedItems);
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

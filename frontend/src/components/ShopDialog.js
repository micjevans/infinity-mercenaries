import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid2,
  Divider,
  Alert,
} from "@mui/material";
import MapItem from "./MapItem";
import { mapItemData } from "../utils/metadataMapping";

// Define the order of slot categories
const slotOrder = [
  "Primary",
  "Secondary",
  "Sidearm",
  "Accessories",
  "Roles",
  "Armor",
  "Augment",
  "Other",
];

// Map for normalizing slot names (lowercase keys to standard category names)
const slotMapping = {
  primary: "Primary",
  secondary: "Secondary",
  sidearm: "Sidearm",
  "side arm": "Sidearm",
  accessory: "Accessories",
  accessories: "Accessories",
  role: "Roles",
  roles: "Roles",
  armor: "Armor",
  armour: "Armor",
  augment: "Augment",
  augmentation: "Augment",
  equipment: "Accessories",
  weapon: "Primary",
};

const ShopDialog = ({
  open,
  onClose,
  companyItems = [],
  merchantItems = [],
  onConfirmExchange,
  companyCredits = 0, // Add companyCredits prop to track available credits
}) => {
  // Local state to manage available items so that staged items are removed from display
  const [availableCompanyItems, setAvailableCompanyItems] =
    useState(companyItems);
  const [availableMerchantItems, setAvailableMerchantItems] =
    useState(merchantItems);
  const [stagedCompany, setStagedCompany] = useState([]);
  const [stagedMerchant, setStagedMerchant] = useState([]);

  useEffect(() => {
    setAvailableCompanyItems(companyItems);
    setAvailableMerchantItems(merchantItems);
  }, [companyItems, merchantItems]);

  const totalCreditsForCompany = stagedMerchant.reduce(
    (acc, item) => acc + (item.cr || 0),
    0
  );
  const totalCreditsForMerchant = stagedCompany.reduce(
    (acc, item) => acc + (item.cr || 0),
    0
  );

  // Calculate net exchange and determine if transaction is valid
  const netExchange = totalCreditsForMerchant - totalCreditsForCompany;
  const newCreditBalance = companyCredits + netExchange;
  const insufficientFunds = newCreditBalance < 0;

  // Group items by their slot category
  const groupItemsBySlot = (items) => {
    const grouped = {};

    // Initialize groups with empty arrays
    slotOrder.forEach((slot) => {
      grouped[slot] = [];
    });

    // Group items by slot
    items.forEach((item) => {
      const itemData = mapItemData(item);

      if (itemData && itemData.length > 0) {
        // Try to extract slot information
        let slotValue = itemData[0].slot;

        // Normalize the slot name
        let normalizedSlot = "Other";

        if (slotValue) {
          // First, convert to lowercase for consistent matching
          const slotLower = slotValue.toLowerCase();

          // Check our mapping for standardized category
          if (slotMapping[slotLower]) {
            normalizedSlot = slotMapping[slotLower];
          } else if (slotOrder.includes(slotValue)) {
            // If the raw value exactly matches one of our categories
            normalizedSlot = slotValue;
          }
        }

        // Special handling for weapons based on item type/key
        if (normalizedSlot === "Other" && item.key === "weapons") {
          // If it's a weapon but without a specific slot, put in Primary by default
          normalizedSlot = "Primary";
        }

        // Add item to the appropriate category
        grouped[normalizedSlot].push(item);
      } else {
        // If item has no metadata, add to "Other"
        grouped["Other"].push(item);
      }
    });

    return grouped;
  };

  const handleStageCompanyItem = (item) => {
    setStagedCompany((prev) => [...prev, item]);
    setAvailableCompanyItems((prev) =>
      prev.filter((i) => i.uuid !== item.uuid)
    );
  };

  const handleStageMerchantItem = (item) => {
    setStagedMerchant((prev) => [...prev, item]);
    setAvailableMerchantItems((prev) =>
      prev.filter((i) => i.uuid !== item.uuid)
    );
  };

  // New unstage functions for double click on staged items:
  const handleUnstageCompanyItem = (item) => {
    setAvailableCompanyItems((prev) => [...prev, item]);
    setStagedCompany((prev) => prev.filter((i) => i.uuid !== item.uuid));
  };

  const handleUnstageMerchantItem = (item) => {
    setAvailableMerchantItems((prev) => [...prev, item]);
    setStagedMerchant((prev) => prev.filter((i) => i.uuid !== item.uuid));
  };

  const handleConfirm = () => {
    if (onConfirmExchange) {
      onConfirmExchange({
        companyItems: stagedCompany,
        merchantItems: stagedMerchant,
        netExchange: totalCreditsForMerchant - totalCreditsForCompany,
      });
    }
    setStagedCompany([]);
    setStagedMerchant([]);
    onClose();
  };

  // Group the available items by slot
  const groupedCompanyItems = groupItemsBySlot(availableCompanyItems);
  const groupedMerchantItems = groupItemsBySlot(availableMerchantItems);

  // Render items for a specific category
  const renderItemsByCategory = (items, category, handleAction) => {
    if (!items[category] || items[category].length === 0) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
          {category}
        </Typography>
        <Grid2 container spacing={2}>
          {items[category].map((item, index) => (
            <Grid2 item xs={4} key={index}>
              <MapItem
                item={item}
                action={handleAction}
                width={50}
                height={50}
                style={{ marginBottom: 4 }}
                alt={item.name}
              />
            </Grid2>
          ))}
        </Grid2>
        <Divider sx={{ my: 1 }} />
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Trading Screen</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
          {/* Company Items Grid2 */}
          <Box
            sx={{
              flex: 1,
              border: "1px solid",
              borderColor: "divider",
              p: 1,
              overflowY: "auto",
              maxHeight: "70vh",
            }}
          >
            <Typography variant="h6" align="center" gutterBottom>
              Company Items
            </Typography>
            {slotOrder.map((slot) =>
              renderItemsByCategory(
                groupedCompanyItems,
                slot,
                handleStageCompanyItem
              )
            )}
          </Box>

          {/* Staged Exchange Area */}
          <Box
            sx={{
              flex: 1,
              border: "1px dashed",
              borderColor: "divider",
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle1" align="center" gutterBottom>
              Staged Exchange
            </Typography>

            <Grid2 container spacing={2}>
              <Grid2 item xs={6}>
                <Typography variant="caption" align="center" display="block">
                  Company Items
                </Typography>
                <Grid2 container spacing={1}>
                  {stagedCompany.map((item, index) => (
                    <Grid2 item xs={12} key={index}>
                      <MapItem
                        item={item}
                        action={handleUnstageCompanyItem}
                        width={40}
                        height={40}
                        style={{ marginBottom: 2 }}
                        alt={item.name}
                      />
                    </Grid2>
                  ))}
                </Grid2>
              </Grid2>
              <Grid2 item xs={6}>
                <Typography variant="caption" align="center" display="block">
                  Merchant Items
                </Typography>
                <Grid2 container spacing={1}>
                  {stagedMerchant.map((item, index) => (
                    <Grid2 item xs={12} key={index}>
                      <MapItem
                        item={item}
                        action={handleUnstageMerchantItem}
                        width={40}
                        height={40}
                        style={{ marginBottom: 2 }}
                        alt={item.name}
                      />
                    </Grid2>
                  ))}
                </Grid2>
              </Grid2>
            </Grid2>
            <Box sx={{ mt: 2, textAlign: "center", width: "100%" }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Net Credits: {netExchange}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Current Balance: {companyCredits}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  fontWeight: "bold",
                  color: insufficientFunds ? "error.main" : "success.main",
                }}
              >
                New Balance: {newCreditBalance}
              </Typography>

              {insufficientFunds && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Insufficient credits for this transaction. You need{" "}
                  {Math.abs(newCreditBalance)} more credits.
                </Alert>
              )}
            </Box>
          </Box>

          {/* Merchant Items Grid2 */}
          <Box
            sx={{
              flex: 1,
              border: "1px solid",
              borderColor: "divider",
              alignItems: "center",
              p: 1,
              overflowY: "auto",
              maxHeight: "70vh",
            }}
          >
            <Typography variant="h6" align="center" gutterBottom>
              Merchant Items
            </Typography>
            {slotOrder.map((slot) =>
              renderItemsByCategory(
                groupedMerchantItems,
                slot,
                handleStageMerchantItem
              )
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={
            insufficientFunds ||
            (stagedCompany.length === 0 && stagedMerchant.length === 0)
          }
        >
          Confirm Exchange
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShopDialog;

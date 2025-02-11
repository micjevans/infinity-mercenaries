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
} from "@mui/material";
import MapImage from "./MapImage";

const ShopDialog = ({
  open,
  onClose,
  companyItems = [],
  merchantItems = [],
  onConfirmExchange,
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

  const totalCreditsForCompany = stagedCompany.reduce(
    (acc, item) => acc + (item.value || 0),
    0
  );
  const totalCreditsForMerchant = stagedMerchant.reduce(
    (acc, item) => acc + (item.value || 0),
    0
  );

  const handleStageCompanyItem = (item) => {
    setStagedCompany((prev) => [...prev, item]);
    setAvailableCompanyItems((prev) => prev.filter((i) => i !== item));
  };

  const handleStageMerchantItem = (item) => {
    setStagedMerchant((prev) => [...prev, item]);
    setAvailableMerchantItems((prev) => prev.filter((i) => i !== item));
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
            }}
          >
            <Typography variant="h6" align="center" gutterBottom>
              Company Items
            </Typography>
            <Grid2 container spacing={2}>
              {availableCompanyItems.map((item, index) => (
                <Grid2 item xs={4} key={index}>
                  <MapImage
                    item={item}
                    metaKey="weapons"
                    action={handleStageCompanyItem}
                    width={50}
                    height={50}
                    style={{ marginBottom: 4 }}
                    alt={item.name}
                  />
                </Grid2>
              ))}
            </Grid2>
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
                      <MapImage
                        item={item}
                        metaKey="weapons"
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
                      <MapImage
                        item={item}
                        metaKey="weapons"
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
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2">
                Net Credits: {totalCreditsForMerchant - totalCreditsForCompany}
              </Typography>
            </Box>
          </Box>
          {/* Merchant Items Grid2 */}
          <Box
            sx={{
              flex: 1,
              border: "1px solid",
              borderColor: "divider",
              p: 1,
            }}
          >
            <Typography variant="h6" align="center" gutterBottom>
              Merchant Items
            </Typography>
            <Grid2 container spacing={2}>
              {availableMerchantItems.map((item, index) => (
                <Grid2 item xs={4} key={index}>
                  <MapImage
                    item={item}
                    metaKey="weapons"
                    onDoubleClick={handleStageMerchantItem}
                    width={50}
                    height={50}
                    style={{ marginBottom: 4 }}
                    alt={item.name}
                  />
                </Grid2>
              ))}
            </Grid2>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Confirm Exchange
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShopDialog;

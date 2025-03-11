import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  TextField,
  Snackbar,
  Alert,
  Grid,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ShopDialog from "../components/ShopDialog";
import baseMarket from "../data/markets/baseMarket.json";
import TrooperList from "../components/TrooperList";
import { useAuth } from "../auth/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const CompanyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  let cleanedCompany = null;
  if (location?.state?.company) {
    const stateCompany = location.state.company;
    cleanedCompany = {
      ...stateCompany,
      sectorials: stateCompany.sectorials || [],
      inventory: stateCompany.inventory || [],
      notoriety: stateCompany.notoriety || 0,
      credits: stateCompany.credits || 0,
      sponsor: stateCompany.sponsor || "",
    };
  }

  const [company, setCompany] = useState(cleanedCompany);
  const [isModified, setIsModified] = useState(false);

  if (!cleanedCompany) return null;

  const companyName = cleanedCompany?.name;

  const merchantItems = baseMarket.items;

  // Add handler for description changes
  const handleDescriptionChange = (e) => {
    setCompany({
      ...company,
      description: e.target.value,
    });
    setIsModified(true);
  };

  // Add function to save company details
  const saveCompanyDetails = async () => {
    if (!user || !company || !company.id) return;

    try {
      const companyRef = doc(db, "users", user.uid, "companies", company.id);

      await updateDoc(companyRef, {
        description: company.description,
        // Add other fields to update if needed
      });

      setSnackbar({
        open: true,
        message: "Company details saved successfully!",
        severity: "success",
      });
      setIsModified(false);
    } catch (error) {
      console.error("Error saving company details:", error);
      setSnackbar({
        open: true,
        message: "Error saving company details: " + error.message,
        severity: "error",
      });
    }
  };

  const saveInventoryChanges = async (updatedInventory, updatedCredits) => {
    if (!user || !company || !company.id) return;

    try {
      const companyRef = doc(db, "users", user.uid, "companies", company.id);

      await updateDoc(companyRef, {
        inventory: updatedInventory,
        credits: updatedCredits,
      });

      setSnackbar({
        open: true,
        message: "Inventory and credits updated successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error saving inventory changes:", error);
      setSnackbar({
        open: true,
        message: "Error saving inventory changes: " + error.message,
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!company) {
    return <div>Loading...</div>;
  }
  return (
    <Container maxWidth="md" style={{ marginTop: "20px" }}>
      <Button variant="outlined" onClick={() => navigate("/companies")}>
        Back to Companies
      </Button>
      <Typography variant="h4" gutterBottom>
        {companyName || "Company"}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Troopers
      </Typography>
      <Paper style={{ padding: "16px", marginBottom: "20px" }}>
        <Box sx={{ marginBottom: "16px" }}>
          <Typography variant="subtitle1" gutterBottom>
            Sectorials
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {company.sectorial1 && (
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <img
                    src={company.sectorial1.logo}
                    alt={company.sectorial1.name}
                    style={{ width: 24, height: 24, marginRight: 8 }}
                  />
                  <Typography variant="body1">
                    {company.sectorial1.name}
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {company.sectorial2 && (
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <img
                    src={company.sectorial2.logo}
                    alt={company.sectorial2.name}
                    style={{ width: 24, height: 24, marginRight: 8 }}
                  />
                  <Typography variant="body1">
                    {company.sectorial2.name}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Description
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={saveCompanyDetails}
            disabled={!isModified}
          >
            Save
          </Button>
        </Box>
        <TextField
          fullWidth
          variant="outlined"
          multiline
          minRows={4}
          placeholder="Enter company description"
          value={company?.description || ""}
          onChange={handleDescriptionChange}
          sx={{ mb: 2 }}
        />
        <Typography variant="body2">
          Available Credits: {company.credits}
        </Typography>
        <Typography variant="body2">Sponsor: {company.sponsor}</Typography>
        <Typography variant="body2">Notoriety: {company.notoriety}</Typography>
        <Typography variant="body2">
          Total Company Renown: {company.renown}
        </Typography>
      </Paper>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button
          onClick={() => setShopModalOpen(true)}
          variant="contained"
          color="secondary"
        >
          Open Shop/Inventory
        </Button>
      </Box>
      <TrooperList company={company} setCompany={setCompany} />
      <ShopDialog
        open={shopModalOpen}
        onClose={() => setShopModalOpen(false)}
        companyItems={company.inventory || []}
        merchantItems={merchantItems}
        companyCredits={company.credits || 0} // Pass current company credits
        onConfirmExchange={async (exchangeData) => {
          try {
            const updatedInventory = [
              ...company.inventory.filter(
                (item) =>
                  !exchangeData.companyItems.some(
                    (exItem) => exItem.id === item.id
                  )
              ),
              ...exchangeData.merchantItems,
            ];

            const updatedCredits = company.credits + exchangeData.netExchange;

            setCompany((prev) => ({
              ...prev,
              inventory: updatedInventory,
              credits: updatedCredits,
            }));

            await saveInventoryChanges(updatedInventory, updatedCredits);

            setShopModalOpen(false);
          } catch (error) {
            console.error("Error processing exchange:", error);
            setSnackbar({
              open: true,
              message: "Error processing exchange: " + error.message,
              severity: "error",
            });
          }
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CompanyPage;

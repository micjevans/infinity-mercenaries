import React, { useState, useEffect } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import ShopDialog from "../components/ShopDialog";
import baseMarket from "../data/markets/baseMarket.json";
import TrooperList from "../components/TrooperList";
import { useAuth } from "../auth/AuthContext";
import { doc, updateDoc, collection, getDocs } from "firebase/firestore"; // Add collection and getDocs
import { db } from "../firebase";
import metadata from "../data/factions/metadata";

// Add a getTroopers function that was missing
const getTroopers = async (companyId, userId) => {
  if (!userId || !companyId) return [];

  try {
    const troopersRef = collection(
      db,
      "users",
      userId,
      "companies",
      companyId,
      "troopers"
    );
    const snapshot = await getDocs(troopersRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching troopers:", error);
    return [];
  }
};

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
  const [troopers, setTroopers] = useState([]); // Add state to track troopers for disabling sectorial selection

  // Check if sectorials can be edited (no troopers added yet)
  const canEditSectorials = !troopers || troopers.length === 0;

  // Move useEffect before conditional return
  useEffect(() => {
    if (!user || !company?.id) return;

    const fetchTroopers = async () => {
      try {
        const troopersList = await getTroopers(company.id, user.uid);
        setTroopers(troopersList);
      } catch (error) {
        console.error("Error fetching troopers:", error);
      }
    };

    fetchTroopers();
  }, [company?.id, user]);

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

  // Add handlers for sectorial changes
  const handleSectorial1Change = (e) => {
    const selectedId = Number(e.target.value);
    const selectedFaction = metadata.factions.find(
      (faction) => faction.id === selectedId
    );

    if (!selectedFaction) return;

    // If sectorial1 changes, we may need to reset sectorial2 if it's no longer compatible
    let newSectorial2 = company.sectorial2;

    // If the selected faction is a parent faction, reset sectorial2
    if (selectedFaction.id === selectedFaction.parent) {
      newSectorial2 = null;
    }

    setCompany({
      ...company,
      sectorial1: selectedFaction,
      sectorial2: newSectorial2,
    });
    setIsModified(true);
  };

  const handleSectorial2Change = (e) => {
    const selectedId = Number(e.target.value);
    const selectedFaction = metadata.factions.find(
      (faction) => faction.id === selectedId
    );

    if (!selectedFaction) return;

    setCompany({
      ...company,
      sectorial2: selectedFaction,
    });
    setIsModified(true);
  };

  // Add function to save company details including sectorials
  const saveCompanyDetails = async () => {
    if (!user || !company || !company.id) return;

    try {
      const companyRef = doc(db, "users", user.uid, "companies", company.id);

      await updateDoc(companyRef, {
        description: company.description,
        sectorial1: company.sectorial1,
        sectorial2: company.sectorial2,
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
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Tooltip title="Back to Companies">
          <IconButton
            onClick={() => navigate("/companies")}
            color="primary"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h4">{companyName || "Company"}</Typography>
      </Box>
      <Paper style={{ padding: "16px", marginBottom: "20px" }}>
        <Box sx={{ marginBottom: "16px" }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }} gutterBottom>
            Sectorials
          </Typography>
          <Grid container spacing={2}>
            {/* Sectorial 1 Dropdown */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!canEditSectorials}>
                <InputLabel id="sectorial1-label">Sectorial 1</InputLabel>
                <Select
                  labelId="sectorial1-label"
                  value={company.sectorial1 ? company.sectorial1.id : ""}
                  label="Sectorial 1"
                  onChange={handleSectorial1Change}
                  renderValue={(selected) => {
                    const faction = metadata.factions.find(
                      (f) => f.id === selected
                    );
                    return faction ? (
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <img
                          src={faction.logo}
                          alt={faction.name}
                          style={{ width: 20, height: 20, marginRight: 8 }}
                        />
                        <span>{faction.name}</span>
                      </div>
                    ) : (
                      "Select Sectorial 1"
                    );
                  }}
                >
                  {metadata.factions.map((faction) => (
                    <MenuItem key={faction.id} value={faction.id}>
                      <img
                        src={faction.logo}
                        alt={faction.name}
                        style={{ width: 20, height: 20, marginRight: 8 }}
                      />
                      {faction.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Sectorial 2 Dropdown */}
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                disabled={
                  !canEditSectorials ||
                  !company.sectorial1 ||
                  (company.sectorial1 &&
                    company.sectorial1.id === company.sectorial1.parent)
                }
              >
                <InputLabel id="sectorial2-label">Sectorial 2</InputLabel>
                <Select
                  labelId="sectorial2-label"
                  value={company.sectorial2 ? company.sectorial2.id : ""}
                  label="Sectorial 2"
                  onChange={handleSectorial2Change}
                  renderValue={(selected) => {
                    const faction = metadata.factions.find(
                      (f) => f.id === selected
                    );
                    return faction ? (
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <img
                          src={faction.logo}
                          alt={faction.name}
                          style={{ width: 20, height: 20, marginRight: 8 }}
                        />
                        <span>{faction.name}</span>
                      </div>
                    ) : (
                      "Select Sectorial 2"
                    );
                  }}
                >
                  {metadata.factions
                    .filter((faction) => faction.id !== faction.parent)
                    .map((faction) => (
                      <MenuItem key={faction.id} value={faction.id}>
                        <img
                          src={faction.logo}
                          alt={faction.name}
                          style={{ width: 20, height: 20, marginRight: 8 }}
                        />
                        {faction.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {!canEditSectorials && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Sectorials cannot be changed once troopers have been added to the
              company.
            </Alert>
          )}
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mt: 2,
            mb: 2,
          }}
        >
          <Button
            onClick={() => setShopModalOpen(true)}
            variant="contained"
            color="secondary"
          >
            Open Shop/Inventory
          </Button>
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
      </Paper>
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

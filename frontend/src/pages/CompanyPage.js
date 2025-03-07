import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  TextField,
} from "@mui/material";
import metadata from "../data/factions/metadata";
import ShopDialog from "../components/ShopDialog"; // new import
import baseMarket from "../data/markets/baseMarket.json"; // Import baseMarket.json
import TrooperList from "../components/TrooperList";

const CompanyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  let cleanedCompany = null;
  if (location?.state?.company) {
    const stateCompany = location.state.company;
    cleanedCompany = {
      ...stateCompany,
      sectorials: stateCompany.sectorials || [], // Ensure sectorials is always an array
      inventory: stateCompany.inventory || [], // Ensure inventory is always an array
      notoriety: stateCompany.notoriety || 0,
      credits: stateCompany.credits || 0, // Default to 0 if not present
      sponsor: stateCompany.sponsor || "", // Default to empty string if not present
    };
  }
  const [shopModalOpen, setShopModalOpen] = useState(false); // new state for shop
  const [company, setCompany] = useState(cleanedCompany);

  if (!cleanedCompany) return null;

  const companyName = cleanedCompany?.name;

  const handleSectorial1Change = (e) => {
    const selectedId = Number(e.target.value);
    const selectedFaction = metadata.factions.find(
      (faction) => faction.id === selectedId
    );
    if (!selectedFaction) {
      console.error("Selected faction not found:", selectedFaction);
      return;
    }
    setCompany((prev) => ({
      ...prev,
      sectorial1: selectedFaction,
      // If the selected faction is vanilla (id === parent), clear sectorial2
      sectorial2:
        selectedFaction.id === selectedFaction.parent ? null : prev.sectorial2,
    }));
  };

  const handleSectorial2Change = (e) => {
    const selectedId = Number(e.target.value);
    const selectedFaction = metadata.factions.find(
      (faction) => faction.id === selectedId
    );
    if (!selectedFaction) {
      console.error("Selected faction not found:", selectedFaction);
      return;
    }
    setCompany((prev) => ({
      ...prev,
      sectorial2: selectedFaction,
    }));
  };
  // Use the items from baseMarket.json for both company and merchant items
  const merchantItems = baseMarket.items;

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
      {/* Sectorial Selection */}
      <Paper style={{ padding: "16px", marginBottom: "20px" }}>
        <Box sx={{ display: "flex", gap: 2, marginBottom: "16px" }}>
          <FormControl fullWidth>
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
                  ""
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
          <FormControl
            fullWidth
            disabled={
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
                  ""
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
        </Box>
        {/* Company Details Section */}
        <Typography variant="subtitle1" gutterBottom>
          Description
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          multiline
          minRows={4}
          placeholder="Enter company description"
          value={company?.description}
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
      {/* Action Buttons Row */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button
          onClick={() => setShopModalOpen(true)}
          variant="contained"
          color="secondary"
        >
          Open Shop
        </Button>
      </Box>
      <TrooperList company={company} setCompany={setCompany} />
      <ShopDialog
        open={shopModalOpen}
        onClose={() => setShopModalOpen(false)}
        companyItems={company.inventory}
        merchantItems={merchantItems}
        onConfirmExchange={(exchangeData) => {
          // Update company CR by adding net exchange:
          // Update company inventory:
          // Remove the company items that were staged for exchange, comparing by id.
          setCompany((prevCompany) => ({
            ...prevCompany,
            credits: prevCompany.credits + exchangeData.netExchange,
            inventory: [
              ...prevCompany.inventory.filter(
                (item) =>
                  !exchangeData.companyItems.some(
                    (exItem) => exItem.id === item.id
                  )
              ),
              ...exchangeData.merchantItems,
            ],
          }));
          setShopModalOpen(false);
        }}
      />
    </Container>
  );
};

export default CompanyPage;

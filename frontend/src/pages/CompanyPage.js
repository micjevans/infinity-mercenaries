import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  List,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import { API_BASE_URL } from "../config";
import { useAuth } from "../auth/AuthContext";
import Trooper from "../components/Trooper";
import metadata from "../data/factions/metadata";
import AddTrooperDialog from "../components/AddTrooperDialog";
import EditTrooperDialog from "../components/EditTrooperDialog";
import ShopDialog from "../components/ShopDialog"; // new import

const factionsContext = require.context("../data/factions", false, /\.json$/);
const loadFactionData = (slug) => {
  try {
    return factionsContext(`./${slug}.json`);
  } catch (error) {
    console.error("Error loading faction data for", slug, error);
    return null;
  }
};

const CompanyPage = ({ company }) => {
  const { companyId } = useParams(); // Get the companyId from the route
  const companyName = company?.name;
  const [troopers, setTroopers] = useState([]);
  const { user } = useAuth(); // Get the logged-in user
  const navigate = useNavigate();
  const [sectorial1, setSectorial1] = useState(null);
  const [sectorial2, setSectorial2] = useState(null);
  const [trooperModalOpen, setTrooperModalOpen] = useState(false);
  const [shopModalOpen, setShopModalOpen] = useState(false); // new state for shop
  const [editingTrooper, setEditingTrooper] = useState(null);
  const [units, setUnits] = useState([]);
  // Create a ref for the Add Trooper button
  const addTrooperButtonRef = useRef(null);

  useEffect(() => {
    // Fetch troopers for this company
    fetch(`${API_BASE_URL}/users/${user.uid}/companies/${companyId}/troopers`)
      .then((res) => res.json())
      .then((data) => setTroopers(data))
      .catch((error) => console.error("Error fetching troopers:", error));
  }, [companyId, user.uid]);

  const handleSectorial1Change = (e) => {
    const selectedId = Number(e.target.value);
    const selectedFaction = metadata.factions.find(
      (faction) => faction.id === selectedId
    );
    setSectorial1(selectedFaction);
    // If the selected faction is vanilla (id === parent), clear sectorial2
    if (selectedFaction && selectedFaction.id === selectedFaction.parent) {
      setSectorial2(null);
    }
  };

  const handleSectorial2Change = (e) => {
    const selectedId = Number(e.target.value);
    const selectedFaction = metadata.factions.find(
      (faction) => faction.id === selectedId
    );
    setSectorial2(selectedFaction);
  };

  useEffect(() => {
    if (trooperModalOpen) {
      // Gather selected sectorials (only add ones that are selected)
      const selectedSectors = [];
      if (sectorial1) selectedSectors.push(sectorial1);
      if (sectorial2) selectedSectors.push(sectorial2);

      const unitsArrays = selectedSectors.map((sector) => {
        console.log("Loading units for", sector.slug);
        const data = loadFactionData(sector.slug);
        if (!data) return [];
        const factionUnits = data.units || [];
        const resumeList = data.resume || [];
        // Loop through each unit and find the matching resume by id
        factionUnits.forEach((unit) => {
          unit.resume = resumeList.find((r) => r.id === unit.id) || null;
        });
        return factionUnits;
      });
      // Combine all unit arrays into a single array
      setUnits(unitsArrays.flat());
    }
  }, [trooperModalOpen, sectorial1, sectorial2]);

  // Define the handleAddTrooper function
  const handleAddTrooper = (trooper) => {
    // Append the full trooper object to the company list
    setTroopers((prevTroopers) => [...prevTroopers, trooper]);
    // Optionally, close the AddTrooperDialog after adding
    setTrooperModalOpen(false);
    // Delay focus to ensure the dialog is closed
    setTimeout(() => {
      if (addTrooperButtonRef.current) {
        addTrooperButtonRef.current.focus();
      }
    }, 0);
  };

  const handleEditTrooper = (trooper) => {
    setEditingTrooper(trooper);
  };

  const handleCloseEditDialog = () => {
    setEditingTrooper(null);
  };

  // Placeholder arrays; replace with actual company and merchant items
  const companyItems = [14, 78, 227, 172, 224, 24, 63, 91, 100];
  const merchantItems = [14, 78, 227, 172, 224, 24, 63, 91, 100];

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
      {/* Add Trooper Section */}
      <Paper style={{ padding: "16px", marginBottom: "20px" }}>
        <FormControl fullWidth style={{ marginBottom: "16px" }}>
          <InputLabel id="sectorial1-label">Sectorial 1</InputLabel>
          <Select
            labelId="sectorial1-label"
            value={sectorial1 ? sectorial1.id : ""}
            label="Sectorial 1"
            onChange={handleSectorial1Change}
            renderValue={(selected) => {
              const faction = metadata.factions.find((f) => f.id === selected);
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
          style={{ marginBottom: "16px" }}
          disabled={
            !sectorial1 || (sectorial1 && sectorial1.id === sectorial1.parent)
          }
        >
          <InputLabel id="sectorial2-label">Sectorial 2</InputLabel>
          <Select
            labelId="sectorial2-label"
            value={sectorial2 ? sectorial2.id : ""}
            label="Sectorial 2"
            onChange={handleSectorial2Change}
            renderValue={(selected) => {
              const faction = metadata.factions.find((f) => f.id === selected);
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
      </Paper>
      {/* Action Buttons Row */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button
          ref={addTrooperButtonRef}
          onClick={() => setTrooperModalOpen(true)}
          variant="contained"
          color="primary"
        >
          Add Trooper
        </Button>
        <Button
          onClick={() => setShopModalOpen(true)}
          variant="contained"
          color="secondary"
        >
          Open Shop
        </Button>
      </Box>
      {/* Trooper List Section */}
      <List>
        {troopers.length > 0 ? (
          troopers.map((trooper, index) => (
            <div key={index}>
              <Trooper
                trooper={trooper}
                onUpdate={() => {}}
                onClick={() => handleEditTrooper(trooper)}
              />
            </div>
          ))
        ) : (
          <Typography>No troopers found.</Typography>
        )}
      </List>

      <AddTrooperDialog
        open={trooperModalOpen}
        onClose={() => setTrooperModalOpen(false)}
        units={units}
        onAddTrooper={handleAddTrooper} // pass down the handler
      />
      {editingTrooper && (
        <EditTrooperDialog
          open={Boolean(editingTrooper)}
          onClose={handleCloseEditDialog}
          trooper={editingTrooper}
          companyInventory={[]}
          onSelectEquipment={() => {}}
        />
      )}
      <ShopDialog
        open={shopModalOpen}
        onClose={() => setShopModalOpen(false)}
        companyItems={companyItems}
        merchantItems={merchantItems}
        onConfirmExchange={(exchangeData) => {
          console.log("Exchange confirmed:", exchangeData);
          setShopModalOpen(false);
        }}
      />
    </Container>
  );
};

export default CompanyPage;

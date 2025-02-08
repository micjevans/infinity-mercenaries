import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  List,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Button,
  ListItem,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { API_BASE_URL } from "../config";
import { useAuth } from "../auth/AuthContext"; // Assuming Firebase Auth Context
import Trooper from "../components/Trooper";
import metadata from "../data/factions/metadata"; // <-- add this import at the top with other imports
import UnitDetails from "../components/UnitDetails";
import ProfileDetails from "../components/ProfileDetails";

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
  const [newTrooper, setNewTrooper] = useState("");
  const { companyId } = useParams(); // Get the companyId from the route
  const [companyName, setCompanyName] = useState("");
  const [troopers, setTroopers] = useState([]);
  const { user } = useAuth(); // Get the logged-in user
  const navigate = useNavigate();
  const [sectorial1, setSectorial1] = useState(null);
  const [sectorial2, setSectorial2] = useState(null);
  const [trooperModalOpen, setTrooperModalOpen] = useState(false);
  const [units, setUnits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("");

  useEffect(() => {
    // Fetch company name (optional, if you want to display it)
    fetch(`${API_BASE_URL}/users/${user.uid}/companies/${companyId}`)
      .then((res) => res.json())
      .then((data) => setCompanyName(data.name))
      .catch((error) =>
        console.error("Error fetching company details:", error)
      );

    // Fetch troopers for this company
    fetch(`${API_BASE_URL}/users/${user.uid}/companies/${companyId}/troopers`)
      .then((res) => res.json())
      .then((data) => setTroopers(data))
      .catch((error) => console.error("Error fetching troopers:", error));
  }, [companyId, user.uid]);

  const handleAddTrooper = () => {
    if (!user) return; // Ensure user is logged in
    fetch(`${API_BASE_URL}/users/${user.uid}/companies/${companyId}/troopers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTrooper }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTroopers((prev) => [...prev, data]); // Add new trooper to the list
        setNewTrooper("");
      })
      .catch((error) => console.error("Error adding trooper:", error));
  };

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

  // Debounce the search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setUnitFilter(searchTerm);
    }, 300); // 300ms delay
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
        <Button
          variant="contained"
          color="primary"
          onClick={() => setTrooperModalOpen(true)}
        >
          Add Trooper
        </Button>
      </Paper>
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
      {/* Trooper List Section */}
      <List>
        {troopers.length > 0 ? (
          troopers.map((notTrooper, index) => {
            const trooper = {
              id: "123",
              name: "Artalis",
              mov1: "4",
              mov2: "4",
              cc: 17,
              bs: 12,
              ph: 10,
              wip: 14,
              arm: 1,
              bts: 3,
              vita: 2,
              s: 1,
              ava: 1,
              equipment: ["Deactivator"],
              skills: ["Courage", 'Dodge (+1")', "Immunity (Shock)", "NCO"],
            };
            return (
              <ListItem
                key={trooper.id + "" + index}
                style={{ padding: "0px" }}
              >
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{trooper.name}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Trooper initialTrooper={trooper} onUpdate={() => {}} />
                  </AccordionDetails>
                </Accordion>
              </ListItem>
            );
          })
        ) : (
          <Typography>No troopers found.</Typography>
        )}
      </List>
      <Dialog
        open={trooperModalOpen}
        onClose={() => setTrooperModalOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Select a Trooper Unit</DialogTitle>
        {/* Moved filter box outside the scrollable DialogContent */}
        <div style={{ padding: "16px" }}>
          <TextField
            label="Filter by ISC"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
          />
        </div>
        <DialogContent
          dividers
          style={{ maxHeight: "70vh", overflowY: "auto" }}
        >
          {units
            // For each unit, filter each profileGroup's options to only those with swc === "0", and don't have the lieutenant skill
            .map((unit) => ({
              ...unit,
              profileGroups: unit.profileGroups.map((group) => ({
                ...group,
                options: group.options.filter(
                  (option) =>
                    option.swc === "0" &&
                    !option.skills.includes((skill) => skill.id === 119)
                ),
              })),
            }))
            // Then, filter out any unit that has no valid options in any profileGroup, aren't characters, and first filter by ISC search term.
            .filter((unit) => {
              return (
                unit.profileGroups.some(
                  (group) => group.options && group.options.length > 0
                ) &&
                unit.resume.category !== 10 &&
                unit.isc.toLowerCase().includes(unitFilter.toLowerCase())
              );
            })
            .map((unit, unitIndex) => (
              <Accordion key={`unit-${unit.isc}-${unitIndex}`}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  {/* Display unit isc and logo from first profile group */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {unit.profileGroups &&
                      unit.profileGroups[0] &&
                      unit.profileGroups[0].profiles &&
                      unit.profileGroups[0].profiles[0] && (
                        <img
                          src={unit.profileGroups[0].profiles[0].logo}
                          alt={unit.isc}
                          style={{ width: 20, height: 20, marginRight: 8 }}
                        />
                      )}
                    <Typography>{unit.isc}</Typography>
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  {unit.profileGroups.map((group, grpIndex) =>
                    group.options.length > 0 ? (
                      <div
                        key={`group-${unit.isc}-${grpIndex}`}
                        style={{ marginBottom: 8 }}
                      >
                        <Typography variant="h6">{group.isc}</Typography>
                        {group.profiles && group.profiles[0] && (
                          <UnitDetails profile={group.profiles[0]} />
                        )}
                        {group.options.map((option, optIndex) => (
                          <div
                            key={`option-${group.isc}-${optIndex}`}
                            style={{ paddingLeft: 16 }}
                          >
                            <Typography variant="body2">
                              {option.name}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    ) : null
                  )}
                  {unit.options && unit.options.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <Typography variant="subtitle1">Unit Options</Typography>
                      {unit.options.map((option, idx) => (
                        <Typography
                          key={`unit-option-${unit.isc}-${idx}`}
                          variant="body2"
                        >
                          {option.name}
                        </Typography>
                      ))}
                    </div>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrooperModalOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CompanyPage;

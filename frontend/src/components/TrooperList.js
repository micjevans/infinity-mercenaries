import {
  List,
  Typography,
  Box,
  CircularProgress,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Trooper from "./Trooper";
import EditTrooperDialog from "./EditTrooperDialog";
import { useAuth } from "../auth/AuthContext";
import AddTrooperDialog from "./AddTrooperDialog";
import {
  getTroopers,
  addTrooper,
  updateTrooper,
  deleteTrooper,
} from "../services/trooperService";
import { updateCompanyDetails } from "../services/companyService";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupIcon from "@mui/icons-material/Group";
import AddIcon from "@mui/icons-material/Add";

const factionsContext = require.context("../data/factions", false, /\.json$/);
const loadFactionData = (slug) => {
  try {
    return factionsContext(`./${slug}.json`);
  } catch (error) {
    console.error("Error loading faction data for", slug, error);
    return null;
  }
};

const TrooperList = ({ company, setCompany }) => {
  const [editingTrooper, setEditingTrooper] = useState(null);
  const { user } = useAuth(); // Get the logged-in user
  const [troopers, setTroopers] = useState([]);
  const [trooperModalOpen, setTrooperModalOpen] = useState(false);
  const [loadingTroopers, setLoadingTroopers] = useState(true);
  const [units, setUnits] = useState([]);
  const [specops, setSpecops] = useState({
    equip: [],
    skills: [],
    weapons: [],
  });

  // Add state for accordion expansion (default to expanded)
  const [expanded, setExpanded] = useState(true);

  // Create a ref for the Add Trooper button
  const addTrooperButtonRef = useRef(null);

  // Extract local flag from company
  const isLocal = company?.local;

  // Handle accordion expansion
  const handleAccordionChange = (event, isExpanded) => {
    setExpanded(isExpanded);
  };

  const handleEditTrooper = (trooper) => {
    setEditingTrooper(trooper);
  };

  const handleCloseEditDialog = () => {
    setEditingTrooper(null);
  };

  useEffect(() => {
    if (trooperModalOpen) {
      // Gather selected sectorials (only add ones that are selected)
      const selectedSectors = [
        company?.sectorial1?.slug,
        company?.sectorial2?.slug,
      ].filter(Boolean);

      const unitsArrays = selectedSectors.map((sector) => {
        console.info("Loading units for", sector);
        const data = loadFactionData(sector);
        if (!data) return [];

        const addSpecOpsDataType = (prev, type) => [
          ...prev[type],
          ...(data.specops[type].filter((toAdd) => {
            return !prev[type].some(
              (existing) => JSON.stringify(existing) === JSON.stringify(toAdd)
            );
          }) || []),
        ];

        // Add specops data
        if (data.specops) {
          setSpecops((prev) => ({
            equip: data.specops.equip
              ? addSpecOpsDataType(prev, "equip")
              : prev.equip,
            skills: data.specops.skills
              ? addSpecOpsDataType(prev, "skills")
              : prev.skills,
            weapons: data.specops.weapons
              ? addSpecOpsDataType(prev, "weapons")
              : prev.weapons,
          }));
        }

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
  }, [
    trooperModalOpen,
    company.sectorials,
    company?.sectorial1?.slug,
    company?.sectorial2?.slug,
  ]);

  // Define the handleAddTrooper function - now using the service with local flag
  const handleAddTrooper = async (trooper) => {
    try {
      // Pass isLocal flag to addTrooper service
      const newTrooper = await addTrooper(
        company.id,
        trooper,
        user.uid,
        isLocal
      );

      // Append the full trooper object to the company list
      setTroopers((prev) => [...prev, newTrooper]);

      // Close the AddTrooperDialog after adding
      setTrooperModalOpen(false);

      // Delay focus to ensure the dialog is closed
      setTimeout(() => {
        if (addTrooperButtonRef.current) {
          addTrooperButtonRef.current.focus();
        }
      }, 0);
    } catch (error) {
      console.error("Error adding trooper:", error);
    }
  };

  // Function to handle trooper deletion with local flag
  const handleDeleteTrooper = async (trooperId) => {
    if (!user?.uid || !company?.id) return;

    try {
      // Pass isLocal flag to deleteTrooper service
      await deleteTrooper(company.id, trooperId, user.uid, isLocal);

      // Update local state after successful deletion
      setTroopers((prevTroopers) =>
        prevTroopers.filter((trooper) => trooper.id !== trooperId)
      );
    } catch (error) {
      console.error("Error deleting trooper:", error);
    }
  };

  useEffect(() => {
    if (!user || !company.id) return;

    setLoadingTroopers(true);

    // Use the service function to fetch troopers with local flag
    const fetchTroopers = async () => {
      try {
        const troopersList = await getTroopers(company.id, user.uid, isLocal);
        setTroopers(troopersList);
        console.log("Troopers loaded:", troopersList);
        setLoadingTroopers(false);
      } catch (error) {
        console.error("Error fetching troopers:", error);
        setLoadingTroopers(false);
      }
    };

    fetchTroopers();
  }, [company.id, user, isLocal]);

  // Function to save trooper changes using our service
  const saveTrooperChanges = async (updatedTrooper, updatedInventory) => {
    if (!user?.uid || !company?.id) return;

    try {
      // Update the trooper using the service function with local flag
      await updateTrooper(company.id, updatedTrooper, user.uid, isLocal);

      // Update local state for troopers
      setTroopers((prevTroopers) =>
        prevTroopers.map((t) =>
          t.id === updatedTrooper.id ? updatedTrooper : t
        )
      );

      // Update company inventory using company service with local flag
      await updateCompanyDetails(
        user.uid,
        company.id,
        {
          inventory: updatedInventory,
        },
        isLocal
      );

      // Update local company state
      setCompany((prev) => ({
        ...prev,
        inventory: updatedInventory,
      }));

      // Close the edit dialog
      setEditingTrooper(null);
    } catch (error) {
      console.error("Error updating trooper:", error);
    }
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={handleAccordionChange}
      sx={{
        mb: 3,
        boxShadow: 3,
        "&:before": { display: "none" }, // Remove the default divider
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: "primary.contrastText" }} />}
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          height: 64,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            pr: 2, // Add padding to right to avoid overlap with expand icon
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <GroupIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Troopers</Typography>
          </Box>

          {/* Add Trooper Button in header */}
          <Button
            ref={addTrooperButtonRef}
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // Prevent accordion toggle when clicking button
              setTrooperModalOpen(true);
            }}
            sx={{
              minWidth: "auto",
              "&:hover": { backgroundColor: "secondary.dark" },
            }}
          >
            {troopers.length === 0 ? "Create Captain" : "Add Trooper"}
          </Button>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0, pt: 2 }}>
        {/* Trooper List Section */}
        <List>
          {loadingTroopers ? (
            <Box
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "20px 0",
              }}
            >
              <CircularProgress />
            </Box>
          ) : troopers.length > 0 ? (
            troopers.map((trooper, index) => (
              <div key={index}>
                <Trooper
                  trooper={trooper}
                  onUpdate={() => {}}
                  onClick={() => handleEditTrooper(trooper)}
                  onDelete={() => handleDeleteTrooper(trooper.id)}
                />
              </div>
            ))
          ) : (
            <Typography align="center" sx={{ py: 3 }}>
              No troopers found. Add a captain to get started!
            </Typography>
          )}
        </List>

        {editingTrooper && (
          <EditTrooperDialog
            open={Boolean(editingTrooper)}
            onClose={handleCloseEditDialog}
            trooperToEdit={editingTrooper}
            companyInventory={company.inventory || []}
            saveChanges={saveTrooperChanges}
            isLocal={isLocal} // Pass isLocal to EditTrooperDialog
          />
        )}

        <AddTrooperDialog
          open={trooperModalOpen}
          onClose={() => setTrooperModalOpen(false)}
          units={units}
          specops={specops}
          isCreatingCaptain={troopers.length === 0} // Pass prop to indicate captain creation
          onAddTrooper={handleAddTrooper} // pass down the handler
          isLocal={isLocal} // Pass isLocal to AddTrooperDialog
        />
      </AccordionDetails>
    </Accordion>
  );
};

export default TrooperList;

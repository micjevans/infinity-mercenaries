import { List, Typography, Box, CircularProgress, Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Trooper from "./Trooper";
import EditTrooperDialog from "./EditTrooperDialog";
import { useAuth } from "../auth/AuthContext";
import AddTrooperDialog from "./AddTrooperDialog";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
// Import the new trooper service functions
import { getTroopers, addTrooper } from "../services/trooperService";

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
  // Create a ref for the Add Trooper button
  const addTrooperButtonRef = useRef(null);
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
            equip: addSpecOpsDataType(prev, "equip"),
            skills: addSpecOpsDataType(prev, "skills"),
            weapons: addSpecOpsDataType(prev, "weapons"),
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

  // Define the handleAddTrooper function - now using the service
  const handleAddTrooper = async (trooper) => {
    try {
      // Use the service function instead of direct Firebase calls
      const newTrooper = await addTrooper(company.id, trooper, user.uid);

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

  useEffect(() => {
    if (!user || !company.id) return;

    setLoadingTroopers(true);

    // Use the service function instead of duplicating the fetch logic
    const fetchTroopers = async () => {
      try {
        const troopersList = await getTroopers(company.id, user.uid);
        setTroopers(troopersList);
        console.log("Troopers loaded:", troopersList);
        setLoadingTroopers(false);
      } catch (error) {
        console.error("Error fetching troopers:", error);
        setLoadingTroopers(false);
      }
    };

    fetchTroopers();
  }, [company.id, user]);

  return (
    <>
      {/* Action Buttons Row */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button
          ref={addTrooperButtonRef}
          onClick={() => setTrooperModalOpen(true)}
          variant="contained"
          color="primary"
        >
          {troopers.length === 0 ? "Create Captain" : "Add Trooper"}
        </Button>
      </Box>
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
              />
            </div>
          ))
        ) : (
          <Typography>No troopers found.</Typography>
        )}
      </List>
      {editingTrooper && (
        <EditTrooperDialog
          open={Boolean(editingTrooper)}
          onClose={handleCloseEditDialog}
          trooperToEdit={editingTrooper}
          companyInventory={company.inventory || []}
          saveChanges={async (trooper, updatedInventory) => {
            try {
              // Update the trooper in Firestore
              const trooperRef = doc(
                db,
                "users",
                user.uid,
                "companies",
                company.id,
                "troopers",
                trooper.id
              );
              await updateDoc(trooperRef, trooper);

              // Update the local state for troopers
              setTroopers((prev) =>
                prev.map((t) => (t.id === trooper.id ? trooper : t))
              );

              // Update company inventory in Firestore
              const companyRef = doc(
                db,
                "users",
                user.uid,
                "companies",
                company.id
              );

              await updateDoc(companyRef, {
                inventory: updatedInventory,
              });

              // Update local company state
              setCompany((prev) => ({
                ...prev,
                inventory: updatedInventory,
              }));
            } catch (error) {
              console.error("Error updating trooper:", error);
            }
          }}
        />
      )}
      <AddTrooperDialog
        open={trooperModalOpen}
        onClose={() => setTrooperModalOpen(false)}
        units={units}
        specops={specops}
        isCreatingCaptain={troopers.length === 0} // Pass prop to indicate captain creation
        onAddTrooper={handleAddTrooper} // pass down the handler
      />
    </>
  );
};

export default TrooperList;

import { List, Typography, Box, CircularProgress, Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Trooper from "./Trooper";
import EditTrooperDialog from "./EditTrooperDialog";
import { useAuth } from "../auth/AuthContext";
import AddTrooperDialog from "./AddTrooperDialog";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

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

  // Define the handleAddTrooper function
  const handleAddTrooper = async (trooper) => {
    try {
      // Add the trooper to Firestore
      const troopersRef = collection(
        db,
        "users",
        user.uid,
        "companies",
        company.id,
        "troopers"
      );

      delete trooper.id; // Remove the ID field before adding

      const docRef = await addDoc(troopersRef, trooper);

      // Add the new trooper to state with its ID
      const newTrooper = {
        id: docRef.id,
        ...trooper,
      };

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

    const fetchTroopers = async () => {
      try {
        // Fetch troopers for this company
        const troopersRef = collection(
          db,
          "users",
          user.uid,
          "companies",
          company.id,
          "troopers"
        );
        const snapshot = await getDocs(troopersRef);
        const troopersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTroopers(troopersList);
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
          Add Trooper
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
          companyInventory={company.inventory}
          saveChanges={async (trooper, removedItems) => {
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

              // Update the local state
              setTroopers((prev) =>
                prev.map((t) => (t.id === trooper.id ? trooper : t))
              );

              const companyRef = doc(
                db,
                "users",
                user.uid,
                "companies",
                company.id
              );

              const newCompanyInventory = company.inventory.filter(
                (item) =>
                  !removedItems.some((removed) => removed.uuid === item.uuid)
              );
              await updateDoc(companyRef, {
                inventory: newCompanyInventory,
              });
              // Update company inventory by filtering out removed items
              setCompany((prev) => ({
                ...prev,
                inventory: newCompanyInventory,
              }));

              // TODO: Update the company inventory in Firestore if needed
              // This would require another updateDoc call to update the company document
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
        onAddTrooper={handleAddTrooper} // pass down the handler
      />
    </>
  );
};

export default TrooperList;

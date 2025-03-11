import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  List,
  Paper,
  Button,
  TextField,
  Modal,
  Box,
  CircularProgress,
  ListItemButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import metadata from "../data/factions/metadata";

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState("");
  const [sectorial1, setSectorial1] = useState(null);
  const [sectorial2, setSectorial2] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  // Add state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);

  const handleOpen = () => {
    setSectorial1(null);
    setSectorial2(null);
    setNewCompany("");
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (!user) return; // Wait until user is loaded

    const fetchCompanies = async () => {
      try {
        const companiesRef = collection(db, "users", user.uid, "companies");
        const snapshot = await getDocs(companiesRef);
        const companiesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCompanies(companiesList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [user]); // Run when user changes

  const handleSectorial1Change = (e) => {
    const selectedId = Number(e.target.value);
    const selectedFaction = metadata.factions.find(
      (faction) => faction.id === selectedId
    );
    if (!selectedFaction) {
      console.error("Selected faction not found:", selectedId);
      return;
    }
    setSectorial1(selectedFaction);
    // If the selected faction is a parent faction, reset sectorial2
    if (selectedFaction.id === selectedFaction.parent) {
      setSectorial2(null);
    }
  };

  const handleSectorial2Change = (e) => {
    const selectedId = Number(e.target.value);
    const selectedFaction = metadata.factions.find(
      (faction) => faction.id === selectedId
    );
    if (!selectedFaction) {
      console.error("Selected faction not found:", selectedId);
      return;
    }
    setSectorial2(selectedFaction);
  };

  const handleAddCompany = async () => {
    if (!user || !sectorial1) return; // Ensure user is logged in and sectorial1 is selected

    try {
      const companiesRef = collection(db, "users", user.uid, "companies");
      const newCompanyData = {
        name: newCompany,
        sectorial1: sectorial1,
        sectorial2: sectorial2,
        credits: 0,
        swc: 0,
        sponsor: "",
        notoriety: 0,
        description: "",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(companiesRef, newCompanyData);

      // Add the new company to state with its ID
      const addedCompany = {
        id: docRef.id,
        ...newCompanyData,
        createdAt: { seconds: Date.now() / 1000 }, // Use current timestamp for UI until it refreshes
      };

      setCompanies((prev) => [...prev, addedCompany]);
      setNewCompany("");
      setSectorial1(null);
      setSectorial2(null);
      handleClose(); // Close the modal
    } catch (error) {
      console.error("Error adding company:", error);
    }
  };

  // Handle opening the delete confirmation dialog
  const handleDeleteClick = (event, company) => {
    // Stop propagation to prevent navigation to company page
    event.stopPropagation();
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  // Handle closing the delete confirmation dialog
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  // Handle confirming deletion
  const handleDeleteConfirm = async () => {
    if (!user || !companyToDelete) return;

    try {
      // Delete the company from Firestore
      const companyRef = doc(
        db,
        "users",
        user.uid,
        "companies",
        companyToDelete.id
      );
      await deleteDoc(companyRef);

      // Remove the company from state
      setCompanies(
        companies.filter((company) => company.id !== companyToDelete.id)
      );

      // Show success message or other feedback here if needed

      // Close the dialog
      handleDeleteDialogClose();
    } catch (error) {
      console.error("Error deleting company:", error);
      // Handle error (could show an error message)
      handleDeleteDialogClose();
    }
  };

  return (
    <Container maxWidth="md" style={{ marginTop: "20px" }}>
      <Typography variant="h4" gutterBottom>
        My Companies
      </Typography>
      {/* Add Company Section */}
      <Paper style={{ padding: "16px", marginBottom: "20px" }}>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Add Company
        </Button>
      </Paper>
      {/* Company List Section */}
      <Paper style={{ padding: "16px" }}>
        {loading ? (
          <Box
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "20px 0",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {companies.length > 0 ? (
              companies.map((company) => (
                <ListItemButton
                  key={company.id}
                  divider
                  onClick={() =>
                    navigate(`/companies/${company.id}`, { state: { company } })
                  } // Navigate to CompanyPage
                >
                  <ListItemText
                    primary={company.name}
                    secondary={`Created at: ${new Date(
                      company.createdAt.seconds * 1000
                    ).toLocaleString()}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(event) => handleDeleteClick(event, company)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItemButton>
              ))
            ) : (
              <Typography variant="body1" align="center">
                No companies found.
              </Typography>
            )}
          </List>
        )}
      </Paper>
      <Modal open={open} onClose={handleClose}>
        <Box
          style={{
            padding: "16px",
            margin: "auto",
            marginTop: "20vh",
            width: "300px", // Changed back to original 300px
            border: "2px solid #3f51b5",
            boxShadow: "0 0 10px #3f51b5",
            backgroundColor: "#333333", // Added dark grey background color
            color: "white", // Added white text for better contrast
          }}
        >
          <Typography variant="h6" gutterBottom>
            Add New Company
          </Typography>
          <TextField
            label="New Company Name"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            fullWidth
            style={{ marginBottom: "10px" }}
            // Improved TextField styling for dark background
            InputLabelProps={{ style: { color: "white" } }}
            InputProps={{ style: { color: "white" } }}
          />

          <FormControl fullWidth style={{ marginBottom: "10px" }}>
            <InputLabel id="sectorial1-label">Sectorial 1</InputLabel>
            <Select
              labelId="sectorial1-label"
              value={sectorial1 ? sectorial1.id : ""}
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
            style={{ marginBottom: "10px" }}
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

          <Button
            variant="contained"
            color="primary"
            onClick={handleAddCompany}
            disabled={!newCompany || !sectorial1}
          >
            Add Company
          </Button>
        </Box>
      </Modal>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Delete Company"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the company "{companyToDelete?.name}
            "? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CompanyList;

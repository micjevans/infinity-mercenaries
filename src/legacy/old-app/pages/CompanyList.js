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
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import StorageIcon from "@mui/icons-material/Storage"; // For Firebase companies
import DevicesIcon from "@mui/icons-material/Devices"; // For local companies
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  getUserCompanies,
  createCompany as createCompanyService,
  deleteCompany,
} from "../services/companyService";

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);

  const handleOpen = () => {
    setNewCompany("");
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // Filter companies based on search term
  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!user) return; // Wait until user is loaded

    const fetchCompanies = async () => {
      try {
        // Fetch both local and database companies
        const dbCompanies = await getUserCompanies(user.uid);
        const localCompanies = await getUserCompanies(user.uid, true);

        // Combine the lists, ensuring we don't have duplicates
        // (although local and DB companies should have different IDs)
        const allCompanies = [...dbCompanies, ...localCompanies];

        setCompanies(allCompanies);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [user]); // Run when user changes

  const handleAddCompany = async () => {
    if (!user) return; // Ensure user is logged in

    try {
      const newCompanyData = {
        name: newCompany,
        sectorial1: null,
        sectorial2: null,
        credits: 0,
        swc: 0,
        sponsor: "",
        notoriety: 0,
        description: "",
        userId: user.uid, // Add userId to the company data
      };

      // Create a local company (pass true as the last parameter)
      const companyId = await createCompanyService(
        user.uid,
        newCompanyData,
        true
      );

      // Add the new company to state with its ID
      const addedCompany = {
        id: companyId,
        ...newCompanyData,
        createdAt: { seconds: Date.now() / 1000 }, // Use current timestamp for UI
        local: true, // Mark as local company
      };

      setCompanies((prev) => [...prev, addedCompany]);
      setNewCompany("");
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
      // Delete from the appropriate storage (local or Firebase)
      await deleteCompany(user.uid, companyToDelete.id, companyToDelete.local);

      // Remove the company from state
      setCompanies(
        companies.filter((company) => company.id !== companyToDelete.id)
      );

      // Close the dialog
      handleDeleteDialogClose();
    } catch (error) {
      console.error("Error deleting company:", error);
      handleDeleteDialogClose();
    }
  };

  // Helper function to format the creation date
  const formatCreationDate = (company) => {
    // Check if createdAt is a timestamp object or an ISO string
    if (company.createdAt?.seconds) {
      return new Date(company.createdAt.seconds * 1000).toLocaleString();
    } else if (company.createdAt) {
      return new Date(company.createdAt).toLocaleString();
    }
    return "Unknown date";
  };

  return (
    <Container maxWidth="md" style={{ marginTop: "20px" }}>
      {/* Action row with search and add button */}
      <Paper style={{ padding: "16px", marginBottom: "20px" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TextField
            placeholder="Search companies..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: "60%" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" color="primary" onClick={handleOpen}>
            Add Company
          </Button>
        </Box>
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
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <ListItemButton
                  key={company.id}
                  divider
                  onClick={() =>
                    navigate(`/companies/${company.id}`, {
                      state: {
                        company,
                        isLocal: !!company.local,
                      },
                    })
                  } // Navigate to CompanyPage with local flag
                >
                  <Tooltip
                    title={
                      company.local ? "Stored locally" : "Stored in database"
                    }
                  >
                    <IconButton size="small" sx={{ mr: 1 }}>
                      {company.local ? (
                        <DevicesIcon color="primary" />
                      ) : (
                        <StorageIcon color="secondary" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <ListItemText
                    primary={company.name}
                    secondary={`Created at: ${formatCreationDate(company)}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(event) => handleDeleteClick(event, company)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItemButton>
              ))
            ) : (
              <Typography variant="body1" align="center">
                {searchTerm
                  ? "No matching companies found."
                  : "No companies found."}
              </Typography>
            )}
          </List>
        )}
      </Paper>

      {/* Add Company Modal */}
      <Modal open={open} onClose={handleClose}>
        <Box
          style={{
            padding: "16px",
            margin: "auto",
            marginTop: "20vh",
            width: "300px",
            border: "2px solid #3f51b5",
            boxShadow: "0 0 10px #3f51b5",
            backgroundColor: "#333333",
            color: "white",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Add New Local Company
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 2, display: "block" }}
          >
            This company will be stored locally on your device.
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

          <Button
            variant="contained"
            color="primary"
            onClick={handleAddCompany}
            disabled={!newCompany}
          >
            Add Local Company
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
            Are you sure you want to delete the
            {companyToDelete?.local ? " local " : " "}
            company "{companyToDelete?.name}
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

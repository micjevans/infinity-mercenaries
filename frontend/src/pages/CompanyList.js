import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Button,
  TextField,
  Modal,
  Box,
  CircularProgress,
  ListItemButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext"; // Assuming Firebase Auth Context
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase"; // Import your firebase config with initialized db

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState("");
  const { user } = useAuth(); // Get the logged-in user
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const handleOpen = () => setOpen(true);
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

  const handleAddCompany = async () => {
    if (!user) return; // Ensure user is logged in

    try {
      const companiesRef = collection(db, "users", user.uid, "companies");
      const newCompanyData = {
        name: newCompany,
        sectorials: [],
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
      handleClose(); // Close the modal
    } catch (error) {
      console.error("Error adding company:", error);
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
            width: "300px",
            border: "2px solid #3f51b5",
            boxShadow: "0 0 10px #3f51b5",
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
            style={{ marginBottom: "10px", backgroundColor: "primary" }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddCompany}
          >
            Add Company
          </Button>
        </Box>
      </Modal>
    </Container>
  );
};

export default CompanyList;

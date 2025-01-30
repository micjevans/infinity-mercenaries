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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config"; // Import the API URL
import { useAuth } from "../auth/AuthContext"; // Assuming Firebase Auth Context

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState("");
  const { user } = useAuth(); // Get the logged-in user
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return; // Wait until user is loaded

    fetch(`${API_BASE_URL}/users/${user.uid}/companies`)
      .then((res) => res.json())
      .then((data) => setCompanies(data))
      .catch((error) => console.error("Error fetching companies:", error));
  }, [user]); // Run when user changes

  const handleAddCompany = () => {
    if (!user) return; // Ensure user is logged in

    fetch(`${API_BASE_URL}/users/${user.uid}/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCompany }),
    })
      .then((res) => res.json())
      .then((data) => {
        setCompanies((prev) => [...prev, data]); // Add new company to the list
        setNewCompany("");
      })
      .catch((error) => console.error("Error adding company:", error));
  };

  return (
    <Container maxWidth="md" style={{ marginTop: "20px" }}>
      <Typography variant="h4" gutterBottom>
        My Companies
      </Typography>
      {/* Add Company Section */}
      <Paper style={{ padding: "16px", marginBottom: "20px" }}>
        <TextField
          label="New Company Name"
          value={newCompany}
          onChange={(e) => setNewCompany(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <Button variant="contained" color="primary" onClick={handleAddCompany}>
          Add Company
        </Button>
      </Paper>
      {/* Company List Section */}
      <Paper style={{ padding: "16px" }}>
        <List>
          {companies.length > 0 ? (
            companies.map((company) => (
              <ListItem
                key={company.id}
                divider
                button="true"
                onClick={() => navigate(`/companies/${company.id}`)} // Navigate to CompanyPage
              >
                <ListItemText
                  primary={company.name}
                  secondary={`Created at: ${new Date(
                    company.createdAt.seconds * 1000
                  ).toLocaleString()}`}
                />
              </ListItem>
            ))
          ) : (
            <Typography variant="body1" align="center">
              No companies found.
            </Typography>
          )}
        </List>
      </Paper>
    </Container>
  );
};

export default CompanyList;

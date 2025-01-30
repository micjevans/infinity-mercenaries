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
import { API_BASE_URL } from "../config"; // Import the API URL

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/getCompanies`)
      .then((res) => res.json())
      .then((data) => setCompanies(data))
      .catch((error) => console.error("Error fetching companies:", error));
  }, []);

  const handleAddCompany = () => {
    fetch(`${API_BASE_URL}/addCompany`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCompany, userId: "user123" }), // Replace with dynamic userId
    })
      .then((res) => res.json())
      .then((data) => {
        setCompanies((prev) => [...prev, data]);
        setNewCompany("");
      })
      .catch((error) => console.error("Error adding company:", error));
  };

  return (
    <Container maxWidth="md" style={{ marginTop: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Company List
      </Typography>
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
      <Paper style={{ padding: "16px" }}>
        <List>
          {companies.length > 0 ? (
            companies.map((company) => (
              <ListItem key={company.id} divider>
                <ListItemText
                  primary={company.name}
                  secondary={`User ID: ${company.userId}`}
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

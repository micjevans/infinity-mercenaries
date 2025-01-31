import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  List,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Paper,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { API_BASE_URL } from "../config";
import { useAuth } from "../auth/AuthContext"; // Assuming Firebase Auth Context

const CompanyPage = () => {
  const [newTrooper, setNewTrooper] = useState("");
  const { companyId } = useParams(); // Get the companyId from the route
  const [companyName, setCompanyName] = useState("");
  const [troopers, setTroopers] = useState([]);
  const { user } = useAuth(); // Get the logged-in user

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

    fetch(`${API_BASE_URL}/users/${user.uid}/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTrooper }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTroopers((prev) => [...prev, data]); // Add new company to the list
        setNewTrooper("");
      })
      .catch((error) => console.error("Error adding company:", error));
  };

  return (
    <Container maxWidth="md" style={{ marginTop: "20px" }}>
      <Typography variant="h4" gutterBottom>
        {companyName || "Company"}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Troopers
      </Typography>
      {/* Add Trooper Section */}
      <Paper style={{ padding: "16px", marginBottom: "20px" }}>
        <TextField
          label="New Company Name"
          value={newTrooper}
          onChange={(e) => setNewTrooper(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <Button variant="contained" color="primary" onClick={handleAddTrooper}>
          Add Trooper
        </Button>
      </Paper>
      {/* Trooper List Section */}
      <List>
        {troopers.length > 0 ? (
          troopers.map((trooper) => (
            <Accordion key={trooper.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{trooper.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>Role: TBD</Typography>
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Typography>No troopers found.</Typography>
        )}
      </List>
    </Container>
  );
};

export default CompanyPage;

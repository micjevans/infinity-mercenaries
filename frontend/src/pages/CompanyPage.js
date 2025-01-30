import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  List,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { API_BASE_URL } from "../config";
import { useAuth } from "../auth/AuthContext"; // Assuming Firebase Auth Context

const CompanyPage = () => {
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
  }, [companyId]);

  return (
    <Container maxWidth="md" style={{ marginTop: "20px" }}>
      <Typography variant="h4" gutterBottom>
        {companyName || "Company"}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Troopers
      </Typography>
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

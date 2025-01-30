import React from "react";
import { Container, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <Container maxWidth="md" style={{ textAlign: "center", marginTop: "10vh" }}>
      <Typography variant="h2" gutterBottom>
        Welcome to Mercenaries
      </Typography>
      <Typography variant="h5" style={{ marginBottom: "20px" }}>
        Create, customize, and compete with your mercenary company.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        component={Link}
        to="/companies"
      >
        Get Started
      </Button>
    </Container>
  );
};

export default LandingPage;

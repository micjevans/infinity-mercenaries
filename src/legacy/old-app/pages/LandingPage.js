import React from "react";
import { Container, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import backgroundImage from "../assets/images/landing-background.jpg";

const LandingPage = () => {
  return (
    <Box
      sx={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="md" style={{ textAlign: "center" }}>
        <Typography variant="h2" gutterBottom style={{ color: "#FFFFFF" }}>
          Welcome to Infinity Mercenaries
        </Typography>
        <Typography
          variant="h5"
          style={{ marginBottom: "20px", color: "#FFFFFF" }}
        >
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
    </Box>
  );
};

export default LandingPage;

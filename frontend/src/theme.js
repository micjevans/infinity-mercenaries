import { createTheme } from "@mui/material/styles";
import "@fontsource/exo-2"; // Defaults to weights 400 and 700

const theme = createTheme({
  palette: {
    primary: {
      main: "#2B005C", // Deep purple
    },
    secondary: {
      main: "#FFC107", // Neon yellow
    },
    background: {
      default: "#121212", // Dark background
      paper: "#1E1E1E", // Slightly lighter for cards, etc.
    },
    text: {
      primary: "#FFFFFF", // White text
      secondary: "#B0B0B0", // Light gray for secondary text
    },
  },
  typography: {
    fontFamily: [
      "'Exo 2'", // Primary font
      "Roboto", // Fallback font
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "3rem",
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    },
    h2: {
      fontSize: "2.5rem",
      fontWeight: 600,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 400,
    },
    button: {
      fontSize: "1rem",
      fontWeight: 700,
      textTransform: "uppercase",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px", // Rounded edges
          boxShadow: "0 0 8px rgba(255, 193, 7, 0.6)", // Neon glow
          "&:hover": {
            boxShadow: "0 0 12px rgba(255, 193, 7, 0.9)", // Stronger glow on hover
            transform: "scale(1.05)",
            transition: "all 0.2s ease-in-out",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(18, 18, 18, 0.8)", // Semi-transparent background
          backdropFilter: "blur(10px)", // Glass-like effect
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "linear-gradient(145deg, #1E1E1E, #2B005C)", // Gradient background
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4)",
          borderRadius: "12px",
        },
      },
    },
  },
});

export default theme;

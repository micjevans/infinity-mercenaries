import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
  IconButton,
  useTheme,
} from "@mui/material";
// Remove ThemeProvider import
import { DataGrid } from "@mui/x-data-grid";
import { getEvents } from "../services/eventService";
import { useAuth } from "../auth/AuthContext";
import SearchIcon from "@mui/icons-material/Search";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AddIcon from "@mui/icons-material/Add";

const EventListPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const theme = useTheme();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventData = await getEvents();
        setEvents(eventData);
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Format date for display - improved robustness
  const formatEventDate = (date) => {
    if (!date) return "TBD";
    try {
      const seconds = date?.seconds ? date.seconds : date / 1000;
      return new Date(seconds * 1000).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  // Define columns for the data grid - with added safety checks
  const columns = [
    {
      field: "icon",
      headerName: "",
      width: 50,
      sortable: false,
      renderCell: () => <EventIcon color="primary" />,
    },
    {
      field: "name",
      headerName: "Event Name",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: "medium" }}>
          {params.value || "Unnamed Event"}
        </Typography>
      ),
    },
    {
      field: "startDate",
      headerName: "Date",
      width: 180,
      valueGetter: (params) => {
        // More defensive null checking
        if (!params || !params.row) return null;

        try {
          return params.row.startDate
            ? new Date(params.row.startDate.seconds * 1000)
            : null;
        } catch (error) {
          return null;
        }
      },
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <CalendarTodayIcon
            fontSize="small"
            sx={{ mr: 1, color: "text.secondary" }}
          />
          <Typography variant="body2">
            {params.row ? formatEventDate(params.row.startDate) : "TBD"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "location",
      headerName: "Location",
      width: 180,
      valueGetter: (params) => {
        if (!params) return "TBD";
        return params.row?.location || "TBD";
      },
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <LocationOnIcon
            fontSize="small"
            sx={{ mr: 1, color: "text.secondary" }}
          />
          <Typography variant="body2">{params.value || "TBD"}</Typography>
        </Box>
      ),
    },
    {
      field: "participants",
      headerName: "Participants",
      width: 130,
      valueGetter: (params) => {
        if (!params) return 0;
        return params.row?.participants?.length || 0;
      },
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <PeopleIcon
            fontSize="small"
            sx={{ mr: 1, color: "text.secondary" }}
          />
          <Typography variant="body2">{params.value || 0}</Typography>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 50,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton
            onClick={() =>
              params.row?.id && navigate(`/events/${params.row.id}`)
            }
            size="small"
            disabled={!params.row?.id}
          >
            <ArrowForwardIosIcon
              fontSize="small"
              sx={{ color: theme.palette.text.primary }} // Set color to match paper background
            />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  // Filter events and ensure all items have an id
  const filteredEvents = events
    .filter((event) => event && typeof event === "object") // Filter out undefined/null events
    .filter((event) =>
      event && event.name
        ? event.name.toLowerCase().includes(searchTerm.toLowerCase())
        : false
    )
    .map((event) => ({
      ...event,
      id: event.id || `temp-${Math.random().toString(36).substring(7)}`, // Ensure each row has an id
    }));

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header Section */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4" component="h1">
            Events
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse and join upcoming Infinity events
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            component={Link}
            to="/events/create"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
          >
            Create New Event
          </Button>
        )}
      </Box>

      {/* Search and filter section */}
      <Paper sx={{ p: 2, mb: 1 }}>
        <TextField
          placeholder="Search events..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Events DataGrid with fixed border styling */}
      <Paper
        sx={{
          height: 500,
          width: "100%",
          overflow: "hidden",
          // Add background color to the Paper to match any gaps
          padding: 1,
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <React.Fragment>
            {filteredEvents.length > 0 ? (
              <DataGrid
                rows={filteredEvents}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[5, 10, 25]}
                disableSelectionOnClick
                sx={{
                  // Override border color variable throughout the DataGrid
                  "--DataGrid-rowBorderColor": theme.palette.background.default,
                  "--DataGrid-borderColor": theme.palette.background.default,

                  // Target withBorderColor elements
                  "& .MuiDataGrid-withBorderColor": {
                    borderColor: "transparent !important",
                  },

                  // Fix root container border
                  border: "none",
                  borderColor: "transparent",
                  "& .MuiDataGrid-root": {
                    border: "none",
                  },

                  // Column headers - more specific selector with !important
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: `${theme.palette.background.paper} !important`,
                    color: theme.palette.text.primary,
                    fontSize: "0.875rem",
                    fontWeight: "bold",
                    borderBottom: "none",
                  },
                  // Target individual header cells for better specificity
                  "& .MuiDataGrid-columnHeader": {
                    backgroundColor: `${theme.palette.background.paper} !important`,
                    "&:hover": {
                      backgroundColor: `${theme.palette.background.paper} !important`,
                    },
                    "&:focus, &:focus-within": {
                      backgroundColor: `${theme.palette.background.paper} !important`,
                    },
                  },

                  // Cell styling
                  "& .MuiDataGrid-cell": {
                    display: "flex",
                    alignItems: "center",
                    border: "none",
                    borderBottom: `3px solid ${theme.palette.background.paper}`,
                    "&:focus, &:focus-within": {
                      outline: "none",
                    },
                  },

                  // VirtualScroller content and renderZone
                  "& .MuiDataGrid-virtualScrollerContent, & .MuiDataGrid-virtualScrollerRenderZone":
                    {
                      backgroundColor: theme.palette.background.default,
                      border: "none !important",
                    },

                  // First visible row styling
                  "& .MuiDataGrid-row--firstVisible": {
                    borderTop: "none !important",
                  },

                  // Last visible row styling
                  "& .MuiDataGrid-row--lastVisible": {
                    borderBottom: "none !important",
                  },

                  // Row styling
                  "& .MuiDataGrid-row": {
                    border: "none",
                    backgroundColor: theme.palette.background.default,
                    "&:hover": {
                      backgroundColor: "action.hover",
                      cursor: "pointer",
                    },
                  },

                  // Footer container
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: `1px solid ${theme.palette.divider}`,
                    borderColor: theme.palette.divider,
                  },

                  // Fix column separators
                  "& .MuiDataGrid-columnSeparator": {
                    visibility: "hidden",
                  },

                  // Fix main grid and filler elements
                  "& .MuiDataGrid-main, & .MuiDataGrid-filler": {
                    backgroundColor: theme.palette.background.paper,
                    border: "none !important",
                    "--rowBorderColor": `${theme.palette.background.paper} !important`,
                  },

                  // Rows border bottom
                  "& .MuiDataGrid-row--borderBottom": {
                    borderBottomColor: "transparent",
                  },
                }}
                onRowClick={(params) =>
                  params?.id && navigate(`/events/${params.id}`)
                }
                components={{
                  // Remove Toolbar component to simplify
                  NoRowsOverlay: () => (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <Typography color="text.secondary">
                        {searchTerm
                          ? "No matching events found."
                          : "No events available at this time."}
                      </Typography>
                    </Box>
                  ),
                }}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography color="text.secondary">
                  {searchTerm
                    ? "No matching events found."
                    : "No events available at this time."}
                </Typography>
              </Box>
            )}
          </React.Fragment>
        )}
      </Paper>
    </Container>
  );
};

export default EventListPage;

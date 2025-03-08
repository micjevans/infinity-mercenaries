import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Box,
  CircularProgress,
} from "@mui/material";
import { getEvents } from "../services/eventService";
import { useAuth } from "../auth/AuthContext";

const EventListPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth(); // Remove unused 'user' variable

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

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Events
        </Typography>
        {isAdmin && (
          <Button
            component={Link}
            to="/events/create"
            variant="contained"
            color="primary"
          >
            Create New Event
          </Button>
        )}
      </Box>

      {events.length === 0 ? (
        <Typography variant="body1">
          No events available at this time.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid item xs={12} md={6} lg={4} key={event.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2">
                    {event.name}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {new Date(
                      event.startDate?.seconds * 1000
                    ).toLocaleDateString()}{" "}
                    -
                    {new Date(
                      event.endDate?.seconds * 1000
                    ).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" component="p">
                    {event.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    component={Link}
                    to={`/events/${event.id}`}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default EventListPage;

import React, { useState, useEffect } from "react";
import {
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const DeployTroopers = ({
  troopers,
  initialSelection = [],
  hasSubmitted,
  onComplete,
}) => {
  // Local state to manage selected troopers
  const [selectedTroopers, setSelectedTroopers] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Initialize from props
  useEffect(() => {
    setSelectedTroopers(initialSelection);
  }, [initialSelection]);

  // Find trooper details from ID
  const getTrooperById = (trooperId) => {
    return (
      troopers.find((t) => t.id === trooperId) || { name: "Unknown Trooper" }
    );
  };

  // Handle adding a trooper to selection
  const handleAddTrooper = (trooperId) => {
    if (selectedTroopers.some((t) => t.trooper === trooperId)) {
      return; // Already added
    }

    setSelectedTroopers([
      ...selectedTroopers,
      {
        trooper: trooperId,
        injuries: [],
        xp: {},
      },
    ]);
  };

  // Handle removing a trooper from selection
  const handleRemoveTrooper = (trooperId) => {
    setSelectedTroopers(
      selectedTroopers.filter((t) => t.trooper !== trooperId)
    );
  };

  // Show confirmation dialog
  const handleNext = () => {
    if (selectedTroopers.length === 0) {
      // Could show an error here
      return;
    }
    setConfirmDialogOpen(true);
  };

  // Handle dialog close
  const handleConfirmClose = () => {
    setConfirmDialogOpen(false);
  };

  // Handle deployment confirmation
  const handleConfirmDeploy = () => {
    setConfirmDialogOpen(false);
    onComplete(selectedTroopers);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Troopers to Deploy
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Available Troopers
              </Typography>
              <List dense>
                {troopers.map(
                  (trooper) =>
                    selectedTroopers.every(
                      (trooperResult) => trooperResult.trooper !== trooper.id
                    ) && (
                      <ListItem key={trooper.id}>
                        <img
                          src={trooper.resume.logo}
                          alt={trooper.isc}
                          style={{
                            height: 40,
                            marginRight: 8,
                          }}
                        />
                        <ListItemText
                          primary={trooper.name}
                          secondary={trooper.isc}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            disabled={
                              selectedTroopers.length >= 6 ||
                              selectedTroopers.some(
                                (t) => t.trooper === trooper.id
                              ) ||
                              hasSubmitted
                            }
                            onClick={() => handleAddTrooper(trooper.id)}
                          >
                            <AddIcon sx={{ color: "white" }} />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    )
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Deployed Troopers{" "}
                {selectedTroopers.length <= 4 && "(Elite Deployed)"}
                {selectedTroopers.length === 6 && "(Max Deployment)"}
              </Typography>
              {selectedTroopers.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No troopers deployed yet
                </Typography>
              ) : (
                <List dense>
                  {selectedTroopers.map((deployedTrooper) => {
                    const trooperDetails = getTrooperById(
                      deployedTrooper.trooper
                    );
                    return (
                      <ListItem key={deployedTrooper.trooper}>
                        <img
                          src={trooperDetails.resume.logo}
                          alt={trooperDetails.isc}
                          style={{
                            height: 40,
                            marginRight: 8,
                          }}
                        />
                        <ListItemText
                          primary={trooperDetails.name}
                          secondary={trooperDetails.isc}
                        />
                        {!trooperDetails.captain && (
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              disabled={hasSubmitted}
                              onClick={() =>
                                handleRemoveTrooper(deployedTrooper.trooper)
                              }
                            >
                              <DeleteIcon sx={{ color: "error.main" }} />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <Button
          onClick={handleNext}
          variant="contained"
          color="primary"
          disabled={selectedTroopers.length === 0 || hasSubmitted}
        >
          Next
        </Button>
      </Box>

      {/* Deployment Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleConfirmClose}
        aria-labelledby="deploy-confirm-title"
        aria-describedby="deploy-confirm-description"
      >
        <DialogTitle id="deploy-confirm-title">
          Confirm Trooper Deployment
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="deploy-confirm-description">
            Deployed Troopers cannot be changed once the mission starts. Are you
            sure this is the list you wish to play with?
          </DialogContentText>
          {selectedTroopers.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Troopers to deploy:
              </Typography>
              <ul>
                {selectedTroopers.map((t) => {
                  const trooper = troopers.find((tr) => tr.id === t.trooper);
                  return (
                    <li key={t.trooper}>
                      {trooper ? trooper.name : `Trooper ${t.trooper}`}
                    </li>
                  );
                })}
              </ul>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose}>Cancel</Button>
          <Button
            onClick={handleConfirmDeploy}
            color="primary"
            variant="contained"
          >
            Confirm Deployment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeployTroopers;

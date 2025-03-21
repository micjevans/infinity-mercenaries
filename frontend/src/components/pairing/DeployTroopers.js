import React, { useEffect } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const DeployTroopers = ({
  troopers,
  resultData,
  hasSubmitted,
  onAddTrooper,
  onRemoveTrooper,
  onNext,
}) => {
  // Find trooper details from ID
  const getTrooperById = (trooperId) => {
    return (
      troopers.find((t) => t.id === trooperId) || { name: "Unknown Trooper" }
    );
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
                    resultData.troopers.every(
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
                              resultData.troopers.length >= 6 ||
                              resultData.troopers.some(
                                (t) => t.trooper === trooper.id
                              ) ||
                              hasSubmitted
                            }
                            onClick={() => onAddTrooper(trooper.id)}
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
                {resultData.troopers.length <= 4 && "(Elite Deployed)"}
                {resultData.troopers.length === 6 && "(Max Deployment)"}
              </Typography>
              {resultData.troopers.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No troopers deployed yet
                </Typography>
              ) : (
                <List dense>
                  {resultData.troopers.map((deployedTrooper) => {
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
                                onRemoveTrooper(deployedTrooper.trooper)
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
          onClick={onNext}
          variant="contained"
          color="primary"
          disabled={resultData.troopers.length === 0}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default DeployTroopers;

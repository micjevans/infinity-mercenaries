import React from "react";
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
                {troopers.map((trooper) => (
                  <ListItem key={trooper.id}>
                    <ListItemText
                      primary={trooper.name}
                      secondary={`${trooper.type} - ${trooper.rank}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        disabled={
                          resultData.troopers.some(
                            (t) => t.trooper === trooper.id
                          ) || hasSubmitted
                        }
                        onClick={() => onAddTrooper(trooper.id)}
                      >
                        <AddIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Deployed Troopers
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
                        <ListItemText
                          primary={trooperDetails.name}
                          secondary={`${trooperDetails.type} - ${trooperDetails.rank}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            disabled={hasSubmitted}
                            onClick={() =>
                              onRemoveTrooper(deployedTrooper.trooper)
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
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

import React from "react";
import { Typography, Button, Box } from "@mui/material";

const PostMission = ({ resultData, hasSubmitted, onBack, onSubmit }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Verify Mission Results
      </Typography>

      <Typography variant="body1">
        This component will show a summary of all results for final
        verification.
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button onClick={onBack} sx={{ mr: 1 }}>
          Back
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          color="primary"
          disabled={hasSubmitted}
        >
          Submit Results
        </Button>
      </Box>
    </Box>
  );
};

export default PostMission;

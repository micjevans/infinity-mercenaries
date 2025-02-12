import { Box, Typography } from "@mui/material";
import MapItem from "./MapItem"; // Import MapItem component

const slotStyles = {
  position: "absolute",
  border: "2px dashed rgba(0,0,0,0.3)",
  borderRadius: 2,
  cursor: "pointer",
  bgcolor: "rgba(255, 255, 255, 0.3)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const TrooperSlot = ({ slot, trooper, handleSlotClick, style }) => {
  return (
    <Box
      sx={{
        ...slotStyles,
        ...style,
      }}
      onClick={(e) => {
        if (e.target.nodeName !== "IMG") handleSlotClick(slot, e);
      }}
    >
      {trooper[slot] ? (
        <MapItem
          key={trooper[slot].key}
          item={trooper[slot]}
          width={style.width}
          height={style.height}
          action={(itemData, e) => {
            handleSlotClick(slot, e);
          }}
        />
      ) : (
        <Typography variant="caption" sx={{ textTransform: "capitalize" }}>
          {slot}
        </Typography>
      )}
    </Box>
  );
};

export default TrooperSlot;

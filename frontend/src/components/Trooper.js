import React from "react";
import {
  Box,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from "@mui/material";
import {
  mapCategory,
  mapType,
  renderCharLogos,
} from "../utils/metadataMapping";
import UnitDetails from "./UnitDetails";
import ProfileDetails from "./ProfileDetails";
import { calculateLevel } from "../utils/experienceUtils";
import { renderCombinedDetails } from "../utils/trooperUtils";

const Trooper = ({ trooper, onClick, children, showAva = false }) => {
  const theme = useTheme();

  if (!trooper || !trooper.profileGroups) return null;

  const renderedTrooper = renderCombinedDetails(trooper);

  return (
    // Wrap the Accordion in a Box that applies a fixed bottom margin so that the spacing is unaffected by expansion.
    <Box sx={{ mb: 0.5 }}>
      <Accordion TransitionProps={{ unmountOnExit: true }}>
        <AccordionSummary
          expandIcon={
            <Typography color="white">
              {mapType(renderedTrooper.resume.type)}
            </Typography>
          }
          sx={{
            "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
              transform: "none",
            },
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* Level Badge */}
            {trooper.xp >= 0 ? (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  borderBottomRightRadius: 8,
                  px: 1.5,
                  py: 0.5,
                  fontWeight: "bold",
                  zIndex: 1,
                }}
              >
                Lvl {calculateLevel(trooper.xp)}
              </Box>
            ) : null}
            <img
              src={trooper.resume.logo}
              alt={trooper.isc}
              style={{
                height: 40,
                marginRight: 8,
                marginLeft: trooper.xp >= 0 ? 40 : 0,
              }}
            />
            <Typography>{trooper.isc}</Typography>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          {renderedTrooper.profileGroups.map((group, grpIndex) =>
            group.options.length > 0 ? (
              <div
                key={`group-${trooper.isc}-${grpIndex}`}
                style={{ marginBottom: 8 }}
              >
                {/* Dark neon blue category line */}
                <Box
                  sx={{
                    backgroundColor: theme.palette.primary.dark, // using theme palette
                    color: theme.palette.common.white,
                    px: 1,
                    py: 0.5,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="caption">
                    {mapCategory(group.category)}
                  </Typography>
                </Box>
                {group.profiles.map((profile, profIndex) => (
                  <div key={`profile-${trooper.isc}-${grpIndex}-${profIndex}`}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid transparent", // to keep layout consistent
                      }}
                    >
                      <Typography variant="h6">{profile.name}</Typography>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {renderCharLogos(profile.chars)}
                      </Box>
                    </Box>
                    <UnitDetails profile={profile} showAva={showAva} />
                  </div>
                ))}
                {/* Existing header bar with three titles */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "inherit",
                    color: "white",
                    px: 2,
                    py: 1,
                    mt: 1,
                  }}
                >
                  <Typography variant="body2">Name</Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Typography variant="body2">SWC</Typography>
                    <Typography variant="body2">PTS</Typography>
                  </Box>
                </Box>
                {/* Render options... */}
                {group.options.map((option, optIndex) => (
                  <div key={`option-${group.isc}-${optIndex}`}>
                    <ProfileDetails
                      option={option}
                      onClick={(option) => onClick(group, option)}
                    />
                    <Divider />
                  </div>
                ))}
              </div>
            ) : null
          )}
          {children}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default Trooper;

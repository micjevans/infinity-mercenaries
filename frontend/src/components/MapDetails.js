import React from "react";
import { createTheme, Typography } from "@mui/material";
import metadata from "../data/factions/metadata";

const MapDetails = ({ list, metaKey, preText, postText }) => {
  const theme = createTheme();

  if (!list || list.length < 1) return null;

  return (
    <Typography
      variant="body2"
      color="inherit"
      dangerouslySetInnerHTML={{
        __html: `${preText ? `${preText}` : ""}${list
          .map((item) => {
            const found = metadata[metaKey].find((e) => e.id === item.id);
            const baseName = found ? found.name : item.id;
            const wikiUrl = (found && found.wiki) || item.wiki;
            let displayName = wikiUrl
              ? `<a href="${wikiUrl}" target="_blank" rel="noopener noreferrer" style="color: ${theme.palette.warning.dark}; text-decoration: underline;">${baseName}</a>`
              : baseName;
            if (
              item.extra &&
              Array.isArray(item.extra) &&
              item.extra.length > 0
            ) {
            }
            if (
              (item.extra &&
                Array.isArray(item.extra) &&
                item.extra.length > 0) ||
              (item.extras &&
                Array.isArray(item.extras) &&
                item.extras.length > 0)
            ) {
              // Map each extra id to its name using
              const extras = (item.extra || item.extras).map((extraId) => {
                const found = metadata.extras.find((e) => e.id === extraId);
                if (found) {
                  if (found.type === "DISTANCE") {
                    const cm = parseFloat(found.name);
                    if (!isNaN(cm)) {
                      return `+${String(Math.round(cm / 2.54))}"`;
                    }
                  }
                  return found.name;
                }
                return extraId;
              });
              displayName = `${displayName} (${extras.join(", ")})`;
            }
            return displayName;
          })
          .join(", ")}${postText ? `${postText}` : ""}`,
      }}
    />
  );
};

export default MapDetails;

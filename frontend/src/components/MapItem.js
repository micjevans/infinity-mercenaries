import React, { useRef, useState } from "react";
import { Popover, Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import MapWeapon from "./MapWeapon";
import MapEquipment from "./MapEquipment";
import { mapItemData } from "../utils/metadataMapping";
import { applyUpgrades } from "../utils/randomUtils";

// Styled Box component for rarity border/glow effects
const RarityBox = styled(Box)(({ theme, raritycolor, raritytier }) => {
  // Base styles for all rarity levels
  const baseStyles = {
    position: "relative",
    border: `2px solid ${raritycolor || "transparent"}`,
    borderRadius: "4px",
    transition: "all 0.2s ease-in-out",

    // Highlight on hover
    "&:hover": {
      transform: "scale(1.05)",
      zIndex: 1,
    },
  };

  // Add additional effects based on rarity tier
  switch (raritytier) {
    case "EPIC":
      return {
        ...baseStyles,
        boxShadow: `0 0 8px 2px ${raritycolor}`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          borderRadius: "6px",
          background: `linear-gradient(45deg, transparent, ${raritycolor}33, transparent)`,
          backgroundSize: "200% 200%",
          animation: "pulse 2s ease-in-out infinite",
        },
      };
    case "LEGENDARY":
      return {
        ...baseStyles,
        boxShadow: `0 0 12px 4px ${raritycolor}`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          borderRadius: "6px",
          background: `linear-gradient(45deg, transparent, ${raritycolor}66, transparent)`,
          backgroundSize: "200% 200%",
          animation: "pulse 1.5s ease-in-out infinite",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: -1,
          padding: 1,
          borderRadius: "5px",
          background: `linear-gradient(45deg, transparent, ${raritycolor}, transparent)`,
          backgroundSize: "200% 200%",
          animation: "rotate 3s linear infinite",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, " +
            "linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        },
      };
    case "RARE":
      return {
        ...baseStyles,
        boxShadow: `0 0 5px 1px ${raritycolor}`,
      };
    default:
      return baseStyles;
  }
});

// Add keyframes for animations
const GlobalStyles = styled("style")({
  "@global": {
    "@keyframes pulse": {
      "0%, 100%": {
        opacity: 0.6,
      },
      "50%": {
        opacity: 1,
      },
    },
    "@keyframes rotate": {
      "0%": {
        backgroundPosition: "0% 0%",
      },
      "100%": {
        backgroundPosition: "100% 100%",
      },
    },
  },
});

const MapItem = ({
  item,
  action = () => {},
  width = 100,
  height = 100,
  style = {},
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [clicked, setClicked] = useState(null);
  const clickTimeout = useRef(null);
  const [imgStyle, setImgStyle] = useState(style);
  const delay = 300; // milliseconds

  const itemData = mapItemData(item).map((data) => applyUpgrades(data)); // Apply upgrades to the item data

  if (!itemData || !itemData.length) return null;

  const img = itemData[0].img;
  const name = itemData[0].name || item.id;

  const handleImageLoad = (e) => {
    const naturalWidth = e.target.naturalWidth;
    const naturalHeight = e.target.naturalHeight;
    const containerAspect = width / height;
    const imageAspect = naturalWidth / naturalHeight;
    let rotation = 0;
    // If the container is portrait and the image is landscape, rotate 90 degrees
    if (containerAspect < 1 && imageAspect > 1) {
      rotation = -90;
    }
    setImgStyle({
      ...style,
      transform: rotation ? `rotate(${rotation}deg)` : undefined,
      objectFit: "cover",
      width: `${height}px`,
      height: `${width}px`,
    });
  };

  const handleMouseEnter = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMouseLeave = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const renderItem = () => {
    switch (item.key) {
      case "weapons":
        return <MapWeapon weaponProfiles={itemData} />;
      case "equips":
        return <MapEquipment equipment={itemData[0]} />;
      default:
        return null;
    }
  };

  // Extract rarity information from the item if it exists
  const hasRarity = item?.rarity && item.rarity.tier && item.rarity.color;
  const rarityInfo = hasRarity ? item.rarity : null;

  return (
    <>
      <GlobalStyles />
      <RarityBox
        onClick={(event) => {
          if (clickTimeout.current !== null) {
            // Second click: clear the pending single click timeout.
            clearTimeout(clickTimeout.current);
            clickTimeout.current = null;
            action(item, event);
          } else {
            // First click: set a timeout to determine if it’s a single click.
            clickTimeout.current = setTimeout(() => {
              if (event.target) setAnchorEl(event.target);
              setClicked(true);
              clickTimeout.current = null;
            }, delay);
          }
        }}
        onMouseEnter={clicked ? undefined : handleMouseEnter}
        onMouseLeave={clicked ? undefined : handleMouseLeave}
        sx={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: action ? "pointer" : "default",
          position: "relative", // Ensure proper positioning context
          ...style,
        }}
        raritycolor={rarityInfo?.color}
        raritytier={rarityInfo?.tier}
      >
        {/* Place badge inside the box but as a separate element */}
        {rarityInfo && (
          <Box
            sx={{
              position: "absolute",
              top: -2,
              right: -2,
              backgroundColor: rarityInfo.color,
              color: "white",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "0.65rem",
              fontWeight: "bold",
              zIndex: 5,
              border: "1px solid rgba(255, 255, 255, 0.5)",
              boxShadow: "0 0 3px rgba(0, 0, 0, 0.3)",
            }}
          >
            {rarityInfo.name}
          </Box>
        )}

        <Box
          sx={{
            width: "100%",
            height: "70%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {img ? (
            <img
              src={img}
              alt={name}
              width={width}
              height={height}
              onLoad={handleImageLoad}
              style={{ ...imgStyle, cursor: "pointer", objectFit: "contain" }}
            />
          ) : (
            <Box
              sx={{
                width: "60%",
                height: "60%",
                backgroundColor: "#e0e0e0",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "4px",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                No Image
              </Typography>
            </Box>
          )}
        </Box>
        <Typography
          variant="caption"
          sx={{
            textAlign: "center",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            mt: 1,
            color: rarityInfo ? rarityInfo.color : "inherit",
            fontWeight: rarityInfo ? "bold" : "normal",
          }}
        >
          {name}
        </Typography>
      </RarityBox>
      <Popover
        open={open}
        sx={clicked ? undefined : { pointerEvents: "none" }}
        anchorEl={anchorEl}
        onClose={(event) => {
          setClicked(false);
          handleMouseLeave(event);
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        disableRestoreFocus
      >
        {renderItem()}
      </Popover>
    </>
  );
};

export default MapItem;

import React, { useRef, useState } from "react";
import { Popover } from "@mui/material";
import MapWeapon from "./MapWeapon";
import MapEquipment from "./MapEquipment";
import { mapItemData } from "../utils/metadataMapping";

const MapItem = ({
  item,
  action = () => {},
  width = 50,
  height = 50,
  style = {},
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [clicked, setClicked] = useState(null);
  const clickTimeout = useRef(null);
  const [imgStyle, setImgStyle] = useState(style);
  const delay = 300; // milliseconds

  const itemData = mapItemData(item);

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

  return (
    <>
      <img
        src={img}
        alt={name}
        width={width}
        height={height}
        onLoad={handleImageLoad}
        style={{ ...imgStyle, cursor: "pointer" }}
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
      />
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

import React from "react";
import { Box, useTheme } from "@mui/material";
import { renderStat, mapItemData } from "../utils/metadataMapping";
import MapDetails from "./MapDetails";

// Define category order for proper sorting
const categoryOrder = [
  "Primary",
  "Secondary",
  "Sidearm",
  "Accessories",
  "Roles",
  "Armor",
  "Augment",
];

// Helper function to get item category
const getItemCategory = (item) => {
  if (!item) return "Accessories";

  const itemData = mapItemData(item);
  if (!itemData || !itemData.length) return "Accessories";

  const slot = itemData[0].slot;

  if (!slot) {
    if (item.key === "weapons") return "Primary";
    return "Accessories";
  }

  const lowerSlot = slot.toLowerCase();
  if (lowerSlot.includes("primary")) return "Primary";
  if (lowerSlot.includes("secondary")) return "Secondary";
  if (lowerSlot.includes("sidearm") || lowerSlot.includes("side arm"))
    return "Sidearm";
  if (lowerSlot.includes("role")) return "Roles";
  if (lowerSlot.includes("armor") || lowerSlot.includes("armour"))
    return "Armor";
  if (lowerSlot.includes("augment")) return "Augment";

  return "Accessories";
};

// Helper function to organize all items from trooper and profile - simplified version
const organizeItems = (trooper, profile) => {
  // Collect profile items with mapping
  const profileItems = [
    ...(profile.weapons?.map((item) => ({ ...item, key: "weapons" })) || []),
    ...(profile.equip?.map((item) => ({ ...item, key: "equips" })) || []),
    ...(profile.skills?.map((item) => ({ ...item, key: "skills" })) || []),
    ...(profile.peripheral?.map((item) => ({ ...item, key: "peripheral" })) ||
      []),
  ];

  // Collect trooper equipment items (filtering out undefined values)
  const trooperItems = [
    trooper.primary,
    trooper.secondary,
    trooper.sidearm,
    trooper.accessory,
    trooper.armor,
    trooper.augment,
  ].filter(Boolean);

  // Combine and sort all items
  return [...profileItems, ...trooperItems].sort((a, b) => {
    const indexA = categoryOrder.indexOf(getItemCategory(a));
    const indexB = categoryOrder.indexOf(getItemCategory(b));

    // Items not in our category order go to the end
    return (
      (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB)
    );
  });
};

const UnitDetails = ({ trooper, profile }) => {
  const { move, cc, bs, ph, wip, arm, bts, w, s, ava } = profile;
  const theme = useTheme();

  // Get all organized items
  const organizedItems = organizeItems(trooper, profile);

  // Group items by their type for display
  const weaponItems = organizedItems.filter((item) => item.key === "weapons");
  const equipItems = organizedItems.filter((item) => item.key === "equips");
  const peripheralItems = organizedItems.filter(
    (item) => item.key === "peripheral"
  );
  const skillItems = organizedItems.filter((item) => item.key === "skills");

  return (
    <Box
      mb={2}
      sx={{
        backgroundColor: theme.palette.grey[300],
        color: "black",
        pt: 1,
        pb: 1,
        px: 3,
        m: 0,
        width: "100%",
      }}
    >
      {/* Stat Titles Row */}
      <Box display="flex" justifyContent="space-between" fontWeight="bold">
        <span>MOV</span>
        <span>CC</span>
        <span>BS</span>
        <span>PH</span>
        <span>WIP</span>
        <span>ARM</span>
        <span>BTS</span>
        <span>W</span>
        <span>S</span>
        <span>AVA</span>
      </Box>
      {/* Divider */}
      <Box my={1} width="100%">
        <hr style={{ border: "none", borderTop: "1px solid #ccc" }} />
      </Box>
      {/* Stat Values Row */}
      <Box display="flex" justifyContent="space-between">
        <span>{renderStat(move)}</span>
        <span>{renderStat(cc)}</span>
        <span>{renderStat(bs)}</span>
        <span>{renderStat(ph)}</span>
        <span>{renderStat(wip)}</span>
        <span>{renderStat(arm)}</span>
        <span>{renderStat(bts)}</span>
        <span>{renderStat(w)}</span>
        <span>{renderStat(s)}</span>
        <span>{renderStat(ava)}</span>
      </Box>
      {/* Weapons Row */}
      <MapDetails list={weaponItems} metaKey="weapons" preText="Weapons: " />
      {/* Equipment Row */}
      <MapDetails list={equipItems} metaKey="equips" preText="Equipment: " />
      {/* Peripherals Row */}
      <MapDetails
        list={peripheralItems}
        metaKey="peripheral"
        preText="Peripherals: "
      />
      {/* Skills Row */}
      <MapDetails list={skillItems} metaKey="skills" preText="Skills: " />
    </Box>
  );
};

export default UnitDetails;

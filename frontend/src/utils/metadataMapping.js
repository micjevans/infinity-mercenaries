import { Box } from "@mui/material";
import metadata from "../data/factions/metadata";

// Helper conversion: centimeters to inches (rounded to nearest whole number)
const convertCmToInches = (cm) => Math.round(cm / 2.54);

// Renders stat values; handles both numbers and arrays.
// If the stat is an array (assumed to be a mov value in centimeters),
// converts each value to inches.
export const renderStat = (stat) => {
  if (Array.isArray(stat)) {
    const converted = stat.map((val) => convertCmToInches(val));
    return converted.length > 1
      ? `${converted[0]} - ${converted[1]}`
      : converted[0];
  }
  return stat !== undefined && stat !== null && stat >= 0 ? stat : "-";
};

export const mapItemData = (item) => {
  return (metadata[item.key] || []).filter((e) => e.id === item.id);
};

export const getExtra = (extraId) => {
  const found = metadata.extras.find((t) => t.id === extraId);
  return found ? found : extraId;
};

// Maps a type object (by id) to its name via metadata.type.
export const mapType = (type) => {
  const found = metadata.type.find((t) => t.id === type);
  return found ? found.name : type;
};

// Add the following function to map a category id to its text value using metadata
export const mapCategory = (categoryId) => {
  const found = metadata.category.find((c) => c.id === categoryId);
  return found ? found.name : null;
};

export const renderOrderIcons = (orders) => {
  if (!orders || orders.length === 0) return null;
  const sortedOrders = [...orders].sort((a, b) => a.list - b.list);
  const icons = sortedOrders.flatMap((order) => {
    const orderMeta = metadata.orders.find((o) => o.type === order.type);
    if (!orderMeta || !orderMeta.logo) return [];
    return Array.from({ length: order.total }, (_, i) => (
      <img
        key={`${order.type}-${i}`}
        src={orderMeta.logo}
        alt={order.type}
        style={{ width: 24, height: 24 }}
      />
    ));
  });
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {icons}
    </Box>
  );
};

export const renderCharLogos = (chars) => {
  if (!chars || chars.length === 0) return null;
  return chars.map((char, index) => {
    const charMeta = metadata.chars.find((c) => c.id === char);
    if (!charMeta || !charMeta.logo) return null;
    return (
      <img
        key={`${char}-${index}`}
        src={charMeta.logo}
        alt={char}
        style={{ width: 24, height: 24 }}
      />
    );
  });
};

import metadata from "../data/factions/metadata";
import { createTheme } from "@mui/material/styles";

const theme = createTheme();

// Helper conversion: centimeters to inches (rounded to nearest whole number)
const convertCmToInches = (cm) => Math.round(cm / 2.54);

// Maps an extra id to its name via metadata.extras.
// If the extra's type is "DISTANCE", converts the value from cm to inches.
export const mapExtra = (extraId) => {
  const found = metadata.extras.find((e) => e.id === extraId);
  if (found) {
    if (found.type === "DISTANCE") {
      const cm = parseFloat(found.name);
      if (!isNaN(cm)) {
        return `+${String(convertCmToInches(cm))}"`;
      }
    }
    return found.name;
  }
  return extraId;
};

// Helper function to append extras if present
const appendExtras = (name, item) => {
  if (item.extra && Array.isArray(item.extra) && item.extra.length > 0) {
    // Map each extra id to its name using mapExtra
    const extras = item.extra.map(mapExtra);
    return `${name} (${extras.join(", ")})`;
  }
  return name;
};

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
  return stat !== undefined && stat !== null ? stat : "-";
};

// Updated mapping functions with inline styling for links

const getWikiLink = (baseName, wikiUrl) => {
  return `<a href="${wikiUrl}" target="_blank" rel="noopener noreferrer" style="color: ${theme.palette.warning.dark}; text-decoration: underline;">${baseName}</a>`;
};

// Maps an equipment object (by id) to its name via metadata.equips.
export const mapEquip = (equipItem) => {
  const found = metadata.equips.find((e) => e.id === equipItem.id);
  const baseName = found ? found.name : equipItem.id;
  const wikiUrl = (found && found.wiki) || equipItem.wiki;
  const displayName = wikiUrl ? getWikiLink(baseName, wikiUrl) : baseName;
  return appendExtras(displayName, equipItem);
};

// Maps a skill object (by id) to its name via metadata.skills.
export const mapSkill = (skillItem) => {
  const found = metadata.skills.find((s) => s.id === skillItem.id);
  const baseName = found ? found.name : skillItem.id;
  const wikiUrl = (found && found.wiki) || skillItem.wiki;
  const displayName = wikiUrl ? getWikiLink(baseName, wikiUrl) : baseName;
  return appendExtras(displayName, skillItem);
};

// Maps a weapon object (by id) to its name via metadata.weapons.
export const mapWeapon = (weaponItem) => {
  const found = metadata.weapons.find((w) => w.id === weaponItem.id);
  const baseName = found ? found.name : weaponItem.id;
  const wikiUrl = (found && found.wiki) || weaponItem.wiki;
  const displayName = wikiUrl ? getWikiLink(baseName, wikiUrl) : baseName;
  return appendExtras(displayName, weaponItem);
};

// Maps a type object (by id) to its name via metadata.type.
export const mapType = (type) => {
  const found = metadata.type.find((t) => t.id === type);
  return found ? found.name : type;
};

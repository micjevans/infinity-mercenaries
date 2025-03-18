/**
 * Add item to trooper
 * This method is only for initial adding and isn't reversible
 * @param {object} trooperDraft - Trooper object that is editable to add item to
 * @param {number} item - Trooper item to add
 * @param {string} type - Type of item (e.g., "weapon", "skill")
 */
export const addItemToTrooper = (trooperDraft, item, type) => {
  if (!trooperDraft || !item) return trooperDraft;
  const profile = trooperDraft.profileGroups[0].profiles[0];

  // If the type is present then add the item otherwise move on the add children
  if (type) {
    if (!profile[type]) {
      trooperDraft.profileGroups[0].profiles[0][type] = []; // Initialize item array if not present
    }
    const foundItemIndex = profile[type].findIndex(
      (perk) => perk.id === item.id
    );
    if (foundItemIndex !== -1) {
      trooperDraft.profileGroups[0].profiles[0][type][foundItemIndex].extra = [
        ...trooperDraft.profileGroups[0].profiles[0][type][foundItemIndex]
          .extra,
        ...(item.extra || []),
      ]; // Merge extras if item already exists
    } else {
      // If item doesn't exist, add it to the profile
      trooperDraft.profileGroups[0].profiles[0][type].push({
        id: item.id,
        extra: item.extra,
      });
    }
  }

  ["equips", "weapons", "skills", "peripherals"].forEach((key) => {
    if (item[key]) {
      item[key].forEach((subItem) =>
        addItemToTrooper(trooperDraft, subItem, key)
      );
    }
  });
  return trooperDraft;
};

export const renderCombinedDetails = (trooper) => {
  let renderedTrooper = JSON.parse(JSON.stringify(trooper)); // Deep clone to avoid mutating original trooper
  ["primary", "secondary", "sidearm", "accessory", "augment", "armor"].forEach(
    (key) => {
      if (trooper[key]) {
        renderedTrooper = addItemToTrooper(
          renderedTrooper,
          trooper[key],
          trooper[key].key
        ); // Add the item to the trooper
      }
    }
  );

  if (trooper["perks"]) {
    trooper["perks"].forEach((perk) => {
      renderedTrooper = addItemToTrooper(renderedTrooper, perk, perk.key); // Add the perk to the trooper
    });
  }
  return renderedTrooper;
};

/**
 * Add item to trooper
 * This method is only for initial adding and isn't reversible
 * @param {object} trooperDraft - Trooper object that is editable to add item to
 * @param {number} item - Trooper item to add
 * @param {string} type - Type of item (e.g., "weapon", "skill")
 */
export const addItemToTrooper = (trooperDraft, item, type) => {
  if (!trooperDraft || !item) return trooperDraft;
  const profile = trooperDraft.profileGroups[0].profiles[0][type];

  // If the type is present then add the item otherwise move on the add children
  if (type) {
    if (!profile.type) {
      trooperDraft.profileGroups[0].profiles[0][type] = []; // Initialize item array if not present
    }
    const foundItem = profile.some((perk) => perk.id === item.id);
    if (foundItem) {
      // Initialize extras array. It's odd like this because CB uses the key extras in specops data and extra in unit data
      let extras = [];
      if (item.extras) {
        extras = item.extras;
      }
      if (item.extra) {
        extras = item.extra;
      }
      extras.forEach((extra) => {
        if (!foundItem.extras) {
          trooperDraft.profileGroups[0].profiles[0][type].extras = []; // Initialize extras if not present
        }
        if (!foundItem.extras.some((e) => e.id === extra.id)) {
          trooperDraft.profileGroups[0].profiles[0][type].extras.push(extra); // Add extra if it doesn't exist
        }
      });
    } else {
      // If item doesn't exist, add it to the profile
      trooperDraft.profileGroups[0].profiles[0][type].push({
        id: item.id,
        extras: item.extras,
      });
    }
  }

  ["equip", "weapons", "skills", "peripherals"].forEach((key) => {
    if (item[key]) {
      item[key].forEach((subItem) =>
        addItemToTrooper(trooperDraft, subItem, key)
      );
    }
  });
  return trooperDraft;
};

export const renderCombinedDetails = (trooper, profile) => {
  let renderedTrooper = JSON.parse(JSON.stringify(trooper)); // Deep clone to avoid mutating original trooper
  ["primary", "secondary", "sidearm", "accessory", "augment", "armor"].forEach(
    (key) => {
      if (profile[key]) {
        renderedTrooper = addItemToTrooper(
          renderedTrooper,
          profile[key],
          profile[key].key
        ); // Add the item to the trooper
      }
    }
  );

  if (profile["perks"]) {
    profile["perks"].forEach((perk) => {
      renderedTrooper = addItemToTrooper(renderedTrooper, perk, perk.key); // Add the perk to the trooper
    });
  }
  return renderedTrooper;
};

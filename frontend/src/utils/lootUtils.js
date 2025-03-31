import { createRNG, nextInt, pickOne } from "./randomUtils";
import { createWeapon } from "./randomUtils";
import { calcItemCr } from "./costUtils";

// Rarity tiers and their properties
export const RARITY_TIERS = {
  COMMON: {
    name: "Common",
    color: "#a8a8a8", // Gray
    upgradeCount: { min: 0, max: 0 }, // Changed max from 1 to 0 - Common items get no upgrades
    qualityModifier: 0, // Lower quality upgrades
  },
  UNCOMMON: {
    name: "Uncommon",
    color: "#1aff1a", // Green
    upgradeCount: { min: 1, max: 1 },
    qualityModifier: 1.0, // Normal quality upgrades
  },
  RARE: {
    name: "Rare",
    color: "#0066ff", // Blue
    upgradeCount: { min: 1, max: 2 },
    qualityModifier: 1.2, // Higher quality upgrades
  },
  EPIC: {
    name: "Epic",
    color: "#7700ff", // Purple
    upgradeCount: { min: 2, max: 3 },
    qualityModifier: 1.5, // Much higher quality upgrades
  },
  LEGENDARY: {
    name: "Legendary",
    color: "#ff6600", // Orange
    upgradeCount: { min: 3, max: 4 },
    qualityModifier: 2.0, // Highest quality upgrades
  },
};

/**
 * Generate a random rarity tier with appropriate weighting
 * @param {string|number} seed - Seed for random generation
 * @param {Array<string>} availableTiers - Array of available tier names (e.g., ['UNCOMMON', 'RARE'])
 * @returns {string} Selected rarity tier name
 */
export const generateTier = (
  seed,
  availableTiers = Object.keys(RARITY_TIERS)
) => {
  let rng = createRNG(seed);

  // If no tiers are provided or the array is empty, use all tiers
  if (!availableTiers || availableTiers.length === 0) {
    availableTiers = Object.keys(RARITY_TIERS);
  }

  // Filter out any invalid tiers
  const validTiers = availableTiers.filter((tier) => RARITY_TIERS[tier]);

  // If no valid tiers remain, return a default tier
  if (validTiers.length === 0) {
    return "COMMON";
  }

  // If only one tier is available, return it
  if (validTiers.length === 1) {
    return validTiers[0];
  }

  // Use simpler weighted distribution with fixed weights
  const weights = {
    COMMON: 50,
    UNCOMMON: 30,
    RARE: 10,
    EPIC: 4,
    LEGENDARY: 1,
  };

  // Create a weighted pool based on available tiers
  const rarityPool = [];
  validTiers.forEach((tier) => {
    if (weights[tier]) {
      for (let i = 0; i < weights[tier]; i++) {
        rarityPool.push(tier);
      }
    }
  });

  // Pick a random tier from the pool
  const selectedTier = pickOne(rng, rarityPool)[0];
  return selectedTier;
};

/**
 * Calculate rarity weight for an upgrade based on its cost impact
 * @param {Object} baseItem - Base item without upgrades
 * @param {Object} upgrade - Upgrade to evaluate
 * @returns {number} Weight representing the rarity (higher = rarer)
 */
export const calculateUpgradeWeight = (baseItem, upgrade) => {
  try {
    // Calculate the base cost
    const baseCost = calcItemCr(baseItem);

    // Create a copy of the base item with the upgrade applied
    const upgradedItem = {
      ...baseItem,
      upgrades: [...(baseItem.upgrades || []), upgrade],
    };

    // Calculate the cost with the upgrade
    const upgradedCost = calcItemCr(upgradedItem);

    // The weight is proportional to how much the upgrade increases the cost
    const costIncrease = upgradedCost - baseCost;
    return Math.max(1, costIncrease);
  } catch (error) {
    console.error("Error calculating upgrade weight:", error);
    return 1; // Default weight if calculation fails
  }
};

/**
 * Generate a full item with random upgrades based on a rarity tier
 * @param {Object} baseItem - Base item without upgrades
 * @param {string} rarityTierKey - Key of the rarity tier in RARITY_TIERS
 * @param {string|number} seed - Seed for random generation
 * @returns {Object} Generated item with applied upgrades and rarity information
 */
export const generateLootItem = (
  baseItem,
  rarityTierKey = "COMMON",
  seed = Date.now()
) => {
  // If rarityTierKey is not a string, it might be the old upgrades parameter
  if (typeof rarityTierKey !== "string" || !RARITY_TIERS[rarityTierKey]) {
    rarityTierKey = "COMMON";
  }

  const rarityTier = RARITY_TIERS[rarityTierKey] || RARITY_TIERS.COMMON;
  let rng = createRNG(seed);

  // Determine how many upgrades to add based on rarity tier
  const [upgradeCount, nextRng] = nextInt(
    rng,
    rarityTier.upgradeCount.min,
    rarityTier.upgradeCount.max
  );
  rng = nextRng;

  // Start with the base item
  let upgradedItem = { ...baseItem };

  // Track applied upgrade names for display purposes
  const appliedUpgradeNames = [];

  // Apply upgrades sequentially using createWeapon
  for (let i = 0; i < upgradeCount; i++) {
    // Generate a unique seed for each upgrade application
    const upgradeSeed = `${seed}-upgrade-${i}`;

    // Use the existing createWeapon function which handles compatibility checking
    const nextUpgradedItem = createWeapon(upgradedItem, upgradeSeed);

    // If the weapon didn't change (no compatible upgrade found), break the loop
    if (JSON.stringify(nextUpgradedItem) === JSON.stringify(upgradedItem)) {
      break;
    }

    // Extract the upgrade name from the item name (first word)
    const upgradeName = nextUpgradedItem.name.split(" ")[0];
    appliedUpgradeNames.push(upgradeName);

    // Use this upgraded item as the base for the next iteration
    upgradedItem = nextUpgradedItem;
  }

  return {
    ...upgradedItem,
    // Store the original ID to maintain reference
    id: baseItem.id,
    // Add rarity information
    rarity: {
      tier: rarityTierKey,
      name: rarityTier.name,
      color: rarityTier.color,
      appliedUpgrades: appliedUpgradeNames,
    },
    // Store base type for reference
    baseType: baseItem.type || baseItem.key,
  };
};

/**
 * Generate a random loot item from a pool of base items
 * @param {Array} baseItems - Pool of potential base items
 * @param {Array} availableUpgrades - Pool of all available upgrades
 * @param {Object} options - Options for loot generation
 * @returns {Object} Generated loot item
 */
export const generateRandomLoot = (
  baseItems,
  availableUpgrades,
  options = {}
) => {
  const {
    seed = Date.now(),
    rarityTierKey = null,
    rarityWeights = {
      COMMON: 50,
      UNCOMMON: 30,
      RARE: 15,
      EPIC: 4,
      LEGENDARY: 1,
    },
  } = options;

  // Use createRNG instead of new SeededRandom
  let rng = createRNG(seed);

  // Select a random base item
  const [baseItem, nextRng] = pickOne(rng, baseItems);
  rng = nextRng;

  // Determine rarity tier if not specified
  let selectedRarityTier = rarityTierKey;
  if (!selectedRarityTier) {
    // Create an array of rarity tiers weighted by their probability
    const rarityTiers = Object.keys(rarityWeights);
    const weightedTiers = [];

    rarityTiers.forEach((tier) => {
      const weight = rarityWeights[tier];
      for (let i = 0; i < weight; i++) {
        weightedTiers.push(tier);
      }
    });

    // Randomly select a tier based on weights
    const tier = pickOne(rng, weightedTiers)[0];
    selectedRarityTier = tier;
  }

  // Generate the loot item
  return generateLootItem(baseItem, selectedRarityTier, seed);
};

/**
 * Generate a collection of random loot items
 * @param {Array} baseItems - Pool of potential base items
 * @param {number} count - Number of items to generate
 * @param {Object} options - Options for loot generation
 * @returns {Array} Collection of generated loot items
 */
export const generateLootBox = (baseItems, count = 5, options = {}) => {
  const {
    seed = Date.now(),
    rarityDistribution = {
      COMMON: 30,
      UNCOMMON: 35,
      RARE: 25,
      EPIC: 8,
      LEGENDARY: 2,
    },
  } = options;

  let rng = createRNG(seed);
  const lootItems = [];

  // Create an array of rarity tiers weighted by their distribution
  const rarityPool = [];
  Object.entries(rarityDistribution).forEach(([tier, weight]) => {
    for (let i = 0; i < weight; i++) {
      rarityPool.push(tier);
    }
  });

  // Generate the specified number of items
  for (let i = 0; i < count; i++) {
    // Generate a unique seed for each item
    const itemSeed = `${seed}-item-${i}`;

    // Pick a random base item
    const [baseItem, baseItemRng] = pickOne(rng, baseItems);
    rng = baseItemRng;

    // Pick a rarity based on the distribution
    const [rarityTier, rarityRng] = pickOne(rng, rarityPool);
    rng = rarityRng;

    // Generate the loot item - FIXED: proper parameter order, removed metadata.upgrades
    lootItems.push(generateLootItem(baseItem, rarityTier, itemSeed));
  }

  return lootItems;
};

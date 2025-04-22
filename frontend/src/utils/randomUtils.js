import metadata from "../data/factions/metadata";
import { mapItemData } from "./metadataMapping";
import * as pureRand from "pure-rand";

const compatibility = (weapon, upgrade) => {
  const foundAmmo = metadata.ammunitions.find(
    (ammo) => ammo.id === weapon.ammunition
  );

  const ammos = foundAmmo ? foundAmmo.name.split("+") : [];

  const weaponToCheck = {
    ...weapon,
    ammunition: ammos,
  };

  const compatibilityObject = (toCheck) => {
    let compatibilityReturn = {};
    Object.entries(metadata.upgradesInfo).forEach(
      ([attribute, upgradesInfoArray]) => {
        upgradesInfoArray.forEach((upgradeInfo) => {
          if (toCheck[attribute]?.includes(upgradeInfo.search)) {
            if (compatibilityReturn[upgradeInfo.key] == null)
              compatibilityReturn[upgradeInfo.key] = []; // Initialize the array for each type
            compatibilityReturn[upgradeInfo.key].push(
              ...(Array.isArray(upgradeInfo.mod)
                ? upgradeInfo.mod
                : [upgradeInfo.mod])
            );
          }
        });
      }
    );
    return compatibilityReturn;
  };

  const weaponCompatibility = compatibilityObject(weaponToCheck);
  const upgradeCompatibility = compatibilityObject(upgrade);

  // Create a set of all attribute keys from both objects.
  const allKeys = new Set([
    ...Object.keys(weaponCompatibility),
    ...Object.keys(upgradeCompatibility),
  ]);

  for (const key of allKeys) {
    // Get the arrays for the current key (defaulting to an empty array if missing)
    const arr1 = weaponCompatibility[key] || [];
    const arr2 = upgradeCompatibility[key] || [];

    if (
      arr1.length !== [...new Set(arr1)].length ||
      arr2.length !== [...new Set(arr2)].length
    )
      return false; // Check for duplicates

    // Rule 1: If "REPLACE" exists in either array, that array must be exactly ["REPLACE"].
    // And if one object has "REPLACE", the other must have nothing.
    if (arr1.includes("REPLACE") || arr2.includes("REPLACE")) {
      if (arr1.includes("REPLACE")) {
        if (arr1.length !== 1 || arr2.length !== 0) {
          return false;
        }
      }
      if (arr2.includes("REPLACE")) {
        if (arr2.length !== 1 || arr1.length !== 0) {
          return false;
        }
      }
    }

    // Rule 2: If there is a "MULTIPLIER" in either array, there should be no other "MULTIPLIER" in total.
    // This means the total count of "MULTIPLIER" across both arrays must be at most 1.
    const multiplierCount =
      arr1.filter((x) => x === "MULTIPLIER").length +
      arr2.filter((x) => x === "MULTIPLIER").length;
    if (multiplierCount > 1) {
      return false;
    }

    // Rule 3: Ensure that there are no duplicate entries in the combined arrays for the current key.
  }

  // If none of the rules are violated, the objects are compatible.
  return true;
};

/**
 * Creates a seeded random number generator
 * @param {string|number} seed - The seed to use
 * @returns {pureRand.RandomGenerator} A pure-rand random generator
 */
export const createRNG = (seed) => {
  // Convert string seed to a number if needed
  let numericSeed;
  if (typeof seed === "string") {
    // Current problematic implementation:
    // This produces strings like "979899" instead of numbers
    // numericSeed = seed.split("").map((char) => char.charCodeAt(0)).join("");

    // New implementation using a simple hash function:
    numericSeed = 0;
    for (let i = 0; i < seed.length; i++) {
      // Simple but effective string hash
      numericSeed = (numericSeed << 5) - numericSeed + seed.charCodeAt(i);
      numericSeed = numericSeed & numericSeed; // Convert to 32bit integer
    }

    // Ensure positive number as pure-rand requires
    numericSeed = Math.abs(numericSeed || 1);
  } else {
    numericSeed = Math.abs(seed || Date.now());
  }

  return pureRand.xorshift128plus(numericSeed);
};

/**
 * Get a random integer between min and max (inclusive)
 * @param {pureRand.RandomGenerator} rng - Random generator
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {[number, pureRand.RandomGenerator]} Random integer and updated generator
 */
export const nextInt = (rng, min, max) => {
  return pureRand.uniformIntDistribution(min, max, rng);
};

/**
 * Pick a random element from an array
 * @param {pureRand.RandomGenerator} rng - Random generator
 * @param {Array} array - Array to pick from
 * @returns {[any, pureRand.RandomGenerator]} Random element and updated generator
 */
export const pickOne = (rng, array) => {
  if (!array || array.length === 0) return [null, rng];
  const [index, nextRng] = nextInt(rng, 0, array.length - 1);
  // Remove the debug line that isn't updating the RNG state
  return [array[index], nextRng];
};

/**
 * Get a random float between 0 and 1
 * @param {pureRand.RandomGenerator} rng - Random generator
 * @returns {[number, pureRand.RandomGenerator]} Random float and updated generator
 */
export const nextFloat = (rng) => {
  const [value, nextRng] = pureRand.uniformIntDistribution(0, 1000000, rng);
  return [value / 1000000, nextRng];
};

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {pureRand.RandomGenerator} rng - Random generator
 * @param {Array} array - Array to shuffle
 * @returns {[Array, pureRand.RandomGenerator]} Shuffled array and updated generator
 */
export const shuffle = (rng, array) => {
  const result = [...array];
  let currentRng = rng;

  for (let i = result.length - 1; i > 0; i--) {
    const [j, nextRng] = nextInt(currentRng, 0, i);
    currentRng = nextRng;
    [result[i], result[j]] = [result[j], result[i]];
  }

  return [result, currentRng];
};

// Adjectives to create random item names
export const adjectives = [
  // ...existing code...
];

// Generate a randomized item name using a seed
export const createWeapon = (originalWeapon, seed) => {
  let rng = createRNG(seed || JSON.stringify(originalWeapon));

  let upgrade = null;
  // Use direct shuffle
  const shuffledUpgrades = [...metadata.upgrades];
  for (let i = shuffledUpgrades.length - 1; i > 0; i--) {
    const [j, nextRng] = nextInt(rng, 0, i);
    rng = nextRng;
    [shuffledUpgrades[i], shuffledUpgrades[j]] = [
      shuffledUpgrades[j],
      shuffledUpgrades[i],
    ];
  }

  const upgradedWeaponProfiles = mapItemData(originalWeapon).map(
    (upgradedWeaponProfile) => applyUpgrades(upgradedWeaponProfile)
  );

  for (const upgradeOption of shuffledUpgrades) {
    if (
      upgradedWeaponProfiles.every((upgradedWeaponProfile) =>
        compatibility(upgradedWeaponProfile, upgradeOption)
      )
    ) {
      upgrade = upgradeOption;
      break;
    }
  }

  if (!upgrade) {
    return originalWeapon;
  }

  return {
    ...originalWeapon,
    upgrades: [...(originalWeapon.upgrades || []), upgrade],
  };
};

export const applyUpgrades = (originalWeapon) => {
  let upgradedWeapon = { ...originalWeapon };
  // Apply the upgrade to the weapon

  if (!upgradedWeapon.upgrades) return originalWeapon;

  for (const upgrade of upgradedWeapon.upgrades) {
    upgradedWeapon.name = `${upgrade.name} ${upgradedWeapon.name}`;
    if (upgrade.distance) upgradedWeapon.distance = upgrade.distance;
    if (upgrade.damage) upgradedWeapon.damage = upgrade.damage;
    if (upgrade.burst) upgradedWeapon.burst = upgrade.burst;
    if (upgrade.ammunition) {
      if (upgradedWeapon.ammunition === 2) {
        upgradedWeapon.ammunition = upgrade.ammunition;
      } else {
        const foundAmmo = metadata.ammunitions.find(
          (ammo) => ammo.id === upgradedWeapon.ammunition
        );

        let ammos = foundAmmo ? foundAmmo.name.split("+") : [];
        ammos.push(upgrade.ammunition);
        upgradedWeapon.ammunition = ammos.join("+");
      }
    }
    if (upgrade.saving) {
      if (upgrade.saving.includes("-")) {
        upgradedWeapon.saving = upgrade.saving;
      } else if (upgrade.saving.includes("and")) {
        upgradedWeapon.saving = `${upgradedWeapon.saving} and ${upgradedWeapon.saving}`;
      } else {
        let saves = upgradedWeapon.saving.split(" and ");
        if (
          upgrade.saving.includes("BTS") &&
          !upgradedWeapon.saving.includes("BTS")
        ) {
          upgradedWeapon.saving = saves
            .map((save) => save.replace("ARM", "BTS"))
            .join(" and ");
          saves = saves.map((save) => save.replace("ARM", "BTS"));
        }
        if (upgrade.saving.includes("=")) {
          upgradedWeapon.saving = saves
            .map((save) => `${save}=${upgrade.saving.split("=")[1]}`)
            .join(" and ");
        }
        if (upgrade.saving.includes("/")) {
          upgradedWeapon.saving = saves
            .map((save) => `${save}/${upgrade.saving.split("/")[1]}`)
            .join(" and ");
        }
      }
    }
    if (upgrade.savingNum) upgradedWeapon.savingNum = upgrade.savingNum;
    if (upgrade.properties)
      upgradedWeapon.properties = [
        ...upgradedWeapon.properties,
        ...upgrade.properties,
      ];
  }

  return upgradedWeapon;
};

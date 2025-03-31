import metadata from "../data/factions/metadata";
import { mapItemData } from "./metadataMapping";
import { applyUpgrades } from "./randomUtils";

const convertDistanceToCells = (distance) => {
  if (!distance) return []; // No range defined

  const order = ["short", "med", "long", "max"];
  let currentDistance = 0;
  const cells = [];

  for (const key of order) {
    const segment = distance[key];
    if (segment && segment.max != null && segment.mod != null) {
      // Check if this segment's maximum goes beyond 120
      if (segment.max <= 120) {
        // Fill cells normally for this segment
        while (currentDistance < segment.max) {
          cells.push(Number(segment.mod));
          currentDistance += 20;
        }
      } else {
        // For a segment that goes past 120:
        // 1. Fill cells normally until reaching 120
        while (currentDistance < 120) {
          cells.push(Number(segment.mod));
          currentDistance += 20;
        }
        // 2. Append one extra cell for any distance beyond 120
        cells.push(Number(segment.mod));
        // Since we've represented 120 and beyond, exit the loop.
        break;
      }
    }
  }

  return cells;
};

const capParenthesis = (str) => {
  return str.match(/\((.*?)\)/)[1];
};

// Function to estimate the efficiency of a weapon
// A rough estimate of how many orders it takes to disable a target
export const orderEfficiency = (weaponData) => {
  // Assumptions and constants

  // We need to estimate the number of orders needed to use the weapon
  let ordersToReach = 0; // Number of orders to reach the target
  let ordersRemoved = 3; // By default we assume first turn and removing 3 orders
  let ordersRemovedOffset = 0; // Offset for orders
  let ordersRemovedMultiplier = 1; // Multiplier for orders removed
  let baseStat = 10; // Assume base stat of 10
  let cover = 3; // Assume trooper is in cover
  let coverArmor = 3; // Assume trooper is in cover
  let burst = parseInt(weaponData.burst) || 1; // Assume burst of 1 if not specified
  let damage = parseInt(weaponData.damage) || 10; // Assume damage of 10 if not specified
  let armor = 4; // Assuming a base armor of 4 for all targets
  let savingNum = 0;
  let autoHit = false; // Assume no auto hit unless specified
  let autoWound = false; // Assume no auto wound unless specified
  let wounds = 2; // Assuming a target has 2 wounds
  // These are rough estimates of the percentage of fights that take place at these ranges
  // Remember for the first range band that many of these fights are cc or templates
  let rangeWeight = [0.1, 0.15, 0.25, 0.2, 0.2, 0.09, 0.01];
  let distCells = convertDistanceToCells(weaponData.distance);

  // Adjust assumptions and constants based on weaponData
  // Factor in ammunition
  if (weaponData.ammunition && weaponData.ammunition !== "-") {
    const foundAmmo = metadata.ammunitions.find(
      (ammo) => ammo.id === weaponData.ammunition
    );
    if (foundAmmo) {
      const ammos = foundAmmo.name.split("+");

      ammos.forEach((ammo) => {
        // Only these ammos have information that is not in the rest of the weaponData
        switch (ammo) {
          case "E/M":
            wounds = 1; // E/M ammunition only requires one wound to disable
            break;
          case "T2":
            wounds = 1; // T2 ammunition deals 2 wounds
            break;
          default:
            break;
        }
      });
    }
  }
  // Factor in Saving Roll Attribute
  if (weaponData.saving && weaponData.saving !== "-") {
    // If there is a divider in the saving roll then mod the armor
    if (weaponData.saving.split("/").length === 2)
      armor /= parseInt(weaponData.saving.split("/")[1]);
    // If there is an equals in the saving roll then mod the armor to equal it
    if (weaponData.saving.split("=").length === 2)
      armor = parseInt(weaponData.saving.split("=")[1]);
    // If there is a minus in the saving roll then mod the armor by that value
    if (weaponData.saving.split("-").length === 2)
      armor -= parseInt(weaponData.saving.split("-")[1]);
  }
  // Factor in Saving Roll Number
  if (weaponData.savingNum && weaponData.savingNum !== "-") {
    savingNum = weaponData.savingNum
      .split("and")
      .map((num) => parseInt(num.trim()))
      .reduce((acc, curr) => acc + curr, 0); // Sum the saving numbers
  }
  // Factor in Traits
  weaponData.properties?.forEach((property) => {
    switch (property.toUpperCase()) {
      case "Non-lethal".toUpperCase():
        ordersRemovedOffset -= 1; // Non-lethal weapons can be estimated to remove 2 less than normal
        break;
      case property.includes("Disposable".toUpperCase()):
        ordersToReach += 4 - parseInt(capParenthesis(property)); // Add one order to reach estimating needing to refill for each disposable
        break;
      case property.includes("State:".toUpperCase()):
        wounds = 1; // State weapons only require one wound to accomplish their goal
        break;
      case "Anti-Material".toUpperCase():
        // dont know yet
        break;
      case "CC".toUpperCase():
        ordersToReach += 3; // CC weapons can be estimated to cost 1 more order to reach
        break;
      case "Suppressive Fire".toUpperCase():
        ordersRemovedOffset += 1; // We can say that suppression is worth 1 extra order removed
        break;
      case "Intuitive Attack".toUpperCase():
        ordersToReach -= 1; // Intuitive attacks don't need to discover so they are about 1 order more efficient
        break;
      case "Concealed".toUpperCase():
        ordersRemovedOffset += 1; // Concealed weapons can be estimated to remove 1 extra order
        break;
      case property.includes("Template".toUpperCase()):
        coverArmor = 0; // Template weapons ignore cover
        ordersRemovedMultiplier *= 2; // Assume two troopers are hit and double the orders removed
        if (property.includes("Direct".toUpperCase()).toUpperCase()) {
          autoHit = true; // Direct Template weapons automatically hit
          if (property.includes("Large".toUpperCase())) {
            // If its a large template we can assume it takes 1 less order to reach
            ordersToReach -= 1;
          }
        }
        break;
      case "Deployable".toUpperCase():
        autoHit = true; // Deployable weapons automatically succeed
        ordersToReach += 2; // Deployable weapons can be estimated to take 2 orders to reach
        break;
      case "Double Shot".toUpperCase():
        burst += 1; // Double shot weapons give a bonus burst
        break;
      case "CC Attack (+3)".toUpperCase():
        baseStat += 3; // Give +3 to the base stat
        break;
      case "Boost".toUpperCase():
        ordersToReach -= 1; // Boost weapons can be estimated to cost 1 less order
        break;
      case "Perimeter".toUpperCase():
        ordersToReach -= 1; // Perimeter weapons can be estimated to cost 1 less order
        break;
      case "Comms. Attack".toUpperCase():
        ordersToReach -= 1; // Comms. Attack weapons can be estimated to cost 1 less order
        break;
      case "Improvised".toUpperCase():
        baseStat -= 6; // Improvised weapons have a -6 to hit
        break;
      case "Zone of Control".toUpperCase():
        ordersToReach += 3; // Zone of Control weapons can be estimated to cost 2 less orders
        break;
      case property.includes("BS Weapon (".toUpperCase()):
        baseStat += 3; // We can estimate that letting a trooper use their best stat is a +3 bonus
        break;
      case "Speculative Attack".toUpperCase():
        ordersToReach -= 1; // Speculative attacks are only burst 1 when used as such but we'll estimate the bonus to be about 2 orders
        break;
      case "Targetless".toUpperCase():
        cover = 0; // Targetless weapons ignore cover
        autoWound = true; // Targetless weapons automatically wound
        wounds = 1; // If autoWound then consider 1 wound
        break;
      case "Reflective".toUpperCase():
        // One order removed was too much. Making no change
        break;
      case "Indiscriminate".toUpperCase():
        ordersRemovedOffset += 1; // Indiscriminate weapons can be estimated to remove 1 extra order because of how this lets them be placed
        break;
      case "No LoF".toUpperCase():
        ordersToReach -= 2;
        break;
      case "Technical Weapon".toUpperCase():
        coverArmor = 0; // Technical weapons ignore cover
        cover = 0; // Technical weapons ignore cover
        baseStat += 3; // We can estimate that letting a trooper use their wip stat is a +3 bonus
        break;
      case "Target (VITA)".toUpperCase():
        ordersToReach += 1; // We can say needing to target VITA will cost an extra order to reach the target
        break;
      case property.includes("Silent".toUpperCase()):
        baseStat -= parseInt(capParenthesis(property)) * 0.75; // Technically silent removes opponents chance but we're gonna estimate it as helping the attacker
        break;
      case "Burst: Single Target".toUpperCase():
        // This really doesn't do anything hardly
        break;
      case "Continuous Damage".toUpperCase():
        burst *= 1.5; // Continuous damage weapons can be estimated to cost 1.5 more orders
        break;
      default:
        break;
    }
  });

  if (ordersToReach < 0) ordersToReach = 0; // We can't have negative orders to reach
  if (ordersRemoved < 0) ordersRemoved = 0; // We can't have negative orders removed
  if (baseStat < 0) baseStat = 0; // We can't have negative base stats;
  if (cover < 0) cover = 0; // We can't have negative cover
  if (coverArmor < 0) coverArmor = 0;
  if (burst < 0) burst = 0;
  if (damage < 0) damage = 0;
  if (savingNum < 0) savingNum = 0;
  if (wounds < 1) wounds = 1; // We can't have less than 1 wound

  ordersRemoved =
    (ordersRemoved + ordersRemovedOffset) * ordersRemovedMultiplier; // Apply the offset and multiplier to the orders removed

  // Calculations from stats
  // Calc weighted Range Mods
  const weightedRangeMod = rangeWeight
    .map((weight, index) => {
      // Return 0 if distCells[index] is null and increase orders to reach by 1
      if (distCells[index] == null) {
        ordersToReach += 1;
        return 0;
      }
      return weight * distCells[index];
    })
    .reduce((acc, curr) => acc + curr, 0);

  // Calculate the chance to hit assuming a roll of 10 is needed to hit
  // If theres no burst then it automatically succeeds with one
  const chanceToHit = burst
    ? // If it automatically hits just return the burst
      autoHit
      ? 1
      : 1 - (1 - (baseStat - cover + weightedRangeMod) / 20) ** burst
    : 1;

  // Calculate the chance to wound based on the damage, armor, and saving throw
  const chanceToWound = autoWound
    ? 1
    : 1 - ((damage + armor + coverArmor) / 20) ** savingNum;

  // Calculate the number of orders needed to disable based on chance to hit wounds and chance to wound
  const ordersToDisable = wounds / (chanceToHit * chanceToWound);

  return {
    factors: {
      weightedRangeMod: weightedRangeMod,
      chanceToHit: chanceToHit,
      chanceToWound: chanceToWound,
      ordersToReach: ordersToReach,
      ordersRemoved: ordersRemoved,
      ordersRemovedOffset: ordersRemovedOffset,
      ordersRemovedMultiplier: ordersRemovedMultiplier,
      baseStat: baseStat,
      cover: cover,
      coverArmor: coverArmor,
      burst: burst,
      damage: damage,
      armor: armor,
      savingNum: savingNum,
      autoHit: autoHit,
      autoWound: autoWound,
      wounds: wounds,
      distCells: distCells,
    },
    orderEfficiency: ordersRemoved / (ordersToDisable + ordersToReach), // estimate the efficiency of the weapon
  };
};

export const calcItemCr = (item) => {
  const itemData = mapItemData(item);

  if (!itemData) return 0;

  const efficiencyMods = itemData.map(
    (i) => orderEfficiency(applyUpgrades(i)).orderEfficiency
  );

  const totalProfilePoints =
    efficiencyMods.reduce((acc, curr) => acc + curr, 0) /
    (efficiencyMods.length > 1 ? efficiencyMods.length - 1 : 1);

  return Math.round(Math.log(1 + totalProfilePoints) * 40);
};

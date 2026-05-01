import { infinityMetadata, mapItemData } from "./metadata";
import type { AttributeKey, ItemKey, MetadataItem, Trooper } from "./types";

const ATTRIBUTE_KEYS = ["move", "cc", "bs", "wip", "ph", "arm", "bts", "w", "s"] as const;
const EQUIPMENT_SLOTS = ["primary", "secondary", "sidearm", "accessory", "augment", "armor"] as const;

function isAttributeKey(value: string): value is AttributeKey {
  return (ATTRIBUTE_KEYS as readonly string[]).includes(value);
}

function cloneTrooper<T extends Trooper>(trooper: T): T {
  return structuredClone(trooper);
}

function normalizeCollectionKey(key: string): string {
  if (key === "equip") return "equip";
  if (key === "peripheral") return "peripheral";
  return key;
}

export function addItemToTrooper<T extends Trooper>(trooper: T, item: MetadataItem, type?: ItemKey): T {
  const draft = cloneTrooper(trooper);
  const profile = draft.profileGroups?.[0]?.profiles?.[0];
  if (!profile || !item) return draft;

  if (type) {
    const typeKey = String(type);

    if (isAttributeKey(typeKey)) {
      if (typeKey === "move") {
        const extra = Array.isArray(item.extra) ? item.extra.map(Number) : [0, 0];
        const current = Array.isArray(profile.move) ? profile.move : [0, 0];
        profile.move = current.map((value, index) => Math.max(0, Number(value || 0)) + Number(extra[index] || 0));
      } else {
        profile[typeKey] = Number(profile[typeKey] || 0) + Number(item.extra || 0);
      }
    } else if (typeKey === "type") {
      draft.resume = { ...(draft.resume || { id: draft.id }), type: item.id };
    } else {
      const collectionKey = normalizeCollectionKey(typeKey);
      const collection = (profile[collectionKey] || []) as MetadataItem[];
      const foundIndex = collection.findIndex((existing) => existing.id === item.id);

      if (foundIndex >= 0) {
        const existingExtra = collection[foundIndex].extra;
        collection[foundIndex] = {
          ...collection[foundIndex],
          extra: [
            ...(Array.isArray(existingExtra) ? existingExtra : existingExtra ? [existingExtra] : []),
            ...(Array.isArray(item.extra) ? item.extra : item.extra ? [item.extra] : [])
          ]
        };
      } else {
        collection.push({ id: item.id, extra: item.extra });
      }

      profile[collectionKey] = collection;
    }
  }

  ["equips", "weapons", "skills", "peripherals", ...ATTRIBUTE_KEYS].forEach((key) => {
    const childItems = item[key];
    const children = Array.isArray(childItems) ? childItems : childItems ? [childItems] : [];
    children.forEach((child) => {
      const updated = addItemToTrooper(draft, child as MetadataItem, key as ItemKey);
      Object.assign(draft, updated);
    });
  });

  return draft;
}

export function renderCombinedDetails<T extends Trooper>(trooper: T): T {
  let rendered = cloneTrooper(trooper);

  EQUIPMENT_SLOTS.forEach((slot) => {
    const item = rendered[slot];
    if (item) {
      rendered = addItemToTrooper(rendered, item, item.key as ItemKey);
    }
  });

  (rendered.perks || []).forEach((perk) => {
    rendered = addItemToTrooper(rendered, perk, perk.key as ItemKey);
  });

  return rendered;
}

function convertDistanceToCells(distance: any): number[] {
  if (!distance) return [];

  const order = ["short", "med", "long", "max"];
  let currentDistance = 0;
  const cells: number[] = [];

  for (const key of order) {
    const segment = distance[key];
    if (segment && segment.max != null && segment.mod != null) {
      if (segment.max <= 120) {
        while (currentDistance < segment.max) {
          cells.push(Number(segment.mod));
          currentDistance += 20;
        }
      } else {
        while (currentDistance < 120) {
          cells.push(Number(segment.mod));
          currentDistance += 20;
        }
        cells.push(Number(segment.mod));
        break;
      }
    }
  }

  return cells;
}

function parenthesizedNumber(value: string): number {
  const match = value.match(/\((.*?)\)/);
  return match ? Number(match[1]) : 0;
}

export function applyUpgrades<T extends MetadataItem>(originalWeapon: T): T {
  let upgradedWeapon: any = { ...originalWeapon };
  const upgrades = upgradedWeapon.upgrades as MetadataItem[] | undefined;
  if (!upgrades?.length) return originalWeapon;

  for (const upgrade of upgrades) {
    upgradedWeapon.name = `${upgrade.name} ${upgradedWeapon.name}`;
    if (upgrade.distance) upgradedWeapon.distance = upgrade.distance;
    if (upgrade.damage) upgradedWeapon.damage = upgrade.damage;
    if (upgrade.burst) upgradedWeapon.burst = upgrade.burst;
    if (upgrade.ammunition) {
      if (upgradedWeapon.ammunition === 2) {
        upgradedWeapon.ammunition = upgrade.ammunition;
      } else {
        const foundAmmo = (infinityMetadata.ammunitions || []).find((ammo: any) => ammo.id === upgradedWeapon.ammunition);
        const ammos = foundAmmo ? String(foundAmmo.name).split("+") : [];
        ammos.push(String(upgrade.ammunition));
        upgradedWeapon.ammunition = ammos.join("+");
      }
    }
    if (upgrade.saving) {
      const upgradeSaving = String(upgrade.saving);
      if (upgradeSaving.includes("-")) {
        upgradedWeapon.saving = upgradeSaving;
      } else if (upgradeSaving.includes("and")) {
        upgradedWeapon.saving = `${upgradedWeapon.saving} and ${upgradedWeapon.saving}`;
      } else {
        let saves = String(upgradedWeapon.saving || "").split(" and ");
        if (upgradeSaving.includes("BTS") && !String(upgradedWeapon.saving).includes("BTS")) {
          saves = saves.map((save) => save.replace("ARM", "BTS"));
          upgradedWeapon.saving = saves.join(" and ");
        }
        if (upgradeSaving.includes("=")) {
          upgradedWeapon.saving = saves.map((save) => `${save}=${upgradeSaving.split("=")[1]}`).join(" and ");
        }
        if (upgradeSaving.includes("/")) {
          upgradedWeapon.saving = saves.map((save) => `${save}/${upgradeSaving.split("/")[1]}`).join(" and ");
        }
      }
    }
    if (upgrade.savingNum) upgradedWeapon.savingNum = upgrade.savingNum;
    if (upgrade.properties) {
      upgradedWeapon.properties = [...(upgradedWeapon.properties || []), ...(upgrade.properties as unknown[])];
    }
  }

  return upgradedWeapon;
}

export function orderEfficiency(weaponData: MetadataItem): { factors: Record<string, unknown>; orderEfficiency: number } {
  let ordersToReach = 0;
  let ordersRemoved = 3;
  let ordersRemovedOffset = 0;
  let ordersRemovedMultiplier = 1;
  let baseStat = 10;
  let cover = 3;
  let coverArmor = 3;
  let burst = Number.parseInt(String(weaponData.burst || "1"), 10) || 1;
  let damage = Number.parseInt(String(weaponData.damage || "10"), 10) || 10;
  let armor = 4;
  let savingNum = 0;
  let autoHit = false;
  let autoWound = false;
  let wounds = 2;
  const rangeWeight = [0.1, 0.15, 0.25, 0.2, 0.2, 0.09, 0.01];
  const distCells = convertDistanceToCells(weaponData.distance);

  const foundAmmo = (infinityMetadata.ammunitions || []).find((ammo: any) => ammo.id === weaponData.ammunition);
  const ammos = foundAmmo ? String(foundAmmo.name).split("+") : [];
  ammos.forEach((ammo) => {
    if (ammo === "E/M" || ammo === "T2") wounds = 1;
  });

  if (weaponData.saving && weaponData.saving !== "-") {
    const saving = String(weaponData.saving);
    if (saving.split("/").length === 2) armor /= Number.parseInt(saving.split("/")[1], 10);
    if (saving.split("=").length === 2) armor = Number.parseInt(saving.split("=")[1], 10);
    if (saving.split("-").length === 2) armor -= Number.parseInt(saving.split("-")[1], 10);
  }

  if (weaponData.savingNum && weaponData.savingNum !== "-") {
    savingNum = String(weaponData.savingNum)
      .split("and")
      .map((num) => Number.parseInt(num.trim(), 10))
      .filter(Number.isFinite)
      .reduce((acc, curr) => acc + curr, 0);
  }

  ((weaponData.properties || []) as string[]).forEach((propertyRaw) => {
    const property = String(propertyRaw);
    const upper = property.toUpperCase();
    if (upper === "NON-LETHAL") ordersRemovedOffset -= 1;
    if (upper.includes("DISPOSABLE")) ordersToReach += 4 - parenthesizedNumber(property);
    if (upper.includes("STATE:")) wounds = 1;
    if (upper === "CC") ordersToReach += 3;
    if (upper === "SUPPRESSIVE FIRE") ordersRemovedOffset += 1;
    if (upper === "INTUITIVE ATTACK") ordersToReach -= 1;
    if (upper === "CONCEALED") ordersRemovedOffset += 1;
    if (upper.includes("TEMPLATE")) {
      coverArmor = 0;
      ordersRemovedMultiplier *= 2;
      if (upper.includes("DIRECT")) {
        autoHit = true;
        if (upper.includes("LARGE")) ordersToReach -= 1;
      }
    }
    if (upper === "DEPLOYABLE") {
      autoHit = true;
      ordersToReach += 2;
    }
    if (upper === "DOUBLE SHOT") burst += 1;
    if (upper === "CC ATTACK (+3)") baseStat += 3;
    if (upper === "BOOST" || upper === "PERIMETER" || upper === "COMMS. ATTACK" || upper === "SPECULATIVE ATTACK") ordersToReach -= 1;
    if (upper === "IMPROVISED") baseStat -= 6;
    if (upper === "ZONE OF CONTROL") ordersToReach += 3;
    if (upper.includes("BS WEAPON (")) baseStat += 3;
    if (upper === "TARGETLESS") {
      cover = 0;
      autoWound = true;
      wounds = 1;
    }
    if (upper.includes("TEMPLATE")) coverArmor = 0;
    if (upper === "TECHNICAL WEAPON") {
      coverArmor = 0;
      cover = 0;
      baseStat += 3;
    }
    if (upper === "TARGET (VITA)") ordersToReach += 1;
    if (upper.includes("SILENT")) baseStat -= parenthesizedNumber(property) * 0.75;
    if (upper === "CONTINUOUS DAMAGE") burst *= 1.5;
    if (upper === "INDISCRIMINATE") ordersRemovedOffset += 1;
    if (upper === "NO LOF") ordersToReach -= 2;
  });

  ordersToReach = Math.max(0, ordersToReach);
  ordersRemoved = Math.max(0, ordersRemoved);
  baseStat = Math.max(0, baseStat);
  cover = Math.max(0, cover);
  coverArmor = Math.max(0, coverArmor);
  burst = Math.max(0, burst);
  damage = Math.max(0, damage);
  savingNum = Math.max(0, savingNum);
  wounds = Math.max(1, wounds);
  ordersRemoved = (ordersRemoved + ordersRemovedOffset) * ordersRemovedMultiplier;

  const weightedRangeMod = rangeWeight
    .map((weight, index) => {
      if (distCells[index] == null) {
        ordersToReach += 1;
        return 0;
      }
      return weight * distCells[index];
    })
    .reduce((acc, curr) => acc + curr, 0);

  const chanceToHit = burst ? (autoHit ? 1 : 1 - (1 - (baseStat - cover + weightedRangeMod) / 20) ** burst) : 1;
  const chanceToWound = autoWound ? 1 : 1 - ((damage + armor + coverArmor) / 20) ** savingNum;
  const ordersToDisable = wounds / (chanceToHit * chanceToWound);

  return {
    factors: {
      weightedRangeMod,
      chanceToHit,
      chanceToWound,
      ordersToReach,
      ordersRemoved,
      ordersRemovedOffset,
      ordersRemovedMultiplier,
      baseStat,
      cover,
      coverArmor,
      burst,
      damage,
      armor,
      savingNum,
      autoHit,
      autoWound,
      wounds,
      distCells
    },
    orderEfficiency: ordersRemoved / (ordersToDisable + ordersToReach)
  };
}

export function calcItemCr(item: MetadataItem): number {
  const itemData = mapItemData(item);
  if (!itemData.length) return 0;

  const efficiencyMods = itemData.map((entry) => orderEfficiency(applyUpgrades(entry)).orderEfficiency);
  const divisor = efficiencyMods.length > 1 ? efficiencyMods.length - 1 : 1;
  const totalProfilePoints = efficiencyMods.reduce((acc, curr) => acc + curr, 0) / divisor;

  return Math.round(Math.log(1 + totalProfilePoints) * 40);
}

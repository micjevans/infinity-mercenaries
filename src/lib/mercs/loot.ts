import { infinityMetadata } from "./metadata";
import { calcItemCr } from "./items";
import { createRng } from "./rng";
import type { MetadataItem } from "./types";

export const RARITY_TIERS = {
  COMMON: {
    name: "Common",
    color: "#a8a8a8",
    upgradeCount: { min: 0, max: 0 },
    qualityModifier: 0
  },
  UNCOMMON: {
    name: "Uncommon",
    color: "#55d16f",
    upgradeCount: { min: 1, max: 1 },
    qualityModifier: 1
  },
  RARE: {
    name: "Rare",
    color: "#4a8cff",
    upgradeCount: { min: 1, max: 2 },
    qualityModifier: 1.2
  },
  EPIC: {
    name: "Epic",
    color: "#a974ff",
    upgradeCount: { min: 2, max: 3 },
    qualityModifier: 1.5
  },
  LEGENDARY: {
    name: "Legendary",
    color: "#ff9d2e",
    upgradeCount: { min: 3, max: 4 },
    qualityModifier: 2
  }
} as const;

export type RarityTierKey = keyof typeof RARITY_TIERS;

const RARITY_WEIGHTS: Record<RarityTierKey, number> = {
  COMMON: 50,
  UNCOMMON: 30,
  RARE: 10,
  EPIC: 4,
  LEGENDARY: 1
};

function getAmmoNames(weapon: MetadataItem): string[] {
  const foundAmmo = (infinityMetadata.ammunitions || []).find((ammo: any) => ammo.id === weapon.ammunition);
  return foundAmmo ? String(foundAmmo.name).split("+") : [];
}

function compatibilityObject(toCheck: any): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  Object.entries(infinityMetadata.upgradesInfo || {}).forEach(([attribute, upgradesInfoArray]) => {
    (upgradesInfoArray as any[]).forEach((upgradeInfo) => {
      const value = toCheck[attribute];
      if (Array.isArray(value) ? value.includes(upgradeInfo.search) : String(value || "").includes(upgradeInfo.search)) {
        result[upgradeInfo.key] ??= [];
        result[upgradeInfo.key].push(...(Array.isArray(upgradeInfo.mod) ? upgradeInfo.mod : [upgradeInfo.mod]));
      }
    });
  });

  return result;
}

function areCompatible(weapon: MetadataItem, upgrade: MetadataItem): boolean {
  const weaponCompatibility = compatibilityObject({ ...weapon, ammunition: getAmmoNames(weapon) });
  const upgradeCompatibility = compatibilityObject(upgrade);
  const keys = new Set([...Object.keys(weaponCompatibility), ...Object.keys(upgradeCompatibility)]);

  for (const key of keys) {
    const existing = weaponCompatibility[key] || [];
    const incoming = upgradeCompatibility[key] || [];

    if (existing.length !== new Set(existing).size || incoming.length !== new Set(incoming).size) return false;

    if (existing.includes("REPLACE") || incoming.includes("REPLACE")) {
      if (existing.includes("REPLACE") && (existing.length !== 1 || incoming.length !== 0)) return false;
      if (incoming.includes("REPLACE") && (incoming.length !== 1 || existing.length !== 0)) return false;
    }

    const multiplierCount = existing.filter((value) => value === "MULTIPLIER").length + incoming.filter((value) => value === "MULTIPLIER").length;
    if (multiplierCount > 1) return false;
  }

  return true;
}

export function generateTier(seed: string | number, availableTiers: RarityTierKey[] = Object.keys(RARITY_TIERS) as RarityTierKey[]): RarityTierKey {
  const validTiers = availableTiers.filter((tier) => RARITY_TIERS[tier]);
  if (!validTiers.length) return "COMMON";
  if (validTiers.length === 1) return validTiers[0];

  const pool = validTiers.flatMap((tier) => Array.from({ length: RARITY_WEIGHTS[tier] || 1 }, () => tier));
  return createRng(seed).pickOne(pool) || "COMMON";
}

export function createWeapon(originalWeapon: MetadataItem, seed?: string | number): MetadataItem {
  const rng = createRng(seed || JSON.stringify(originalWeapon));
  const shuffledUpgrades = rng.shuffle((infinityMetadata.upgrades || []) as MetadataItem[]);

  for (const upgrade of shuffledUpgrades) {
    if (areCompatible(originalWeapon, upgrade)) {
      return {
        ...originalWeapon,
        upgrades: [...((originalWeapon.upgrades as MetadataItem[]) || []), upgrade]
      };
    }
  }

  return originalWeapon;
}

export function calculateUpgradeWeight(baseItem: MetadataItem, upgrade: MetadataItem): number {
  try {
    const baseCost = calcItemCr(baseItem);
    const upgradedCost = calcItemCr({
      ...baseItem,
      upgrades: [...((baseItem.upgrades as MetadataItem[]) || []), upgrade]
    });
    return Math.max(1, upgradedCost - baseCost);
  } catch {
    return 1;
  }
}

export function generateLootItem(baseItem: MetadataItem, rarityTierKey: RarityTierKey = "COMMON", seed: string | number = Date.now()): MetadataItem {
  const rarityTier = RARITY_TIERS[rarityTierKey] || RARITY_TIERS.COMMON;
  const rng = createRng(seed);
  const upgradeCount = rng.nextInt(rarityTier.upgradeCount.min, rarityTier.upgradeCount.max);
  let upgradedItem = { ...baseItem };
  const appliedUpgradeNames: string[] = [];

  for (let i = 0; i < upgradeCount; i += 1) {
    const nextUpgradedItem = createWeapon(upgradedItem, `${seed}-upgrade-${i}`);
    if (JSON.stringify(nextUpgradedItem) === JSON.stringify(upgradedItem)) break;
    const upgradeName = String(nextUpgradedItem.name || "").split(" ")[0];
    if (upgradeName) appliedUpgradeNames.push(upgradeName);
    upgradedItem = nextUpgradedItem;
  }

  return {
    ...upgradedItem,
    id: baseItem.id,
    rarity: {
      tier: rarityTierKey,
      name: rarityTier.name,
      color: rarityTier.color,
      appliedUpgrades: appliedUpgradeNames
    },
    baseType: baseItem.type || baseItem.key
  };
}

export function generateRandomLoot(baseItems: MetadataItem[], options: { seed?: string | number; rarityTierKey?: RarityTierKey | null } = {}): MetadataItem | null {
  const rng = createRng(options.seed);
  const baseItem = rng.pickOne(baseItems);
  if (!baseItem) return null;
  const tier = options.rarityTierKey || generateTier(`${options.seed || Date.now()}-rarity`);
  return generateLootItem(baseItem, tier, options.seed);
}

export function generateLootBox(baseItems: MetadataItem[], count = 5, seed: string | number = Date.now()): MetadataItem[] {
  return Array.from({ length: count }, (_, index) => generateRandomLoot(baseItems, { seed: `${seed}-item-${index}` })).filter(
    (item): item is MetadataItem => Boolean(item)
  );
}

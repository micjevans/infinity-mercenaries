/**
 * Maps inducement option IDs to real Infinity data objects.
 * Weapon/equip IDs come from src/data/infinity/factions/metadata.json.
 * Unit IDs and faction slugs come from the faction JSON files.
 */

export type InducementWeaponMapping = {
  /** ID in the metadata.json weapons or equip arrays */
  metadataId: number;
  /** Which profile array to inject into */
  collectionKey: "weapons" | "equip";
};

export type InducementHireMapping = {
  /** Slug matching a file in src/data/infinity/factions/ */
  factionSlug: string;
  /** Unit id field in the faction's units[] array */
  unitId: number;
  /** Fallback display name if unit lookup fails */
  displayName: string;
};

/**
 * Maps rental inducement option IDs to the metadata item to inject
 * into the assigned trooper's profile.
 *
 * For primary/secondary: injected as weapons.
 * For equipment: injected as equip.
 *
 * Symbiobomb has no metadata entry – treated as label-only.
 */
export const INDUCEMENT_WEAPON_MAPPINGS: Partial<
  Record<string, InducementWeaponMapping>
> = {
  // Primary weapons
  "primary-ap-marksman": { metadataId: 85, collectionKey: "weapons" },
  "primary-breaker-combi": { metadataId: 103, collectionKey: "weapons" },
  "primary-spitfire": { metadataId: 74, collectionKey: "weapons" },
  "primary-multi-sniper": { metadataId: 36, collectionKey: "weapons" },
  "primary-hmg": { metadataId: 2, collectionKey: "weapons" },

  // Secondary weapons
  "secondary-panzerfaust": { metadataId: 68, collectionKey: "weapons" },
  "secondary-flammenspeer": { metadataId: 82, collectionKey: "weapons" },
  "secondary-blitzen": { metadataId: 14, collectionKey: "weapons" },
  // "secondary-symbiobomb" — no metadata ID; shown as label only
  "secondary-symbiomate": { metadataId: 242, collectionKey: "equip" },

  // Equipment (injected as equip)
  "equipment-tinbot-3": { metadataId: 169, collectionKey: "equip" },
  "equipment-msv1": { metadataId: 114, collectionKey: "equip" },
  "equipment-albedo-3": { metadataId: 183, collectionKey: "equip" },
  "equipment-tinbot-6": { metadataId: 169, collectionKey: "equip" },
  "equipment-msv2": { metadataId: 115, collectionKey: "equip" },
  "equipment-albedo-6": { metadataId: 183, collectionKey: "equip" },
};

/**
 * Maps hired troop inducement option IDs to the unit profile in the
 * relevant faction data file. Both ABH variants map to the same unit
 * (the player picks their loadout on table).
 */
export const INDUCEMENT_HIRE_MAPPINGS: Partial<
  Record<string, InducementHireMapping>
> = {
  "troop-abh-smg-bsg": {
    factionSlug: "dahshat",
    unitId: 49,
    displayName: "Authorized Bounty Hunter",
  },
  "troop-abh-sniper-spitfire": {
    factionSlug: "dahshat",
    unitId: 49,
    displayName: "Authorized Bounty Hunter",
  },
  "troop-monstruckers": {
    factionSlug: "ariadna",
    unitId: 11333,
    displayName: "Monstruckers",
  },
  "troop-motorized-bh": {
    factionSlug: "dahshat",
    unitId: 1565,
    displayName: "Motorized Bounty Hunter",
  },
  "troop-wardriver": {
    factionSlug: "nomads",
    unitId: 10265,
    displayName: "Wardriver, Mercenary Hacker",
  },
  "troop-bashi": {
    factionSlug: "haqqislam",
    unitId: 325,
    displayName: "Bashi Bazouk",
  },
  "troop-digger": {
    factionSlug: "ariadna",
    unitId: 11568,
    displayName: "Digger",
  },
  "troop-brawler-sniper": {
    factionSlug: "druze",
    unitId: 987,
    displayName: "Brawler",
  },
  "troop-samsa": {
    factionSlug: "nomads",
    unitId: 11683,
    displayName: "Freelance Operator Samsa",
  },
  "troop-anaconda": {
    factionSlug: "contracted-back-up",
    unitId: 1690,
    displayName: "Anaconda, Mercenary TAG Squad",
  },
};

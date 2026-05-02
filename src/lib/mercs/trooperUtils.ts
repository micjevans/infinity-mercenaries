/**
 * Pure helper functions for working with trooper/unit data.
 * Used by both CompanyManager and the company creation wizard.
 */
import { mapItemData } from "./metadata";
import type {
  MetadataItem,
  Profile,
  ProfileGroup,
  ProfileOption,
  Unit,
} from "./types";

export const EQUIPMENT_SLOTS = [
  "primary",
  "secondary",
  "sidearm",
  "accessory",
  "augment",
  "armor",
] as const;

const LIEUTENANT_SKILL: MetadataItem = { id: 119, name: "Lieutenant" };
const SPECIALIST_OPERATIVE_SKILL: MetadataItem = {
  id: 189,
  name: "Specialist Operative",
};
const DEFAULT_REGULAR_ORDER = { type: "REGULAR", list: 1, total: 1 };
const DEFAULT_LIEUTENANT_ORDER = { type: "LIEUTENANT", list: 0, total: 1 };

function sameMetadataItem(a: MetadataItem, b: MetadataItem): boolean {
  const aId = Number(a.id);
  const bId = Number(b.id);
  if (Number.isFinite(aId) && Number.isFinite(bId) && aId === bId) return true;
  const aName = String(a.name || "")
    .trim()
    .toLowerCase();
  const bName = String(b.name || "")
    .trim()
    .toLowerCase();
  return Boolean(aName && bName && aName === bName);
}

function appendUniqueMetadata(
  existing: MetadataItem[] = [],
  incoming: MetadataItem[] = [],
): MetadataItem[] {
  const result = [...existing];
  incoming.forEach((item) => {
    if (!result.some((existingItem) => sameMetadataItem(existingItem, item))) {
      result.push(item);
    }
  });
  return result;
}

function ensureCaptainSkills(skills: MetadataItem[] = []): MetadataItem[] {
  return appendUniqueMetadata(skills, [
    LIEUTENANT_SKILL,
    SPECIALIST_OPERATIVE_SKILL,
  ]);
}

function ensureCaptainOrders(
  orders: ProfileOption["orders"],
): Array<{ type: string; list: number; total: number }> {
  const result = orders?.length ? [...orders] : [DEFAULT_REGULAR_ORDER];
  if (!result.some((order) => String(order.type).toUpperCase() === "REGULAR")) {
    result.push(DEFAULT_REGULAR_ORDER);
  }
  if (
    !result.some((order) => String(order.type).toUpperCase() === "LIEUTENANT")
  ) {
    result.push(DEFAULT_LIEUTENANT_ORDER);
  }
  return result;
}

function mergeUniqueByIdOrName(
  first: MetadataItem[] = [],
  second: MetadataItem[] = [],
): MetadataItem[] {
  return appendUniqueMetadata(first, second);
}

export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `trooper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getPrimaryOption(trooper: any): any {
  return trooper?.profileGroups?.[0]?.options?.[0] || {};
}

export function getTrooperPoints(trooper: any): number {
  return Number(getPrimaryOption(trooper).points ?? trooper.points ?? 0);
}

export function getTrooperSwc(trooper: any): string {
  return String(getPrimaryOption(trooper).swc ?? trooper.swc ?? "0");
}

export function isTagCompanySpecialProfile(target: any): boolean {
  return (
    Boolean(target?.tagCompanySpecialTag) ||
    target?.id === "tag-company-special-profile" ||
    target?.slug === "tag-company-special-profile"
  );
}

export function getCaptainSpecOpsXpBudget(
  trooper: any,
  sourceUnit?: any,
): number {
  if (
    isTagCompanySpecialProfile(sourceUnit) ||
    isTagCompanySpecialProfile(trooper)
  ) {
    return 20;
  }
  return Math.max(0, 28 - getTrooperPoints(trooper));
}

export function numberValue(value: unknown): number {
  const parsed = Number(String(value ?? "0").replace("+", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function applyItemToTrooper(
  trooperDraft: any,
  item: any,
  type?: string,
): any {
  if (!trooperDraft || !item) return trooperDraft;
  const profile =
    trooperDraft.profileGroups?.[0]?.profiles?.[0] || trooperDraft;
  if (!profile) return trooperDraft;

  if (type) {
    if (
      ["move", "cc", "bs", "wip", "ph", "arm", "bts", "w", "s"].includes(type)
    ) {
      if (type === "move") {
        profile.move = (profile.move || [0, 0]).map(
          (movVal: number, movIndex: number) =>
            (movVal < 0 ? 0 : movVal) + item.extra[movIndex],
        );
      } else {
        profile[type] = Number(profile[type] || 0) + Number(item.extra || 0);
      }
    } else if (type === "type") {
      trooperDraft.resume = trooperDraft.resume || {};
      trooperDraft.resume.type = item.id;
    } else {
      const normalizedType =
        type === "equips"
          ? "equip"
          : type === "peripherals"
            ? "peripheral"
            : type;
      profile[normalizedType] = profile[normalizedType] || [];
      const foundIndex = profile[normalizedType].findIndex(
        (profileItem: MetadataItem) => profileItem.id === item.id,
      );
      if (foundIndex >= 0) {
        profile[normalizedType][foundIndex].extra = [
          ...(profile[normalizedType][foundIndex].extra || []),
          ...(item.extra || []),
        ];
      } else {
        profile[normalizedType].push({ id: item.id, extra: item.extra });
      }
    }
  }

  [
    "equips",
    "weapons",
    "skills",
    "peripherals",
    "move",
    "cc",
    "bs",
    "wip",
    "ph",
    "arm",
    "bts",
    "w",
    "s",
  ].forEach((key) => {
    const nested = item[key];
    if (!nested) return;
    (Array.isArray(nested) ? nested : [nested]).forEach((subItem) =>
      applyItemToTrooper(trooperDraft, subItem, key),
    );
  });

  return trooperDraft;
}

export function renderCombinedDetails(trooper: any): any {
  let renderedTrooper = structuredClone(trooper);
  EQUIPMENT_SLOTS.forEach((slot) => {
    if (trooper[slot])
      renderedTrooper = applyItemToTrooper(
        renderedTrooper,
        trooper[slot],
        trooper[slot].key,
      );
  });
  (trooper.perks || []).forEach((perk: MetadataItem) => {
    renderedTrooper = applyItemToTrooper(
      renderedTrooper,
      perk,
      String(perk.key || ""),
    );
  });
  return renderedTrooper;
}

export function cleanUnitForRoster(
  unit: Unit,
  group: ProfileGroup,
  option: ProfileOption,
  captain: boolean,
): any {
  const cleanedUnit = structuredClone({
    ...unit,
    id: makeId(),
    perks: [],
    profileGroups: [
      {
        ...group,
        category: 10,
        profiles: (group.profiles || []).map((profile: Profile) => {
          const mergedProfileSkills = option.skills
            ? appendUniqueMetadata(profile.skills || [], option.skills)
            : profile.skills || [];
          return {
            ...profile,
            skills: captain
              ? ensureCaptainSkills(mergedProfileSkills)
              : mergedProfileSkills,
            equip: option.equip
              ? [...(profile.equip || []), ...option.equip]
              : profile.equip || [],
            peripheral: option.peripheral
              ? [...(profile.peripheral || []), ...option.peripheral]
              : profile.peripheral || [],
            weapons: option.weapons
              ? [...(profile.weapons || []), ...option.weapons]
              : profile.weapons || [],
          };
        }),
        options: [
          {
            ...option,
            skills: [],
            equip: [],
            peripheral: [],
            weapons: [],
            orders: captain
              ? ensureCaptainOrders(option.orders)
              : option.orders?.length
                ? option.orders
                : [DEFAULT_REGULAR_ORDER],
          },
        ],
      },
    ],
    local: true,
    captain,
    xp: 0,
  });

  (unit.perks || []).forEach((perk) =>
    applyItemToTrooper(cleanedUnit, perk, String(perk.key || "")),
  );
  return cleanedUnit;
}

export function flattenTrooperForRoster(trooper: any): any {
  const next = structuredClone(trooper || {});
  const group = next.profileGroups?.[0];
  const profile = group?.profiles?.[0] || {};
  const option = group?.options?.[0] || {};

  const mergedSkills = mergeUniqueByIdOrName(
    next.skills || [],
    profile.skills || [],
  );
  const mergedWeapons = mergeUniqueByIdOrName(
    next.weapons || [],
    profile.weapons || [],
  );
  const mergedEquip = mergeUniqueByIdOrName(
    next.equip || next.equips || [],
    profile.equip || profile.equips || [],
  );
  const mergedPeripheral = mergeUniqueByIdOrName(
    next.peripheral || next.peripherals || [],
    profile.peripheral || profile.peripherals || [],
  );

  const stats = ["move", "cc", "bs", "ph", "wip", "arm", "bts", "w", "s"];
  stats.forEach((key) => {
    if (profile[key] !== undefined) {
      next[key] = profile[key];
    }
  });

  if (profile.type !== undefined) {
    next.resume = next.resume || {};
    next.resume.type = profile.type;
  }

  next.name = next.name || profile.name || next.isc || "Trooper";
  next.profileName = profile.name || next.profileName || next.name;
  next.optionName = String(
    option.name || next.optionName || next.profileName || next.name,
  );
  next.category = group?.category ?? next.category ?? 10;

  next.skills = mergedSkills;
  next.weapons = mergedWeapons;
  next.equip = mergedEquip;
  next.equips = mergedEquip;
  next.peripheral = mergedPeripheral;
  next.peripherals = mergedPeripheral;

  next.points = Number(option.points ?? next.points ?? 0);
  next.swc = String(option.swc ?? next.swc ?? "0");
  next.orders = (option.orders || next.orders || []).length
    ? option.orders || next.orders
    : [DEFAULT_REGULAR_ORDER];

  next.profileGroups = [];
  return next;
}

export function cleanSpecOpsItem(
  item: MetadataItem,
  itemType: string,
): MetadataItem {
  const subItems: Record<string, MetadataItem[]> = {};
  ["weapons", "skills", "equip", "equips", "peripheral", "peripherals"].forEach(
    (key) => {
      const nested = item[key] as MetadataItem[] | undefined;
      if (Array.isArray(nested)) {
        const normalizedKey = key.endsWith("s") ? key : `${key}s`;
        subItems[normalizedKey] = nested.map((subItem) =>
          cleanSpecOpsItem(subItem, normalizedKey),
        );
      }
    },
  );

  return {
    ...subItems,
    id: item.id,
    name: item.name,
    extra: item.extras || item.extra,
    key: itemType,
  };
}

export function getSpecOpsItemName(
  item: MetadataItem,
  metaKey: string,
): string {
  return (
    mapItemData({ ...item, key: metaKey })[0]?.name ||
    item.name ||
    String(item.id)
  );
}

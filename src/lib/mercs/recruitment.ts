import {
  findFactionBySlug,
  loadFactionData,
  loadFactionDataSet,
  mapType,
} from "./metadata";
import {
  INFINITY_SPEC_OPS_SKILL_ID,
  isInfinitySpecOpsProfile,
} from "./specops";
import type {
  CompanyTrooper,
  FactionData,
  MetadataItem,
  Profile,
  ProfileOption,
  Unit,
} from "./types";

const LIEUTENANT_SKILL_ID = 119;
const PERIPHERAL_CHARACTER_ID = 27;
const CHARACTER_CATEGORY_ID = 10;
const TAG_COMPANY_TYPE_ID = "tag";
const TAG_COMPANY_SPECIAL_PROFILE_ID = "tag-company-special-profile";
const TRIPHAMMER_ICON_URL =
  "https://assets.corvusbelli.net/army/img/logo/units/triphammers-repurposed-industrial-tags-1-1.svg";

function appendUnique<T>(existing: T[], incoming: T[] = []): T[] {
  const result = [...existing];
  incoming.forEach((item) => {
    if (
      !result.some(
        (existingItem) => JSON.stringify(existingItem) === JSON.stringify(item),
      )
    ) {
      result.push(item);
    }
  });
  return result;
}

function optionHasLieutenant(option: any): boolean {
  return (option.skills || []).some(
    (skill: MetadataItem) => Number(skill.id) === LIEUTENANT_SKILL_ID,
  );
}

function optionHasInfinitySpecOps(option: any): boolean {
  return (option.skills || []).some(
    (skill: MetadataItem) =>
      Number(skill.id) === INFINITY_SPEC_OPS_SKILL_ID ||
      skill.name === "Infinity Spec-Ops",
  );
}

function optionIsCaptainEligible(
  unit: Unit,
  profile: Profile,
  option: ProfileOption,
): boolean {
  if (unit.tagCompanySpecialTag) return true;
  return (
    optionHasLieutenant(option) ||
    isInfinitySpecOpsProfile(profile) ||
    optionHasInfinitySpecOps(option)
  );
}

function optionHasAllowedSwc(option: any): boolean {
  const swc = String(option.swc ?? "0");
  return swc === "0" || swc === "-" || swc.includes("+");
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `trooper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isCharacter(unit: Unit): boolean {
  return unit.resume?.category === CHARACTER_CATEGORY_ID;
}

function attachResume(data: FactionData): Unit[] {
  const resumeList = data.resume || [];
  return (data.units || []).map((unit) => ({
    ...unit,
    resume:
      resumeList.find((resume) => resume.id === unit.id) || unit.resume || null,
  }));
}

function makeTagCompanySpecialProfileUnit(): Unit {
  return {
    id: TAG_COMPANY_SPECIAL_PROFILE_ID,
    slug: TAG_COMPANY_SPECIAL_PROFILE_ID,
    isc: "Repurposed Mining Equipment",
    name: "Repurposed Mining Equipment",
    tagCompanySpecialTag: true,
    resume: {
      id: TAG_COMPANY_SPECIAL_PROFILE_ID,
      type: "TAG",
      logo: TRIPHAMMER_ICON_URL,
    },
    profileGroups: [
      {
        isc: "Repurposed Mining Equipment",
        profiles: [
          {
            name: "Repurposed Mining Equipment",
            move: [6, 2],
            cc: 15,
            bs: 12,
            ph: 14,
            wip: 12,
            arm: 5,
            bts: 3,
            w: 2,
            s: 5,
            skills: [
              { id: "nwi", name: "NWI" },
              { id: "dodge", name: "Dodge (+3)" },
              { id: "gizmokit", name: "Gizmokit" },
              { id: "immunity-shock", name: "Immunity (Shock)" },
              { id: "ecm-guided", name: "ECM (Guided -6)" },
            ],
            weapons: [
              { id: "combi-rifle", name: "Combi Rifle" },
              { id: "pistol", name: "Pistol" },
              { id: "ccw", name: "CCW" },
              { id: "ccw-antimaterial", name: "CC Weapon (Antimaterial)" },
            ],
            peripheral: [{ id: "turtlemek", name: "Turtlemek" }],
          },
        ],
        options: [
          {
            id: TAG_COMPANY_SPECIAL_PROFILE_ID,
            name: "Repurposed Mining Equipment",
            points: 40,
            swc: "0",
            orders: [{ type: "REGULAR", list: 1, total: 1 }],
          },
        ],
      },
    ],
  };
}

export async function loadRecruitmentPool(slugs: string[]): Promise<{
  units: Unit[];
  specops: {
    equip: MetadataItem[];
    skills: MetadataItem[];
    weapons: MetadataItem[];
  };
}> {
  const factionData = await loadFactionDataSet(slugs);
  const specops = {
    equip: [] as MetadataItem[],
    skills: [] as MetadataItem[],
    weapons: [] as MetadataItem[],
  };

  const units = factionData.flatMap((data) => {
    const specopsData = (data.specops || {}) as {
      equip?: MetadataItem[];
      equips?: MetadataItem[];
      skills?: MetadataItem[];
      weapons?: MetadataItem[];
      units?: Unit[];
    };

    specops.equip = appendUnique(
      specops.equip,
      specopsData.equip || specopsData.equips || [],
    );
    specops.skills = appendUnique(specops.skills, specopsData.skills || []);
    specops.weapons = appendUnique(specops.weapons, specopsData.weapons || []);

    const baseUnits = attachResume(data);
    const specopsUnits = (specopsData.units || []).length
      ? attachResume({
          units: specopsData.units,
          resume: data.resume,
        } as FactionData)
      : [];

    return [...baseUnits, ...specopsUnits];
  });

  return { units, specops };
}

export function getRecruitableUnits(
  units: Unit[],
  isCreatingCaptain: boolean,
  context?: {
    companyTypeId?: string;
    existingTroopers?: any[];
  },
): Unit[] {
  const tagProfileAlreadyUsed = (context?.existingTroopers || []).some(
    (trooper) =>
      Boolean(trooper?.tagCompanySpecialTag) ||
      trooper?.id === TAG_COMPANY_SPECIAL_PROFILE_ID ||
      trooper?.slug === TAG_COMPANY_SPECIAL_PROFILE_ID,
  );

  const withTagSpecialProfile =
    context?.companyTypeId === TAG_COMPANY_TYPE_ID && !tagProfileAlreadyUsed
      ? [...units, makeTagCompanySpecialProfileUnit()]
      : units;

  return withTagSpecialProfile
    .map((unit) => ({
      ...unit,
      profileGroups: unit.profileGroups
        .map((group) => ({
          ...group,
          options: group.options.filter((option) => {
            const profile = (group.profiles || [])[0] as Profile | undefined;
            const captainEligible = profile
              ? optionIsCaptainEligible(unit, profile, option)
              : false;
            return (
              optionHasAllowedSwc(option) &&
              captainEligible === isCreatingCaptain
            );
          }),
        }))
        .filter(
          (group) =>
            (group.profiles || []).length > 0 &&
            (group.options || []).length > 0,
        ),
    }))
    .map((unit) => ({
      ...unit,
      profileGroups: unit.profileGroups
        .map((group) => {
          const hasPeripheralProfile = group.profiles.some((profile) =>
            (profile.chars || []).some(
              (char) => char === PERIPHERAL_CHARACTER_ID,
            ),
          );
          if (!hasPeripheralProfile) return group;

          return {
            ...group,
            options: group.options.filter((option) =>
              unit.profileGroups.some((parentGroup) =>
                parentGroup.options.some((parentOption) =>
                  (parentOption.includes || []).some(
                    (include) => include.option === option.id,
                  ),
                ),
              ),
            ),
          };
        })
        .filter(
          (group) =>
            (group.profiles || []).length > 0 &&
            (group.options || []).length > 0,
        ),
    }))
    .filter((unit) => {
      const hasValidOptions =
        unit.profileGroups.length > 0 &&
        unit.profileGroups.every(
          (group) => group.options && group.options.length > 0,
        );
      const isCharacter = unit.resume?.category === CHARACTER_CATEGORY_ID;
      const isMercenaryPlaceholder = unit.slug?.startsWith("merc-");
      return hasValidOptions && !isCharacter && !isMercenaryPlaceholder;
    })
    .sort((a, b) => Number(a.resume?.type || 0) - Number(b.resume?.type || 0));
}

export function searchRecruitableUnits(
  units: Unit[],
  searchTerm: string,
): Unit[] {
  const normalized = searchTerm.trim().toLowerCase();
  if (!normalized) return units;
  return units.filter((unit) => unit.isc.toLowerCase().includes(normalized));
}

export type RecruitmentEntry = {
  id: string;
  unit: Unit;
  unitId: string | number;
  unitSlug: string;
  isc: string;
  optionName: string;
  profileName?: string;
  points: number;
  swc: string;
  sourceFaction: string;
  sourceSlug: string;
  type?: string | number | null;
  profile: Profile;
  group: any;
  option: ProfileOption;
  captainEligible: boolean;
};

export async function loadRecruitmentEntries(
  slugs: string[],
  isCreatingCaptain: boolean,
): Promise<RecruitmentEntry[]> {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];
  const dataSets = await Promise.all(
    uniqueSlugs.map(async (slug) => ({
      slug,
      faction: findFactionBySlug(slug),
      data: await loadFactionData(slug),
    })),
  );

  return dataSets
    .flatMap(({ slug, faction, data }) => {
      if (!data) return [];
      const sourceFaction = faction?.name || slug;

      return attachResume(data).flatMap((unit) => {
        if (isCharacter(unit) || unit.slug?.startsWith("merc-")) return [];

        return unit.profileGroups.flatMap((group, groupIndex) => {
          const profile = group.profiles?.[0];
          if (!profile) return [];

          return (group.options || [])
            .filter((option) => {
              const captainEligible = optionIsCaptainEligible(
                unit,
                profile,
                option,
              );
              return (
                optionHasAllowedSwc(option) &&
                captainEligible === isCreatingCaptain
              );
            })
            .map((option, optionIndex) => ({
              id: `${slug}:${unit.id}:${groupIndex}:${option.id ?? optionIndex}`,
              unit,
              unitId: unit.id,
              unitSlug: unit.slug,
              isc: unit.isc,
              optionName: String(option.name || unit.name || unit.isc),
              profileName: String(profile.name || group.isc || unit.isc),
              points: Number(option.points || 0),
              swc: String(option.swc ?? "0"),
              sourceFaction,
              sourceSlug: slug,
              type: profile.type ? mapType(profile.type) : null,
              profile,
              group,
              option,
              captainEligible: isCreatingCaptain,
            }));
        });
      });
    })
    .sort((a, b) => a.isc.localeCompare(b.isc) || a.points - b.points);
}

export function createCompanyTrooper(
  entry: RecruitmentEntry,
  captain = false,
): CompanyTrooper {
  return {
    id: makeId(),
    recruitmentId: entry.id,
    unitId: entry.unitId,
    unitSlug: entry.unitSlug,
    isc: entry.isc,
    optionName: entry.optionName,
    profileName: entry.profileName,
    points: entry.points,
    swc: entry.swc,
    sourceFaction: entry.sourceFaction,
    sourceSlug: entry.sourceSlug,
    type: entry.type,
    captain,
    xp: 0,
    injuries: [],
  };
}

export function createLegacyTrooper(
  entry: RecruitmentEntry,
  captain = false,
): any {
  const option = entry.option;
  const group = entry.group;

  const cleanedUnit = structuredClone({
    ...entry.unit,
    id: makeId(),
    perks: [],
    profileGroups: [
      {
        ...group,
        category: 10,
        profiles: (group.profiles || []).map((profile: Profile) => ({
          ...profile,
          skills: option.skills
            ? [...(profile.skills || []), ...option.skills]
            : profile.skills || [],
          equip: option.equip
            ? [...(profile.equip || []), ...option.equip]
            : profile.equip || [],
          equips: option.equips
            ? [...(profile.equips || []), ...option.equips]
            : profile.equips || [],
          peripheral: option.peripheral
            ? [...(profile.peripheral || []), ...option.peripheral]
            : profile.peripheral || [],
          peripherals: option.peripherals
            ? [...(profile.peripherals || []), ...option.peripherals]
            : profile.peripherals || [],
          weapons: option.weapons
            ? [...(profile.weapons || []), ...option.weapons]
            : profile.weapons || [],
        })),
        options: [
          {
            ...option,
            skills: [],
            equip: [],
            equips: [],
            peripheral: [],
            peripherals: [],
            weapons: [],
            orders:
              option.orders && option.orders.length > 0
                ? option.orders
                : [
                    {
                      type: "REGULAR",
                      list: 1,
                      total: 1,
                    },
                  ],
          },
        ],
      },
    ],
    local: true,
    captain,
    xp: 0,
  });

  return cleanedUnit;
}

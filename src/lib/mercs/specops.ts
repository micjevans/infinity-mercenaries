import type { Profile } from "./types";

export const INFINITY_SPEC_OPS_SKILL_ID = 204;

type SpecOpsAttributeKey = "cc" | "bs" | "ph" | "wip" | "arm" | "bts" | "w";

type SpecOpsChartEntry = {
  key: SpecOpsAttributeKey;
  label: string;
  upgrades: Array<{ xp: 2 | 5 | 10; delta: number }>;
  max: number;
};

export const defaultSpecOpsAttributeChart: SpecOpsChartEntry[] = [
  {
    key: "cc",
    label: "CC",
    upgrades: [
      { xp: 2, delta: 2 },
      { xp: 5, delta: 5 },
      { xp: 10, delta: 10 },
    ],
    max: 30,
  },
  {
    key: "bs",
    label: "BS",
    upgrades: [
      { xp: 2, delta: 1 },
      { xp: 5, delta: 2 },
      { xp: 10, delta: 3 },
    ],
    max: 15,
  },
  {
    key: "ph",
    label: "PH",
    upgrades: [
      { xp: 2, delta: 1 },
      { xp: 5, delta: 2 },
      { xp: 10, delta: 3 },
    ],
    max: 14,
  },
  {
    key: "wip",
    label: "WIP",
    upgrades: [
      { xp: 2, delta: 1 },
      { xp: 5, delta: 2 },
      { xp: 10, delta: 3 },
    ],
    max: 15,
  },
  {
    key: "arm",
    label: "ARM",
    upgrades: [
      { xp: 5, delta: 1 },
      { xp: 10, delta: 3 },
    ],
    max: 10,
  },
  {
    key: "bts",
    label: "BTS",
    upgrades: [
      { xp: 2, delta: 3 },
      { xp: 5, delta: 6 },
      { xp: 10, delta: 9 },
    ],
    max: 9,
  },
  { key: "w", label: "VITA", upgrades: [{ xp: 10, delta: 1 }], max: 2 },
];

export const defaultSpecOpsAttributeTableRows =
  defaultSpecOpsAttributeChart.map((entry) => ({
    label: entry.label,
    cells: [2, 5, 10].map((xp) => {
      const upgrade = entry.upgrades.find((option) => option.xp === xp);
      return upgrade ? `+${upgrade.delta}` : "-";
    }),
  }));

export const defaultSpecOpsAttributeLimitNote = `Limits: ${defaultSpecOpsAttributeChart
  .map((entry) => `${entry.label} max ${entry.max}`)
  .join(", ")}.`;

export function makeDefaultSpecOpsAttributeRules(
  profile: Profile,
): Record<
  string,
  { options: Array<{ val: number; xp: number }>; max: number }
> {
  return Object.fromEntries(
    defaultSpecOpsAttributeChart.map((entry) => {
      const baseValue = Number(profile[entry.key] || 0);
      return [
        entry.key,
        {
          options: [
            { val: baseValue, xp: 0 },
            ...entry.upgrades.map((upgrade) => ({
              val: baseValue + upgrade.delta,
              xp: upgrade.xp,
            })),
          ],
          max: entry.max,
        },
      ];
    }),
  );
}

export function isInfinitySpecOpsProfile(profile: Profile): boolean {
  return (profile.skills || []).some(
    (skill) =>
      skill.id === INFINITY_SPEC_OPS_SKILL_ID ||
      skill.name === "Infinity Spec-Ops",
  );
}

export function hasFactionSpecOpsChart(
  specops:
    | { equip?: unknown[]; skills?: unknown[]; weapons?: unknown[] }
    | null
    | undefined,
): boolean {
  return Boolean(
    (specops?.equip?.length || 0) +
    (specops?.skills?.length || 0) +
    (specops?.weapons?.length || 0),
  );
}

export function shouldUseDefaultSpecOpsAttributeChart(
  profile: Profile,
  specops:
    | { equip?: unknown[]; skills?: unknown[]; weapons?: unknown[] }
    | null
    | undefined,
): boolean {
  return !isInfinitySpecOpsProfile(profile) || !hasFactionSpecOpsChart(specops);
}

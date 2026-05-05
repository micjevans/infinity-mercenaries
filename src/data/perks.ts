import type { AttributeKey, MetadataItem } from "../lib/mercs/types";

export type PerkEffect = Partial<
  Record<AttributeKey, { extra: number | number[] }>
> & {
  skills?: MetadataItem[];
  weapons?: MetadataItem[];
  equips?: MetadataItem[];
  peripherals?: MetadataItem[];
  type?: string | number;
};

export type Perk = {
  tier: number;
  roll: string;
  name: string;
  detail?: string;
  note?: string;
  requires?: string[];
  effect?: PerkEffect;
};

export type PerkTree = {
  name: string;
  roll: string;
  summary: string;
  perks: Perk[];
  notes?: string[];
};

const perkSkill = (id: number, ...extra: number[]): MetadataItem =>
  extra.length > 0 ? { id, extra } : { id };

const perkEquip = (id: number, ...extra: number[]): MetadataItem =>
  extra.length > 0 ? { id, extra } : { id };

const perkStat = <K extends AttributeKey>(key: K, extra: number): PerkEffect =>
  ({ [key]: { extra } }) as PerkEffect;

export const perkTrees: PerkTree[] = [
  {
    name: "Initiative",
    roll: "1-7",
    summary:
      "Deployment, mobility, positioning, and opening-turn board control.",
    perks: [
      {
        tier: 1,
        roll: "1-6",
        name: "Minelayer",
        effect: { skills: [perkSkill(56)] },
      },
      {
        tier: 1,
        roll: "13-18",
        name: "Sapper",
        effect: { skills: [perkSkill(89)] },
      },
      { tier: 1, roll: "16-20", name: "MOV 6-2" },
      {
        tier: 2,
        roll: "1-6",
        name: "Minelayer",
        detail: "2",
        requires: ["Minelayer"],
        effect: { skills: [perkSkill(56, 267)] },
      },
      {
        tier: 2,
        roll: "4-9",
        name: "Combat Jump",
        effect: { skills: [perkSkill(35)] },
      },
      {
        tier: 2,
        roll: "7-12",
        name: "Forward Deployment",
        detail: "+8",
        effect: { skills: [perkSkill(161)] },
      },
      {
        tier: 2,
        roll: "10-15",
        name: "Parachutist",
        effect: { skills: [perkSkill(33)] },
      },
      { tier: 2, roll: "16-20", name: "MOV 6-4", requires: ["MOV 6-2"] },
      {
        tier: 3,
        roll: "4-9",
        name: "Combat Jump",
        detail: "+3",
        requires: ["Combat Jump"],
        effect: { skills: [perkSkill(35, 1)] },
      },
      {
        tier: 3,
        roll: "7-12",
        name: "Infiltration",
        requires: ["Forward Deployment +8"],
        effect: { skills: [perkSkill(47)] },
      },
      { tier: 3, roll: "19-20 or 1-3", name: "Covering Fire" },
      {
        tier: 4,
        roll: "7-12",
        name: "Infiltration",
        detail: "+3",
        requires: ["Infiltration"],
        effect: { skills: [perkSkill(48)] },
      },
      { tier: 4, roll: "16-20", name: "MOV 6-6", requires: ["MOV 6-4"] },
      {
        tier: 5,
        roll: "10-15",
        name: "Parachutist",
        detail: "Dep Zone",
        requires: ["Parachutist"],
        effect: { skills: [perkSkill(33, 48)] },
      },
    ],
  },
  {
    name: "Cool",
    roll: "5-10",
    summary: "Stealth, camouflage, close combat, and deception perks.",
    perks: [
      {
        tier: 1,
        roll: "1-4",
        name: "Decoy",
        effect: { skills: [perkSkill(215)] },
      },
      {
        tier: 1,
        roll: "3-6",
        name: "Stealth",
        effect: { skills: [perkSkill(164)] },
      },
      {
        tier: 1,
        roll: "9-12",
        name: "CC",
        detail: "+3",
        effect: perkStat("cc", 3),
      },
      {
        tier: 1,
        roll: "11-14",
        name: "Martial Arts L1",
        effect: { skills: [perkSkill(19)] },
      },
      {
        tier: 2,
        roll: "5-8",
        name: "Hidden Deployment",
        effect: { skills: [perkSkill(238)] },
      },
      {
        tier: 2,
        roll: "7-10",
        name: "Mimetism",
        detail: "-3",
        effect: { skills: [perkSkill(28, 6)] },
      },
      {
        tier: 3,
        roll: "7-10",
        name: "Mimetism",
        detail: "-6",
        requires: ["Mimetism -3"],
        effect: { skills: [perkSkill(28, 7)] },
      },
      {
        tier: 3,
        roll: "9-12",
        name: "CC",
        detail: "+6",
        requires: ["CC +3"],
        effect: perkStat("cc", 6),
      },
      {
        tier: 3,
        roll: "11-14",
        name: "Martial Arts L3",
        requires: ["Martial Arts L1"],
        effect: { skills: [perkSkill(21)] },
      },
      { tier: 3, roll: "13-16", name: "+3 CC", effect: perkStat("cc", 3) },
      {
        tier: 3,
        roll: "15-18",
        name: "Camouflage + Surprise Attack",
        detail: "-3",
        effect: { skills: [perkSkill(29), perkSkill(191, 6)] },
      },
      {
        tier: 5,
        roll: "11-14",
        name: "Martial Arts L5",
        requires: ["Martial Arts L3"],
        effect: { skills: [perkSkill(23)] },
      },
      {
        tier: 5,
        roll: "17-20 or 1-2",
        name: "Protheion",
        effect: { skills: [perkSkill(72)] },
      },
    ],
  },
  {
    name: "Body",
    roll: "8-13",
    summary:
      "Physical resilience, movement tools, armor, and survival upgrades.",
    notes: [
      "For Immunity (ARM) or Immunity (BTS), choose one. A unit may gain this perk twice.",
      "REM + Remote Presence makes the Trooper a REM in addition to any existing troop type, such as REM and HI.",
    ],
    perks: [
      {
        tier: 1,
        roll: "1-4",
        name: "Climbing Plus",
        effect: { skills: [perkSkill(82)] },
      },
      { tier: 1, roll: "1-6", name: "Immunity", detail: "DA, Shock" },
      { tier: 1, roll: "7-10", name: "Trade VITA for STR" },
      {
        tier: 1,
        roll: "11-14",
        name: "Terrain",
        detail: "Total",
        effect: { skills: [perkSkill(58, 33)] },
      },
      { tier: 2, roll: "1-6", name: "Immunity", detail: "AP" },
      {
        tier: 2,
        roll: "5-8",
        name: "Berserk",
        effect: { skills: [perkSkill(24)] },
      },
      {
        tier: 2,
        roll: "9-12",
        name: "Regeneration",
        effect: { skills: [perkSkill(62)] },
      },
      { tier: 2, roll: "13-16", name: "+1 ARM", effect: perkStat("arm", 1) },
      {
        tier: 2,
        roll: "15-18",
        name: "Natural Born Warrior",
        effect: { skills: [perkSkill(39)] },
      },
      {
        tier: 3,
        roll: "1-4",
        name: "Super Jump",
        effect: { skills: [perkSkill(74)] },
      },
      { tier: 3, roll: "1-6", name: "Immunity", detail: "ARM or BTS" },
      {
        tier: 3,
        roll: "5-8",
        name: "Berserk",
        detail: "+3",
        effect: { skills: [perkSkill(24, 1)] },
      },
      { tier: 3, roll: "7-10", name: "REM + Remote Presence" },
      { tier: 3, roll: "17-20", name: "+1 Wounds Skill" },
      {
        tier: 3,
        roll: "19-20 or 1-2",
        name: "+2 PH + CC Attack",
        detail: "+2 PS",
        effect: { ph: { extra: 2 }, skills: [perkSkill(240, 299)] },
      },
      { tier: 4, roll: "13-16", name: "+1 ARM", effect: perkStat("arm", 1) },
      { tier: 5, roll: "17-20", name: "+1 Wounds Skill" },
    ],
  },
  {
    name: "Reflex",
    roll: "11-16",
    summary:
      "Shooting accuracy, reaction fire, dodging, sensors, and active/reactive turn weapon control.",
    perks: [
      {
        tier: 1,
        roll: "1-5",
        name: "Triangulated Fire",
        effect: { skills: [perkSkill(241)] },
      },
      {
        tier: 1,
        roll: "4-8",
        name: "Sensor",
        effect: { skills: [perkSkill(65)] },
      },
      { tier: 1, roll: "7-11", name: "Dodge", detail: "+3, +1 inch" },
      {
        tier: 1,
        roll: "14-18",
        name: "Neurocinetics",
        effect: { skills: [perkSkill(109)] },
      },
      {
        tier: 1,
        roll: "19-20 or 1-3",
        name: "+1 BS",
        effect: perkStat("bs", 1),
      },
      { tier: 2, roll: "7-11", name: "Dodge", detail: "+6, +2 inches" },
      {
        tier: 2,
        roll: "9-13",
        name: "Sixth Sense",
        effect: { skills: [perkSkill(67)] },
      },
      { tier: 2, roll: "12-16", name: "360 Visor" },
      {
        tier: 2,
        roll: "14-18",
        name: "Neurocinetics",
        effect: { skills: [perkSkill(109)] },
      },
      {
        tier: 2,
        roll: "19-20 or 1-3",
        name: "+1 BS",
        effect: perkStat("bs", 1),
      },
      { tier: 3, roll: "7-11", name: "Dodge", detail: "-3" },
      {
        tier: 3,
        roll: "17-20",
        name: "BS Attack",
        detail: "+3",
        effect: { skills: [perkSkill(201, 1)] },
      },
      {
        tier: 4,
        roll: "1-5",
        name: "Marksmanship",
        effect: { skills: [perkSkill(156)] },
      },
      {
        tier: 4,
        roll: "14-18",
        name: "Neurocinetics",
        detail: "Burst 2 in Active instead of 1",
        effect: { skills: [perkSkill(109)] },
      },
      {
        tier: 4,
        roll: "17-20",
        name: "BS Attack",
        detail: "+1 SD",
        effect: { skills: [perkSkill(201, 308)] },
      },
      {
        tier: 4,
        roll: "19-20 or 1-3",
        name: "+1 BS",
        effect: perkStat("bs", 1),
      },
      {
        tier: 5,
        roll: "14-18",
        name: "Total Reaction",
        effect: { skills: [perkSkill(61)] },
      },
    ],
  },
  {
    name: "Intelligence",
    roll: "14-19",
    summary:
      "Medical tools, engineering, hacking tools, upgrades, support programs, and WIP growth.",
    notes: [
      "Only one initial Hacker perk path may be taken.",
      "A Hacker path can be taken by having a device on the initial profile and gaining one through perks or equipment.",
    ],
    perks: [
      {
        tier: 1,
        roll: "4-8",
        name: "Medikit",
        effect: { equips: [perkEquip(106)] },
      },
      {
        tier: 1,
        roll: "7-11",
        name: "Gizmokit",
        effect: { equips: [perkEquip(237)] },
      },
      {
        tier: 1,
        roll: "9-13",
        name: "Hacker",
        detail: "No device",
        effect: { skills: [perkSkill(1000)] },
      },
      {
        tier: 1,
        roll: "12-16",
        name: "Hacker",
        detail: "No device",
        effect: { skills: [perkSkill(1000)] },
      },
      {
        tier: 1,
        roll: "14-18",
        name: "Hacker",
        detail: "No device",
        effect: { skills: [perkSkill(1000)] },
      },
      {
        tier: 2,
        roll: "9-13",
        name: "Hacking Device",
        effect: { equips: [perkEquip(100)] },
      },
      {
        tier: 2,
        roll: "12-16",
        name: "Killer Hacking Device",
        effect: { equips: [perkEquip(145)] },
      },
      {
        tier: 2,
        roll: "14-18",
        name: "EVO Hacking Device",
        effect: { equips: [perkEquip(182)] },
      },
      {
        tier: 3,
        roll: "1-5",
        name: "Forward Observer + Flash Pulse",
        detail: "+1 SD",
      },
      {
        tier: 3,
        roll: "4-8",
        name: "Doctor",
        detail: "Reroll -3",
        effect: { skills: [perkSkill(53, 277, 6)] },
      },
      {
        tier: 3,
        roll: "7-11",
        name: "Engineer",
        detail: "Reroll -3",
        effect: { skills: [perkSkill(49, 277, 6)] },
      },
      { tier: 3, roll: "9-13", name: "Upgrade: White Noise" },
      { tier: 3, roll: "12-16", name: "Upgrade: Trinity", detail: "+3" },
      { tier: 3, roll: "14-18", name: "Network Support" },
      { tier: 3, roll: "17-20", name: "+2 WIP", effect: perkStat("wip", 2) },
      { tier: 3, roll: "19-20 or 1-3", name: "Non-Lethal", detail: "+1 SD" },
      {
        tier: 4,
        roll: "4-8",
        name: "Doctor",
        detail: "2W",
        effect: { skills: [perkSkill(53, 253)] },
      },
      {
        tier: 4,
        roll: "7-11",
        name: "Engineer",
        detail: "2W",
        effect: { skills: [perkSkill(49, 253)] },
      },
      {
        tier: 5,
        roll: "7-11",
        name: "Engineer",
        detail: "2W",
        effect: { skills: [perkSkill(49, 253)] },
      },
    ],
  },
  {
    name: "Empathy",
    roll: "17-20 or 1-4",
    summary:
      "Command skills, information control, Lieutenant upgrades, and organizer-friendly support abilities.",
    perks: [
      { tier: 1, roll: "1-4", name: "Logistician + Baggage" },
      {
        tier: 1,
        roll: "3-6",
        name: "Strategos Level 1",
        detail: "Reworked",
        effect: { skills: [perkSkill(69)] },
      },
      {
        tier: 1,
        roll: "17-20 or 1-2",
        name: "Discover",
        detail: "+3",
        effect: { skills: [perkSkill(131, 1)] },
      },
      {
        tier: 2,
        roll: "5-8",
        name: "Counter- intelligence",
        effect: { skills: [perkSkill(207)] },
      },
      { tier: 2, roll: "17-20 or 1-2", name: "Discover", detail: "Reroll" },
      {
        tier: 3,
        roll: "3-6",
        name: "Strategos Level 2",
        detail: "Reworked",
        effect: { skills: [perkSkill(70)] },
      },
      {
        tier: 3,
        roll: "7-10",
        name: "Lieutenant",
        detail: "+1 Order, Captain only",
        effect: { skills: [perkSkill(119)] },
      },
      {
        tier: 3,
        roll: "9-12",
        name: "Lieutenant",
        detail: "+1 Command Token, Captain only",
        effect: { skills: [perkSkill(119)] },
      },
      {
        tier: 3,
        roll: "11-14",
        name: "Lieutenant Roll",
        detail: "+3, Captain only",
      },
      { tier: 3, roll: "13-16", name: "Holomask" },
      {
        tier: 5,
        roll: "15-18",
        name: "Tactical Awareness",
        effect: { skills: [perkSkill(213)] },
      },
    ],
  },
];

// TAG Company exclusive perk tree — exported separately for use in CompanyManager
export const mechaPerkTree: PerkTree = {
  name: "Mecha",
  roll: "TAG Only",
  summary:
    "TAG Company exclusive upgrades covering armor scaling, ECM suites, weapon modifications, mobility, equipment access, ancillary enhancements, and endurance.",
  notes: [
    "This tree is exclusive to TAG Company TAGs. Perks must be chosen and cannot be rolled randomly.",
  ],
  perks: [
    // Armor column
    { tier: 1, roll: "1 Armor", name: "S6 + +1 ARM" },
    {
      tier: 2,
      roll: "1 Armor",
      name: "S7 + +1 ARM + SR-1",
      requires: ["S6 + +1 ARM"],
    },
    {
      tier: 4,
      roll: "1 Armor",
      name: "+1 ARM",
      requires: ["S7 + +1 ARM + SR-1"],
    },
    {
      tier: 5,
      roll: "1 Armor",
      name: "S8 + +1 ARM + Baggage",
      requires: ["+1 ARM"],
    },

    // ECM column
    { tier: 1, roll: "2 ECM", name: "BTS +3" },
    {
      tier: 2,
      roll: "2 ECM",
      name: "ECM",
      detail: "Total Control -3",
      requires: ["BTS +3"],
    },
    {
      tier: 4,
      roll: "2 ECM",
      name: "ECM",
      detail: "Hacker -3",
      requires: ["ECM (Total Control -3)"],
    },
    { tier: 5, roll: "2 ECM", name: "BTS +3", requires: ["ECM (Hacker -3)"] },

    // Weapons column
    {
      tier: 3,
      roll: "3 Weapons",
      name: "Give Primary Anti-Material Mode",
      detail: "B1 EXP",
    },
    {
      tier: 4,
      roll: "3 Weapons",
      name: "Buy HRMC for MULTI HMG Price",
      requires: ["Give Primary Anti-Material Mode"],
    },

    // Mobility column
    {
      tier: 1,
      roll: "4 Mobility",
      name: "Aerial + No Cover + Super Jump (Jet Prop) + Tech Recovery",
    },
    {
      tier: 2,
      roll: "4 Mobility",
      name: "Dodge",
      detail: "+3, -3",
      requires: ["Aerial + No Cover + Super Jump (Jet Prop) + Tech Recovery"],
    },
    {
      tier: 3,
      roll: "4 Mobility",
      name: "Super Jump",
      detail: '3"',
      requires: ["Dodge"],
    },
    { tier: 4, roll: "4 Mobility", name: "Move 8-2", requires: ["Super Jump"] },

    // Equipment column
    { tier: 2, roll: "5 Equipment", name: "TAG may equip two primaries" },
    {
      tier: 4,
      roll: "5 Equipment",
      name: "Tac Aware",
      requires: ["TAG may equip two primaries"],
    },

    // Ancillary column
    {
      tier: 1,
      roll: "6 Ancillary",
      name: "Ancillary: Gains any TAG support skill",
    },
    {
      tier: 2,
      roll: "6 Ancillary",
      name: "Ancillary: +3 WIP",
      requires: ["Ancillary: Gains any TAG support skill"],
    },
    {
      tier: 5,
      roll: "6 Ancillary",
      name: "Ancillary: Gain Explode Skill and can self trigger",
      requires: ["Ancillary: +3 WIP"],
    },

    // Endurance column
    { tier: 1, roll: "7 Endurance", name: "+1 Wound Skill" },
    { tier: 5, roll: "7 Endurance", name: "+1 Wound Skill" },
  ],
};

perkTrees.push(mechaPerkTree);

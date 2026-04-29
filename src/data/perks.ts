export type Perk = {
  tier: number;
  roll: string;
  name: string;
  detail?: string;
  note?: string;
  requires?: string[];
};

export type PerkTree = {
  name: string;
  roll: string;
  summary: string;
  perks: Perk[];
  notes?: string[];
};

export const perkTrees: PerkTree[] = [
  {
    name: "Initiative",
    roll: "1-7",
    summary:
      "Deployment, mobility, positioning, and opening-turn board control.",
    perks: [
      { tier: 1, roll: "1-6", name: "Minelayer" },
      { tier: 1, roll: "13-18", name: "Sapper" },
      { tier: 1, roll: "16-20", name: "MOV 6-2" },
      {
        tier: 2,
        roll: "1-6",
        name: "Minelayer",
        detail: "2",
        requires: ["Minelayer"],
      },
      { tier: 2, roll: "4-9", name: "Combat Jump" },
      { tier: 2, roll: "7-12", name: "Forward Deployment", detail: "+8" },
      { tier: 2, roll: "10-15", name: "Parachutist" },
      { tier: 2, roll: "16-20", name: "MOV 6-4", requires: ["MOV 6-2"] },
      {
        tier: 3,
        roll: "4-9",
        name: "Combat Jump",
        detail: "+3",
        requires: ["Combat Jump"],
      },
      {
        tier: 3,
        roll: "7-12",
        name: "Infiltration",
        requires: ["Forward Deployment +8"],
      },
      { tier: 3, roll: "19-20 or 1-3", name: "Covering Fire" },
      {
        tier: 4,
        roll: "7-12",
        name: "Infiltration",
        detail: "+3",
        requires: ["Infiltration"],
      },
      { tier: 4, roll: "16-20", name: "MOV 6-6", requires: ["MOV 6-4"] },
      {
        tier: 5,
        roll: "10-15",
        name: "Parachutist",
        detail: "Dep Zone",
        requires: ["Parachutist"],
      },
    ],
  },
  {
    name: "Cool",
    roll: "5-10",
    summary: "Stealth, camouflage, close combat, and deception perks.",
    perks: [
      { tier: 1, roll: "1-4", name: "Decoy" },
      { tier: 1, roll: "3-6", name: "Stealth" },
      { tier: 1, roll: "9-12", name: "CC", detail: "+3" },
      { tier: 1, roll: "11-14", name: "Martial Arts L1" },
      { tier: 2, roll: "5-8", name: "Hidden Deployment" },
      { tier: 2, roll: "7-10", name: "Mimetism", detail: "-3" },
      {
        tier: 3,
        roll: "7-10",
        name: "Mimetism",
        detail: "-6",
        requires: ["Mimetism -3"],
      },
      { tier: 3, roll: "9-12", name: "CC", detail: "+6", requires: ["CC +3"] },
      {
        tier: 3,
        roll: "11-14",
        name: "Martial Arts L3",
        requires: ["Martial Arts L1"],
      },
      { tier: 3, roll: "13-16", name: "+3 CC" },
      {
        tier: 3,
        roll: "15-18",
        name: "Camouflage + Surprise Attack",
        detail: "-3",
      },
      {
        tier: 5,
        roll: "11-14",
        name: "Martial Arts L5",
        requires: ["Martial Arts L3"],
      },
      { tier: 5, roll: "17-20 or 1-2", name: "Protheion" },
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
      { tier: 1, roll: "1-4", name: "Climbing Plus" },
      { tier: 1, roll: "1-6", name: "Immunity", detail: "DA, Shock" },
      { tier: 1, roll: "7-10", name: "Trade VITA for STR" },
      { tier: 1, roll: "11-14", name: "Terrain", detail: "Total" },
      { tier: 2, roll: "1-6", name: "Immunity", detail: "AP" },
      { tier: 2, roll: "5-8", name: "Berserk" },
      { tier: 2, roll: "9-12", name: "Regeneration" },
      { tier: 2, roll: "13-16", name: "+1 ARM" },
      { tier: 2, roll: "15-18", name: "Natural Born Warrior" },
      { tier: 3, roll: "1-4", name: "Super Jump" },
      { tier: 3, roll: "1-6", name: "Immunity", detail: "ARM or BTS" },
      { tier: 3, roll: "5-8", name: "Berserk", detail: "+3" },
      { tier: 3, roll: "7-10", name: "REM + Remote Presence" },
      { tier: 3, roll: "17-20", name: "+1 Wounds Skill" },
      {
        tier: 3,
        roll: "19-20 or 1-2",
        name: "+2 PH + CC Attack",
        detail: "+2 PS",
      },
      { tier: 4, roll: "13-16", name: "+1 ARM" },
      { tier: 5, roll: "17-20", name: "+1 Wounds Skill" },
    ],
  },
  {
    name: "Reflex",
    roll: "11-16",
    summary:
      "Shooting accuracy, reaction fire, dodging, sensors, and active/reactive turn weapon control.",
    perks: [
      { tier: 1, roll: "1-5", name: "Triangulated Fire" },
      { tier: 1, roll: "4-8", name: "Sensor" },
      { tier: 1, roll: "7-11", name: "Dodge", detail: "+3, +1 inch" },
      { tier: 1, roll: "14-18", name: "Neurocinetics" },
      { tier: 1, roll: "19-20 or 1-3", name: "+1 BS" },
      { tier: 2, roll: "7-11", name: "Dodge", detail: "+6, +2 inches" },
      { tier: 2, roll: "9-13", name: "Sixth Sense" },
      { tier: 2, roll: "12-16", name: "360 Visor", detail: "Accessory" },
      { tier: 2, roll: "14-18", name: "Neurocinetics" },
      { tier: 2, roll: "19-20 or 1-3", name: "+1 BS" },
      { tier: 3, roll: "7-11", name: "Dodge", detail: "-3" },
      { tier: 3, roll: "17-20", name: "BS Attack", detail: "+3" },
      { tier: 4, roll: "1-5", name: "Marksmanship" },
      {
        tier: 4,
        roll: "14-18",
        name: "Neurocinetics",
        detail: "Burst 2 in Active instead of 1",
      },
      { tier: 4, roll: "17-20", name: "BS Attack", detail: "+1 SD" },
      { tier: 4, roll: "19-20 or 1-3", name: "+1 BS" },
      { tier: 5, roll: "14-18", name: "Total Reaction" },
    ],
  },
  {
    name: "Intelligence",
    roll: "14-19",
    summary:
      "Medical tools, engineering, hacking roles, upgrades, support programs, and WIP growth.",
    notes: [
      "Only one initial Hacker perk path may be taken.",
      "A Hacker path can be taken by having a device on the initial profile and gaining one through the Role via perks or equipment.",
    ],
    perks: [
      { tier: 1, roll: "4-8", name: "Medikit", detail: "No slot required" },
      { tier: 1, roll: "7-11", name: "Gizmokit", detail: "No slot required" },
      { tier: 1, roll: "9-13", name: "Hacker", detail: "No device, Role" },
      { tier: 1, roll: "12-16", name: "Hacker", detail: "No device, Role" },
      { tier: 1, roll: "14-18", name: "Hacker", detail: "No device, Role" },
      { tier: 2, roll: "9-13", name: "Hacking Device" },
      { tier: 2, roll: "12-16", name: "Killer Hacking Device" },
      { tier: 2, roll: "14-18", name: "EVO Hacking Device" },
      {
        tier: 3,
        roll: "1-5",
        name: "Forward Observer + Flash Pulse",
        detail: "+1 SD, Role",
      },
      { tier: 3, roll: "4-8", name: "Doctor", detail: "Reroll -3, Role" },
      { tier: 3, roll: "7-11", name: "Engineer", detail: "Reroll -3, Role" },
      { tier: 3, roll: "9-13", name: "Upgrade: White Noise" },
      { tier: 3, roll: "12-16", name: "Upgrade: Trinity", detail: "+3" },
      { tier: 3, roll: "14-18", name: "Network Support" },
      { tier: 3, roll: "17-20", name: "+2 WIP" },
      { tier: 3, roll: "19-20 or 1-3", name: "Non-Lethal", detail: "+1 SD" },
      { tier: 4, roll: "4-8", name: "Doctor", detail: "2W" },
      { tier: 4, roll: "7-11", name: "Engineer", detail: "2W" },
      { tier: 5, roll: "7-11", name: "Engineer", detail: "2W" },
    ],
  },
  {
    name: "Empathy",
    roll: "17-20 or 1-4",
    summary:
      "Command skills, information control, Lieutenant upgrades, and organizer-friendly support abilities.",
    perks: [
      { tier: 1, roll: "1-4", name: "Logistician + Baggage" },
      { tier: 1, roll: "3-6", name: "Strategos Level 1", detail: "Reworked" },
      { tier: 1, roll: "17-20 or 1-2", name: "Discover", detail: "+3" },
      { tier: 2, roll: "5-8", name: "Counter- intelligence" },
      { tier: 2, roll: "17-20 or 1-2", name: "Discover", detail: "Reroll" },
      { tier: 3, roll: "3-6", name: "Strategos Level 2", detail: "Reworked" },
      {
        tier: 3,
        roll: "7-10",
        name: "Lieutenant",
        detail: "+1 Order, Captain only",
      },
      {
        tier: 3,
        roll: "9-12",
        name: "Lieutenant",
        detail: "+1 Command Token, Captain only",
      },
      {
        tier: 3,
        roll: "11-14",
        name: "Lieutenant Roll",
        detail: "+3, Captain only",
      },
      { tier: 3, roll: "13-16", name: "Holomask" },
      { tier: 5, roll: "15-18", name: "Tactical Awareness" },
    ],
  },
];

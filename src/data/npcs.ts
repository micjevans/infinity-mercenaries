export type NumericAttribute =
  | "cc"
  | "bs"
  | "ph"
  | "wip"
  | "arm"
  | "bts"
  | "vita";

export type NpcProfile = {
  id: string;
  name: string;
  subtitle?: string;
  sourceSheet: string;
  sourceRange: string;
  category: string;
  contracts: string[];
  ttsColor: string;
  troopClass: string;
  silhouette: string;
  minimumLevel: number;
  scaling?: {
    maxAttributes?: Record<NumericAttribute, number>;
    useMinimumLevel?: boolean;
    linearVita?: boolean;
  };
  ttsUsesSilhouette?: boolean;
  ttsSubtitleSeparator?: string;
  attributes: Record<NumericAttribute, number> & {
    mov: string;
  };
  equipment: string[];
  baseSkills: string[];
  weapons: string[];
  priority?: string[];
  traits?: string[];
  spawn?: string;
  description?: string;
  notes?: string;
};

export const npcScaling = {
  maxLevel: 20,
  growthFactor: 1,
  maxAttributes: {
    cc: 30,
    bs: 16,
    ph: 18,
    wip: 19,
    arm: 11,
    bts: 12,
    vita: 5,
  } satisfies Record<NumericAttribute, number>,
};

const brawlerBase = {
  mov: "4-4",
  cc: 17,
  bs: 12,
  ph: 11,
  wip: 12,
  arm: 2,
  bts: 3,
  vita: 1,
};

const heistBrawlerPriority = [
  "CC (ARO Only)",
  "Hack if able (Trinity > Total Control > Oblivion > Carbonite > Spotlight)",
  "BS Attack",
  "Place Deployable",
  "Hack if able (Holomask)",
];

const heistBrawlerCore = {
  name: "Brawler",
  sourceSheet: "The Heist",
  category: "Mercenary",
  contracts: ["The Heist"],
  ttsColor: "E38B08",
  troopClass: "MI",
  silhouette: "2",
  minimumLevel: 2,
  attributes: brawlerBase,
  baseSkills: ["Sixth Sense"],
  priority: heistBrawlerPriority,
};

const monsterScaling = {
  maxAttributes: {
    cc: 34,
    bs: 24,
    ph: 24,
    wip: 24,
    arm: 11,
    bts: 12,
    vita: 10,
  } satisfies Record<NumericAttribute, number>,
  useMinimumLevel: false,
  linearVita: true,
};

const monsterCore = {
  sourceSheet: "Monster Calcs",
  sourceRange: "A4:AF13",
  category: "Monster",
  contracts: ["Monster Hunt"],
  ttsColor: "00549E",
  troopClass: "SK",
  minimumLevel: 1,
  scaling: monsterScaling,
  ttsUsesSilhouette: true,
  ttsSubtitleSeparator: ": ",
};

const splitList = (value: string) =>
  value
    .split(/\s*[●•,]\s*/u)
    .map((item) => item.trim())
    .filter(Boolean);

const splitBullets = (value: string) =>
  value
    .split(/\s*[●•]\s*/u)
    .map((item) => item.trim())
    .filter(Boolean);

const splitPriority = (value: string) =>
  value
    .split(/\s*>\s*/u)
    .map((item) => item.trim())
    .filter(Boolean);

export const npcGroups = [
  {
    id: "the-mole-escort",
    title: "The Mole / Escort",
    description:
      "Scenario NPCs used by The Mole and Escort. This pilot group comes directly from the sheet tab of the same name.",
    profiles: [
      {
        id: "brawlers-mercenary-enforcers",
        name: "Brawlers",
        subtitle: "Mercenary Enforcers",
        sourceSheet: "The Mole/Escort",
        sourceRange: "B4:J13",
        category: "Mercenary",
        contracts: ["The Mole", "Escort"],
        ttsColor: "E38B08",
        troopClass: "LI",
        silhouette: "2",
        minimumLevel: 1,
        attributes: brawlerBase,
        equipment: [],
        baseSkills: ["Sixth Sense"],
        weapons: ["Rifle", "Light Shotgun (+1B)", "Pistol", "CC Weapon"],
        priority: ["CC", "Light Shotgun (+1B)", "Rifle", "Suppressive Fire"],
        traits: ["Aggressive", "Careful", "Precise"],
      },
    ] satisfies NpcProfile[],
  },
  {
    id: "the-heist",
    title: "The Heist",
    description:
      "Security NPCs and intruders used by The Heist, including multiple Brawler loadouts that share the same base profile.",
    profiles: [
      {
        ...heistBrawlerCore,
        id: "the-heist-brawler-sniper",
        subtitle: "Sniper",
        sourceRange: "C5:K18",
        equipment: ["Multispectral Visor L2"],
        weapons: ["MULTI Sniper Rifle", "AP Mine", "CC Weapon"],
        traits: ["Defensive", "Careful", "Precise", "Pursuant", "Overwatch"],
      },
      {
        ...heistBrawlerCore,
        id: "the-heist-brawler-hrl",
        subtitle: "Heavy Rocket Launcher",
        sourceRange: "C5:K19",
        equipment: ["X Visor"],
        weapons: ["Heavy Rocket Launcher", "AP Mine", "CC Weapon"],
        traits: ["Defensive", "Careful", "Precise", "Pursuant", "Overwatch"],
      },
      {
        ...heistBrawlerCore,
        id: "the-heist-brawler-khd",
        subtitle: "Killer Hacker",
        sourceRange: "C5:K20",
        equipment: [],
        weapons: [
          "Killer Hacking Device",
          "Submachine Gun",
          "Cybermine",
          "CC Weapon",
        ],
        traits: ["Defensive", "Careful", "Sneaky", "Precise", "Pursuant"],
      },
      {
        ...heistBrawlerCore,
        id: "the-heist-brawler-hd",
        subtitle: "Hacker",
        sourceRange: "C5:K21",
        equipment: [],
        weapons: ["Hacking Device", "Submachine Gun", "Cybermine", "CC Weapon"],
        traits: ["Defensive", "Careful", "Sneaky", "Precise", "Pursuant"],
      },
      {
        id: "the-heist-ninja",
        name: "Ninja",
        sourceSheet: "The Heist",
        sourceRange: "C23:K32",
        category: "Skirmisher",
        contracts: ["The Heist"],
        ttsColor: "E38B08",
        troopClass: "SK",
        silhouette: "2",
        minimumLevel: 2,
        attributes: {
          mov: "4-4",
          cc: 23,
          bs: 11,
          ph: 12,
          wip: 13,
          arm: 1,
          bts: 0,
          vita: 1,
        },
        equipment: [],
        baseSkills: [
          "Camouflage",
          "Climbing Plus",
          "Courage",
          'Dodge (+1")',
          "Martial Arts L3",
          "Mimetism (-6)",
          "Stealth",
          "Surprise Attack (-3)",
          "Terrain (Total)",
        ],
        weapons: [
          "Tactical Bow (+1 SD)",
          "DA CC Weapon (PS=5)",
          "Deployable Repeater",
        ],
        priority: ["CC", "Tac Bow", "Dep Rep", "Camo"],
        traits: ["Aggressive", "Sneaky", "Precise"],
      },
      {
        id: "the-heist-extreme-zellenkrieger",
        name: "Extreme Zellenkrieger",
        sourceSheet: "The Heist",
        sourceRange: "C34:K43",
        category: "Assault",
        contracts: ["The Heist"],
        ttsColor: "E38B08",
        troopClass: "TAG",
        silhouette: "5",
        minimumLevel: 1,
        attributes: {
          mov: "8-4",
          cc: 23,
          bs: 10,
          ph: 15,
          wip: 12,
          arm: 1,
          bts: 3,
          vita: 1,
        },
        equipment: [],
        baseSkills: [
          "Metachemistry (MOV 8-4)",
          "Berserk",
          "CC Attack (-3)",
          "Courage",
          'Dodge (+2")',
          "Immunity (BTS)",
          "Impetuous",
          "No Cover",
          "Natural Born Warrior",
        ],
        weapons: ["Pulzar", "Smoke Grenades", "DA CC Weapon (+1 SD, PS=4)"],
        priority: ["CC", "Pulzar", "Smoke Grenades"],
        traits: ["Aggressive", "Merciless"],
      },
    ] satisfies NpcProfile[],
  },
  {
    id: "containment",
    title: "Containment",
    description:
      "Hostile containment-zone NPCs, including prospectors, bounty hunters, and repurposed industrial TAGs.",
    profiles: [
      {
        id: "containment-diggers",
        name: "Diggers",
        subtitle: "Armed Prospectors (No Transmutation)",
        sourceSheet: "Containment",
        sourceRange: "C5:K14",
        category: "Prospector",
        contracts: ["Containment"],
        ttsColor: "E38B08",
        troopClass: "HI",
        silhouette: "2",
        minimumLevel: 1,
        attributes: {
          mov: "4-4",
          cc: 21,
          bs: 11,
          ph: 13,
          wip: 12,
          arm: 3,
          bts: 0,
          vita: 2,
        },
        equipment: [],
        baseSkills: [
          "CC Attack (+1B)",
          "Courage",
          'Dodge (+1")',
          "Immunity (Shock)",
          "Natural Born Warrior",
          "No Cover",
          "Sixth Sense",
        ],
        weapons: ["Chain Rifle (+1B)", "Grenades", "AP CC Weapon (PS=6)"],
        priority: ["CC", "Chain Rifle", "Grenades"],
        traits: ["Aggressive"],
      },
      {
        id: "containment-motorized-bounty-hunters",
        name: "Motorized Bounty Hunters",
        sourceSheet: "Containment",
        sourceRange: "C16:K25",
        category: "Bounty Hunter",
        contracts: ["Containment"],
        ttsColor: "E38B08",
        troopClass: "LI",
        silhouette: "4",
        minimumLevel: 2,
        attributes: {
          mov: "8-6",
          cc: 17,
          bs: 12,
          ph: 10,
          wip: 13,
          arm: 1,
          bts: 3,
          vita: 1,
        },
        equipment: ["Motorcycle"],
        baseSkills: [
          'Dodge (+2")',
          "Limited Cover",
          "Mimetism (-3)",
          "Sixth Sense",
        ],
        weapons: ["Red Fury", "Heavy Riotstopper", "PARA CC Weapon (-6)"],
        priority: ["CC (ARO Only)", "Red Fury", "Heavy Riotstopper"],
        traits: ["Aggressive"],
      },
      {
        id: "containment-triphammers",
        name: "Triphammers",
        subtitle: "Repurposed Industrial TAGs (No Transmutation)",
        sourceSheet: "Containment",
        sourceRange: "C27:K36",
        category: "Industrial TAG",
        contracts: ["Containment"],
        ttsColor: "E38B08",
        troopClass: "TAG",
        silhouette: "7",
        minimumLevel: 5,
        attributes: {
          mov: "6-4",
          cc: 17,
          bs: 13,
          ph: 16,
          wip: 12,
          arm: 7,
          bts: 3,
          vita: 3,
        },
        equipment: ["360 Visor"],
        baseSkills: [
          "BS Attack (SR-1)",
          "CC Attack (Antimaterial)",
          "Dodge (PH=9)",
          "Gizmokit (PH=10)",
          "Tactical Awareness",
          "Total Reaction",
        ],
        weapons: ["AP Spitfire", "Heavy Flamethrower", "AP CC Weapon (PS=4)"],
        priority: ["CC (ARO Only)", "AP Spitfire", "Flamethrower"],
        traits: ["Aggressive", "Careful"],
      },
    ] satisfies NpcProfile[],
  },
  {
    id: "holo-blink",
    title: "Holo Blink",
    description:
      "Projection NPC used by Holo Blink contracts, including respawn behavior tied to portal rolls.",
    profiles: [
      {
        id: "holo-blink-holoecho",
        name: "Holoecho",
        sourceSheet: "Holo Blink",
        sourceRange: "Contract Text",
        category: "Projection",
        contracts: ["Holo Blink"],
        ttsColor: "8D63D2",
        troopClass: "LI",
        silhouette: "2",
        minimumLevel: 1,
        attributes: {
          mov: "4-4",
          cc: 14,
          bs: 12,
          ph: 10,
          wip: 13,
          arm: 1,
          bts: 0,
          vita: 1,
        },
        equipment: ["360 Visor"],
        baseSkills: [
          "Mimetism (-6)",
          "Dodge (+3)",
          'Dodge (+2")',
          "Super-Jump",
          "Total Reaction",
        ],
        weapons: [
          "Holo Beam (Burst 2, PS 4, AP + Stun vs BTS, Ohotnik range bands, Non-Lethal)",
        ],
        notes:
          "When hit, a Holoecho is immediately destroyed without a Saving Roll. At the start of the game, the second player places it in the central Holo Zone.",
      },
    ] satisfies NpcProfile[],
  },
  {
    id: "monsters",
    title: "Monsters",
    description:
      "Monster Hunt creatures generated from the Monster Calcs tab, including spawn behavior and creature descriptions.",
    profiles: [
      {
        ...monsterCore,
        id: "monster-zephyrion",
        name: "Zephyrion",
        subtitle: "3BS, 0PH, 0WIP",
        silhouette: "2",
        attributes: {
          mov: "6-2",
          cc: 13,
          bs: 14,
          ph: 8,
          wip: 8,
          arm: 1,
          bts: 3,
          vita: 4,
        },
        equipment: splitList("360 Visor, X-Visor, MSV2, Nanoscreen"),
        baseSkills: splitBullets(
          "Total Reaction (Comms and CC included) ● Immunity (Continuous) ● ECM Guided (-6) ● Marksmanship ● Mimetism (-6) ● BS Attack (Continuous, Impact Template)",
        ),
        weapons: splitList(
          "Sniper Rifle, Spitfire, Combi Rifle, Living Turret (Disposable 3)",
        ),
        priority: splitPriority(
          "Combi > Spitfire > Sniper > Place Living Turret",
        ),
        traits: splitList("Defensive, Quick Draw"),
        spawn:
          "Within 8 inches of the back edge of the table. Place the Zephyrion such that it has LoF to as many enemies as possible, prioritizing the tracking trooper, elevated, and close to the back edge as possible.",
        description:
          "Zephyrion are swift and agile beings capable of harnessing the power of wind and fire. They possess remarkable ballistics skills, manipulating gusts of air to guide their fiery projectiles towards targets with deadly accuracy. Their scorching attacks leave a trail of destruction in their wake, making them feared opponents on the battlefield.",
      },
      {
        ...monsterCore,
        id: "monster-swiftrix",
        name: "Swiftrix",
        subtitle: "2BS, 1PH, 0WIP",
        silhouette: "2",
        attributes: {
          mov: "8-4",
          cc: 16,
          bs: 12,
          ph: 10,
          wip: 8,
          arm: 3,
          bts: 4,
          vita: 4,
        },
        equipment: splitList(
          "360 Visor, X-Visor, MSV1, Pheroware Tactics: Endgame, Saturation Zone (Always considered in a Sat Zone (-1B) to enemies)",
        ),
        baseSkills: splitBullets(
          "Total Reaction (Comms and CC included) ● Immunity (Continuous) ● ECM Guided (-6) ● Mimetism (-6) ● Martial Arts L3 ● Regeneration (At Start of Round) ● Climbing Plus ● BS Attack (Viral) ● CC Attack (Viral)",
        ),
        weapons: splitList(
          "Spitfire, Combi Rifle, Living Turret (Disposable 3), CC Weapon, Chain Colt",
        ),
        priority: splitPriority(
          "CC > Chain Colt > Combi > Spitfire > Place Living Turret",
        ),
        traits: splitList("Aggressive, Careful, Quick Draw"),
        spawn:
          "Place the Swiftrix within 16 inches of and with LoF to the tracking trooper. Attempt to hide from and be as far away from all other troopers as possible.",
        description:
          "Swiftrix are fierce predators, combining lightning-fast agility with venomous strikes. With their lightning-quick reflexes and deadly precision, they excel in close-quarters combat, utilizing their venomous fangs and lightning-like strikes to overpower adversaries.",
      },
      {
        ...monsterCore,
        id: "monster-psyroflux",
        name: "Psyroflux",
        subtitle: "2BS, 0PH, 1WIP",
        silhouette: "3",
        attributes: {
          mov: "6-2",
          cc: 15,
          bs: 12,
          ph: 8,
          wip: 10,
          arm: 1,
          bts: 5,
          vita: 4,
        },
        equipment: splitList(
          "360 Visor, X-Visor, MSV1, White Noise Zone (Always considered in a WNZ to enemies outside ZoC)",
        ),
        baseSkills: splitBullets(
          "Total Reaction (Comms and CC included) ● Immunity (Continuous) ● ECM Guided (-6) ● Mimetism (-6) ● Stealth ● BS Attack (E/M)",
        ),
        weapons: splitList(
          "Spitfire, Combi Rifle, Living Turret (Disposable 3), Pheroware Tactics: Endgame",
        ),
        priority: splitPriority(
          "Combi > Spitfire > Endgame > Place Living Turret",
        ),
        traits: splitList("Defensive, Careful, Quick Draw"),
        spawn:
          "Place the Psyroflux within 16 inches of and with LoF to the tracking trooper. Attempt to hide from and be as far away from all other troopers as possible.",
        description:
          "Psyroflux are enigmatic creatures with advanced mental prowess. They possess the uncanny ability to manipulate thoughts and energy, using their mind-based attacks to disrupt and confuse opponents.",
      },
      {
        ...monsterCore,
        id: "monster-ironhul",
        name: "Ironhul",
        subtitle: "1BS, 2PH, 0WIP",
        silhouette: "5",
        attributes: {
          mov: "8-4",
          cc: 19,
          bs: 10,
          ph: 12,
          wip: 8,
          arm: 5,
          bts: 5,
          vita: 4,
        },
        equipment: splitList(
          "360 Visor, MSV1, Pheroware Tactics: Endgame, SymbioMate (Refreshed per Hide)",
        ),
        baseSkills: splitBullets(
          "Total Reaction (Comms and CC included) ● Immunity (Continuous) ● ECM Guided (-6) ● Mimetism (-3) ● Martial Arts L3 ● Natural Born Warrior ● Dodge (+3, +1in) ● Immunity(Total) ● Vulnerability(Viral) ● Regeneration (At Start of Round) ● Climbing Plus ● Super Jump ● BS Attack (T2) ● CC Attack (T2)",
        ),
        weapons: splitList(
          "Combi Rifle, CC Weapon (-3), Chain Rifle, QAZ Creature (Disposable 3)",
        ),
        priority: splitPriority(
          'CC > Berserk (Short Skill (4")) > Chain > Combi > Place QAZ',
        ),
        traits: splitList("Aggressive, Quick Draw"),
        spawn:
          "The Ironhul will spawn within 8 inches of and with LoF to the tracking trooper, attempting to be as far from other troopers as possible.",
        description:
          "Ironhuls are towering behemoths with impenetrable armor and raw brute strength. They are unstoppable forces on the battlefield, charging headlong into combat with devastating blows.",
      },
      {
        ...monsterCore,
        id: "monster-synchronexus",
        name: "Synchronexus",
        subtitle: "1BS, 1PH, 1WIP",
        silhouette: "4",
        attributes: {
          mov: "8-4",
          cc: 18,
          bs: 10,
          ph: 10,
          wip: 10,
          arm: 3,
          bts: 6,
          vita: 4,
        },
        equipment: splitList(
          "360 Visor, MSV1, Hacking Device, Pheroware Tactics: Endgame, Firewall(-3), Living Repeater (Disposable 3), ECM: All Attacks (-3)",
        ),
        baseSkills: splitBullets(
          "Total Reaction (Comms and CC included) ● Immunity (Continuous) ● ECM Guided (-6) ● Mimetism (-3) ● Martial Arts L3 ● Regeneration (At Start of Round) ● Climbing Plus ● Stealth ● BS Attack (ARM+BTS) ● CC Attack (ARM+BTS) ● Comms Attack (ARM+BTS)",
        ),
        weapons: splitList(
          "Combi Rifle, CC Weapon, Chain Colt, Pheroware Tactics: Endgame",
        ),
        priority: splitPriority("CC > Chain Colt > Endgame > Combi"),
        traits: splitList("Aggressive, Careful, Sneaky, Quick Draw"),
        spawn:
          'Let the player determine if the tracking troop is worst at shooting, CC, or hacking. If shooting, the monster will spawn within 16" in LoF as far from all enemies as it can in cover. If CC, it will spawn in base to base. If hacking, it will spawn within ZoC and out of LoF of any troopers, as far from all enemies as possible and prone.',
        description:
          "Synchronexus embodies the perfect balance of agility, strength, and cunning intellect. These elusive beings synchronize their movements to enhance their combat capabilities and adapt between ranged, close, and quantronic threats.",
      },
      {
        ...monsterCore,
        id: "monster-illusorix",
        name: "Illusorix",
        subtitle: "1BS, 0PH, 2WIP",
        silhouette: "1",
        attributes: {
          mov: "6-2",
          cc: 17,
          bs: 10,
          ph: 8,
          wip: 12,
          arm: 1,
          bts: 7,
          vita: 4,
        },
        equipment: splitList(
          "360 Visor, MSV1, Dazer (ZoC is Difficult Terrain to enemies)",
        ),
        baseSkills: splitBullets(
          "Total Reaction (Comms and CC included) ● Immunity (Continuous) ● ECM Guided (-6) ● Mimetism (-3) ● Hacker ● Stealth ● Tactical Awareness ● BS Attack (Stun) ● Comms Attack(Provided Ammo + Stun)",
        ),
        weapons: splitList(
          "Combi Rifle, Pheroware Tactics: Endgame, Living Repeater (Disposable 3)",
        ),
        priority: splitPriority("Comms > Combi > Living Repeater > Camoflauge"),
        traits: splitList("Defensive, Careful, Precise, Sneaky"),
        spawn:
          "Spawn the Illusorix within ZoC and out of LoF of the tracking trooper. Attempt to hide from and be as far away from all other troopers as possible.",
        description:
          "Illusorix are cunning and elusive creatures, master manipulators of shadows and illusions. They strike from the shadows with precise attacks and deceptive tactics.",
      },
      {
        ...monsterCore,
        id: "monster-krusharak",
        name: "Krusharak",
        subtitle: "0BS, 3PH, 0WIP",
        silhouette: "7",
        attributes: {
          mov: "10-6",
          cc: 22,
          bs: 8,
          ph: 14,
          wip: 8,
          arm: 7,
          bts: 6,
          vita: 4,
        },
        equipment: splitList(
          "360 Visor, Pheroware Tactics: Endgame, ECM: CC (-3)",
        ),
        baseSkills: splitBullets(
          "Total Reaction (Comms and CC included) ● Immunity (Continuous) ● ECM Guided (-6) ● Martial Arts L5 ● Natural Born Warrior ● Dodge (+6, +2in) ● Immunity(Total, Non-Lethal) ● Vulnerability(Viral) ● Regeneration (At Start of Round) ● Climbing Plus ● Super Jump ● BS Attack (PARA) ● CC Attack (N+DA+PARA)(Make 2 PARA saves and take a wound for each failure)",
        ),
        weapons: splitList(
          "CC Weapon (-6), Chain Rifle (+1B), QAZ Creature (Disposable 3)",
        ),
        priority: splitPriority(
          'CC > Berserk (Short Skill (6")) > Chain > QAZ',
        ),
        traits: splitList("Aggressive"),
        spawn:
          "Place the Krusharak as close to the center of all the quadrants as possible with LoF to the tracking trooper.",
        description:
          "Krusharaks are towering brutes fueled by unbridled rage and unmatched physical power. With each thunderous strike, they leave a path of devastation.",
      },
      {
        ...monsterCore,
        id: "monster-shadyfurx",
        name: "Shadyfurx",
        subtitle: "0BS, 2PH, 1WIP",
        silhouette: "3",
        attributes: {
          mov: "8-6",
          cc: 21,
          bs: 8,
          ph: 12,
          wip: 10,
          arm: 5,
          bts: 7,
          vita: 4,
        },
        equipment: splitList(
          "360 Visor, Hacking Device, Pheroware Tactics: Endgame, Firewall(-3), Living Repeater (Disposable 3), Eclipse Zone (Always considered in Eclipse to enemies outside ZoC)",
        ),
        baseSkills: splitBullets(
          "Total Reaction (Comms and CC included) ● Immunity (Continuous) ● ECM Guided (-6) ● Martial Arts L3 ● Natural Born Warrior ● Dodge (+3, +1in) ● Immunity(Total) ● Vulnerability(Viral) ● Regeneration (At Start of Round) ● Climbing Plus ● Super Jump ● Stealth ● BS Attack (E/M) ● CC Attack (E/M)",
        ),
        weapons: splitList(
          "CC Weapon (-3), Chain Rifle, QAZ Creature (Disposable 3), Pheroware Tactics: Endgame",
        ),
        priority: splitPriority(
          'CC > Berserk (Short Skill (6")) > Chain > Endgame > Place QAZ',
        ),
        traits: splitList("Aggressive, Careful, Precise, Sneaky"),
        spawn:
          "The Shadyfurx will spawn within 8 inches of the tracking trooper, attempting to be as close to all other troopers as possible with LoF to no enemies.",
        description:
          "Shadyfurx are fearsome warriors with a mastery of technology and formidable combat skills. Their cybernetic enhancements and close-quarters prowess make them dangerous infiltrators.",
      },
      {
        ...monsterCore,
        id: "monster-psyshredor",
        name: "Psyshredor",
        subtitle: "0BS, 1PH, 2WIP",
        silhouette: "3",
        attributes: {
          mov: "8-4",
          cc: 20,
          bs: 8,
          ph: 10,
          wip: 12,
          arm: 3,
          bts: 8,
          vita: 4,
        },
        equipment: splitList(
          "360 Visor, Hacking Device, Killer Hacking Device, Pheroware Tactics: Endgame, Firewall(-6), Living Repeater (Disposable 3)",
        ),
        baseSkills: splitBullets(
          "Total Reaction (Comms and CC included) ● Immunity (Continuous) ● ECM Guided (-6) ● Martial Arts L3 ● Regeneration (At Start of Round) ● Climbing Plus ● Hacker ● Stealth ● Tactical Awareness ● BS Attack (ARM=0, State: Unconscious) ● CC Attack (ARM=0, State: Unconscious) ● Comms Attack(BTS=0, State: Unconscious)",
        ),
        weapons: splitList(
          "CC Weapon, Chain Colt, Pheroware Tactics: Endgame, Living Repeater (Disposable 3), Sepsitor Plus (Will use instead of other templates)",
        ),
        priority: splitPriority(
          "CC > Sepsitor > Comms > Camoflauge > Place Living Repeater (Doesn't break camo)",
        ),
        traits: splitList("Defensive, Careful, Precise, Sneaky"),
        spawn:
          "The Psyshredor will spawn within 8 inches of the tracking trooper, attempting to be as far away from all other troopers as possible with LoF to no enemies.",
        description:
          "Psyshredor are psychic warriors adept at tearing through mental barriers and disrupting the minds of their opponents. Their mastery of mind-based attacks makes them formidable quantronic predators.",
      },
      {
        ...monsterCore,
        id: "monster-shadighor",
        name: "Shadighor",
        subtitle: "0BS, 0PH, 3WIP",
        silhouette: "5",
        attributes: {
          mov: "8-4",
          cc: 19,
          bs: 8,
          ph: 8,
          wip: 14,
          arm: 1,
          bts: 9,
          vita: 4,
        },
        equipment: splitList("360 Visor, ECM: Hacker (-3)"),
        baseSkills: splitBullets(
          "Total Reaction (Comms and CC included) ● Immunity (Continuous) ● ECM Guided (-6) ● Sixth Sense ● Hacker ● Stealth ● Tactical Awareness ● Comms Attack(Provided Ammo + N)",
        ),
        weapons: splitList(
          "Pheroware Tactics: Endgame, Living Repeater (Disposable 3)",
        ),
        priority: splitPriority(
          "Comms > Camoflauge > Place Repeater (Doesn't break camo)",
        ),
        traits: splitList("Defensive, Careful, Precise, Sneaky"),
        spawn:
          "Spawn the Shadighor in the back 8 inches of the edge of the table such that it is prone and as difficult to reach and see as possible while being as far from all enemies as possible. Additionally, place two living repeaters in quadrants 1 and 2 as close to the center as possible while giving no LoF to enemies.",
        description:
          "Shadighor are shadowy assassins adept at slicing through the veil of darkness. They blend with shadows, strike silently, and manipulate the battlefield through stealth and technology.",
      },
    ] satisfies NpcProfile[],
  },
  {
    id: "titanomachy",
    title: "Titanomachy",
    description:
      "Boss and NPC profiles for Titanomachy. The Titan is a fixed boss that does not scale; the Demititan scales with renown.",
    profiles: [
      {
        id: "titanomachy-titan",
        name: "Titan",
        sourceSheet: "Titanomachy",
        sourceRange: "Contract Text",
        category: "Boss",
        contracts: ["Titanomachy"],
        ttsColor: "C94040",
        troopClass: "TAG",
        silhouette: "8",
        minimumLevel: 1,
        attributes: {
          mov: "--",
          cc: 25,
          bs: 15,
          ph: 17,
          wip: 17,
          arm: 9,
          bts: 9,
          vita: 1,
        },
        equipment: [
          "360 Visor",
          "Nanoscreen",
          "TinBot: Firewall (-3)",
          "Spotlight (+1B)",
        ],
        baseSkills: [
          "Total Reaction",
          "Martial Arts Level 5",
          "BS Attack (+2 Dam)",
          "Adaptive Ammo",
          "Adaptive Armor",
          "Behemoth",
          "Hacker",
        ],
        weapons: ["E/M Spitfire", "PARA CC Weapon (-3)"],
        notes:
          "Deploy the Titan 16 inches from the sides and 28 inches from the players' edge. Wounds = 4 + 4 per every 300 deployed Renown (rounded to nearest 300). See Adaptive Armor and Behemoth rules above.",
      },
      {
        id: "titanomachy-demititan",
        name: "Demititan",
        sourceSheet: "Titanomachy",
        sourceRange: "Contract Text",
        category: "NPC",
        contracts: ["Titanomachy"],
        ttsColor: "8D63D2",
        troopClass: "MI",
        silhouette: "2",
        minimumLevel: 1,
        scaling: {
          maxAttributes: {
            cc: 25,
            bs: 8,
            ph: 20,
            wip: 16,
            arm: 6,
            bts: 7,
            vita: 3,
          },
        },
        attributes: {
          mov: "--",
          cc: 15,
          bs: 8,
          ph: 14,
          wip: 12,
          arm: 2,
          bts: 3,
          vita: 1,
        },
        equipment: ["360 Visor"],
        baseSkills: [
          "BS Attack with Phero-Booster B2 in ARO",
          "CC Attack with PARA CCW (-3) B3 in ARO",
          "Guard (No LoF)",
          "Exrah",
        ],
        weapons: [],
        notes:
          "At the start of the game, deploy 2 Demititans 24 inches from the players' edge and 8 inches from either side. The Titan may deploy more through Reinforce.",
      },
    ] satisfies NpcProfile[],
  },
];

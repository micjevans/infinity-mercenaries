export type MarketAlignment = "Neutral" | "Lawful" | "Chaotic";

export type MarketItem = {
  name: string;
  cost: string;
  swc?: string;
  req?: string;
  type?: string;
  arm?: string;
  bts?: string;
  effect?: string;
};

export type MarketSection = {
  name: string;
  columns: Array<"name" | "cost" | "swc" | "req" | "type" | "arm" | "bts" | "effect">;
  items: MarketItem[];
  note?: string;
};

export type WarMarket = {
  name: string;
  roll?: string;
  faction?: string;
  specialty?: string;
  alignment: MarketAlignment;
  sections: MarketSection[];
  notes?: string[];
};

export const na2MarketAccess = [
  { sectorial: "Druze", market: "Salaam Suuk" },
  { sectorial: "Ikari", market: "Bantai Yamaco" },
  { sectorial: "Dashat", market: "Frontier General" },
  { sectorial: "White", market: "Number One" }
];

export const warMarkets: WarMarket[] = [
  {
    name: "Base Market",
    alignment: "Neutral",
    sections: [
      {
        name: "Primary",
        columns: ["name", "cost", "swc"],
        items: [
          { name: "Combi Rifle", cost: "5", swc: "-" },
          { name: "MK12", cost: "12", swc: "-" },
          { name: "Spitfire", cost: "18", swc: "1" },
          { name: "HMG", cost: "24", swc: "1.5" }
        ]
      },
      {
        name: "Secondary",
        columns: ["name", "cost", "swc"],
        items: [
          { name: "Shock Mines", cost: "5", swc: "-" },
          { name: "Deployable Repeater", cost: "8", swc: "-" },
          { name: "Boarding Shotgun", cost: "10", swc: "-" }
        ]
      },
      {
        name: "Sidearm",
        columns: ["name", "cost", "swc"],
        items: [
          { name: "Stun Pistol", cost: "1", swc: "-" },
          { name: "DA CCW", cost: "3", swc: "-" },
          { name: "Grenades", cost: "4", swc: "-" },
          { name: "PARA CC (-3)", cost: "4", swc: "-" }
        ]
      },
      {
        name: "Accessories",
        columns: ["name", "cost", "swc"],
        items: [
          { name: "Albedo (-3)", cost: "8", swc: "-" },
          { name: "MSV1", cost: "10", swc: "-" },
          { name: "Tinbot: Firewall (-3)", cost: "10", swc: "-" },
          { name: "BS Attack (Guided)", cost: "20", swc: "-" }
        ]
      },
      {
        name: "Roles",
        columns: ["name", "cost", "swc"],
        items: [
          { name: "Doctor (+Medikit)", cost: "10", swc: "-" },
          { name: "Engineer (+Gizmokit)", cost: "10", swc: "-" },
          { name: "Forward Observer (+Flash Pulse)", cost: "8", swc: "-" },
          { name: "Hacker (+Hacking Device)", cost: "12", swc: "0.5" },
          { name: "Hacker (+Killer Hacking Device)", cost: "10", swc: "-" }
        ]
      },
      {
        name: "Armor",
        columns: ["name", "type", "cost", "arm", "bts", "effect"],
        items: [
          { name: "Belts and Pouches", type: "-", cost: "5", arm: "-", bts: "-", effect: "Equipment Slot +1 (of choice)" },
          { name: "Mobility Suit", type: "LI", cost: "5", arm: "-", bts: "-", effect: "Climbing Plus, Terrain (Total), 6-4 MOV" },
          { name: "Stim Suit", type: "MI", cost: "15", arm: "3", bts: "3", effect: "Dogged" },
          { name: "Heavy Armor", type: "HI", cost: "20", arm: "4", bts: "3", effect: "Wound Skill +1" }
        ],
        note: "Belts and Pouches grants an additional equipment slot of choice. Heavy Armor's Wound Skill stacks with the increase from becoming HI."
      },
      {
        name: "SWC",
        columns: ["name", "cost", "effect"],
        items: [{ name: "SWC +0.5", cost: "10", effect: "Increase Company SWC by 0.5." }]
      }
    ]
  },
  {
    name: "Number One",
    roll: "1-2",
    faction: "PanO",
    specialty: "MULTI",
    alignment: "Lawful",
    sections: [
      { name: "Primary", columns: ["name", "cost", "swc"], items: [
        { name: "MULTI Rifle", cost: "8", swc: "-" },
        { name: "MULTI Marksman Rifle", cost: "12", swc: "-" },
        { name: "MULTI Sniper Rifle", cost: "21", swc: "1.5" },
        { name: "Feuerbach", cost: "25", swc: "1.5" },
        { name: "MULTI HMG", cost: "28", swc: "2" }
      ] },
      { name: "Secondary", columns: ["name", "cost", "swc"], items: [
        { name: "Drop Bears", cost: "6", swc: "-" },
        { name: "WildParrots", cost: "10", swc: "-" }
      ] },
      { name: "Sidearm", columns: ["name", "cost", "swc"], items: [{ name: "MULTI Pistol", cost: "8", swc: "-" }] },
      { name: "Accessories", columns: ["name", "cost", "swc"], items: [{ name: "MSV2", cost: "20", swc: "-" }] },
      { name: "Augments", columns: ["name", "req", "cost"], items: [
        { name: "BS=11", req: "Cannot have BS Attack (+#)", cost: "10" },
        { name: "BS Attack (-1 SR)", req: "-", cost: "10" },
        { name: "Armed Turret (MMR)", req: "Engineer", cost: "10" },
        { name: "Discoballer + Deactivator", req: "Forward Observer", cost: "10" }
      ], note: "BS=11 sets the trooper's current value to this number. It may be increased further after the augment." },
      { name: "Armor", columns: ["name", "type", "cost", "arm", "bts", "effect"], items: [
        { name: "Blink Suit", type: "LI", cost: "15", arm: "1", bts: "-", effect: "Hidden Deployment" },
        { name: "Bagh Mari Suit", type: "MI", cost: "20", arm: "2", bts: "-", effect: "MSV1, Mimetism (-3)" },
        { name: "Superheavy Armor", type: "HI", cost: "30", arm: "5", bts: "6", effect: "2W, NWI, S5" },
        { name: "Swiss Order Armor", type: "HI", cost: "40", arm: "5", bts: "6", effect: "Religious, Mimetism (-6)" }
      ], note: "Superheavy Armor makes the unit 2 VITA with NWI, replacing previous Wounds Skill. MOV is always 4-4." }
    ]
  },
  {
    name: "Jade Temu",
    roll: "3-4",
    faction: "Yu Jing",
    specialty: "AP",
    alignment: "Neutral",
    sections: [
      { name: "Primary", columns: ["name", "cost", "swc"], items: [
        { name: "AP Rifle", cost: "7", swc: "-" },
        { name: "AP Marksman Rifle", cost: "11", swc: "-" },
        { name: "Missile Launcher", cost: "16", swc: "1.5" },
        { name: "AP HMG", cost: "26", swc: "1.5" }
      ] },
      { name: "Secondary", columns: ["name", "cost", "swc"], items: [
        { name: "Panzerfaust", cost: "9", swc: "-" },
        { name: "AP Mine", cost: "6", swc: "-" }
      ] },
      { name: "Sidearm", columns: ["name", "cost", "swc"], items: [
        { name: "AP + DA CCW", cost: "6", swc: "-" },
        { name: "AP Heavy Pistol", cost: "8", swc: "-" }
      ] },
      { name: "Accessories", columns: ["name", "cost", "swc"], items: [
        { name: "Holomask", cost: "5", swc: "-" },
        { name: "Tinbot: Firewall (-6)", cost: "15", swc: "-" }
      ] },
      { name: "Augments", columns: ["name", "req", "cost"], items: [
        { name: "CC Attack (-1 SR)", req: "-", cost: "6" },
        { name: "Armed Turret (Combi)", req: "Engineer", cost: "5" }
      ] },
      { name: "Armor", columns: ["name", "type", "cost", "arm", "bts", "effect"], items: [
        { name: "Jumpsuit", type: "LI", cost: "5", arm: "-", bts: "-", effect: "Combat Jump (-3)" },
        { name: "Ambush Suit", type: "MI", cost: "10", arm: "2", bts: "3", effect: "Decoy (2)" },
        { name: "Haidao Armor", type: "HI", cost: "20", arm: "3", bts: "3", effect: "NCO" },
        { name: "Hsien Armor", type: "HI", cost: "38", arm: "4", bts: "6", effect: "MSV2" }
      ], note: "If the trooper already has Combat Jump, Jumpsuit grants Combat Jump (+3)." }
    ]
  },
  {
    name: "Arachne Req",
    roll: "5-6",
    faction: "Nomads",
    specialty: "Breaker",
    alignment: "Chaotic",
    sections: [
      { name: "Primary", columns: ["name", "cost", "swc"], items: [
        { name: "Breaker Combi", cost: "8", swc: "-" },
        { name: "Breaker Spitfire", cost: "20", swc: "1" },
        { name: "Thunderbolt", cost: "16", swc: "-" }
      ] },
      { name: "Secondary", columns: ["name", "cost", "swc"], items: [
        { name: "Cybermine", cost: "8", swc: "-" },
        { name: "Fast Panda", cost: "10", swc: "-" },
        { name: "Pitcher", cost: "20", swc: "1" }
      ] },
      { name: "Sidearm", columns: ["name", "cost", "swc"], items: [
        { name: "Breaker Pistol", cost: "6", swc: "-" },
        { name: "Silenced Pistol", cost: "8", swc: "-" }
      ] },
      { name: "Accessories", columns: ["name", "cost", "swc"], items: [{ name: "Repeater", cost: "10", swc: "-" }], note: "Repeaters are inactive while in Marker State." },
      { name: "Roles", columns: ["name", "cost", "swc"], items: [{ name: "Hacker (+Hacking Device Plus)", cost: "15", swc: "0.5" }] },
      { name: "Augments", columns: ["name", "req", "cost"], items: [
        { name: "Comms Attack (-1 SR)", req: "Hacker", cost: "6" },
        { name: "Hacking UPGRADE: Trinity", req: "Hacker", cost: "8" }
      ] },
      { name: "Armor", columns: ["name", "type", "cost", "arm", "bts", "effect"], items: [
        { name: "Chemtank", type: "-", cost: "5", arm: "-", bts: "-", effect: "Impetuous, Metachemistry, Limited Cover" },
        { name: "Hellcat Dropsuit", type: "MI", cost: "15", arm: "2", bts: "3", effect: "Combat Jump (-3), Parachutist" },
        { name: "Riot Armor", type: "HI", cost: "25", arm: "3", bts: "3", effect: "MSV1, Dodge (+3), Frenzy" },
        { name: "Black Labs Body Modification", type: "REM", cost: "15", arm: "-", bts: "-", effect: "VITA becomes STR, Remote Presence, Courage" }
      ], note: "Chemtank's Metachemistry roll is made once when purchased and stays attached to the armor. If the trooper already has Combat Jump, Hellcat Dropsuit grants Combat Jump (+3)." }
    ]
  },
  {
    name: "Salaam Suuk",
    roll: "7-8",
    faction: "Haq",
    specialty: "Continuous",
    alignment: "Lawful",
    sections: [
      { name: "Primary", columns: ["name", "cost", "swc"], items: [
        { name: "Heavy Rocket Launcher", cost: "12", swc: "1" },
        { name: "Chain Rifle (+1B)", cost: "10", swc: "-" },
        { name: "Vulkan Shotgun", cost: "12", swc: "-" }
      ] },
      { name: "Secondary", columns: ["name", "cost", "swc"], items: [
        { name: "Flammenspear", cost: "8", swc: "-" },
        { name: "Jammer", cost: "10", swc: "-" },
        { name: "Light Rocket Launcher", cost: "11", swc: "0.5" }
      ] },
      { name: "Sidearm", columns: ["name", "cost", "swc"], items: [
        { name: "Kobra Pistol", cost: "3", swc: "-" },
        { name: "Chain Colt", cost: "5", swc: "-" },
        { name: "Continuous CCW", cost: "6", swc: "-" }
      ] },
      { name: "Accessories", columns: ["name", "cost", "swc"], items: [{ name: "Holoprojector", cost: "10", swc: "-" }] },
      { name: "Augments", columns: ["name", "req", "cost"], items: [
        { name: "Hacking UPGRADE: Cybermask", req: "Hacker", cost: "6" },
        { name: "Doctor (+3)", req: "Doctor", cost: "7" },
        { name: "Doctor (2W)", req: "Doctor", cost: "7" }
      ] },
      { name: "Armor", columns: ["name", "type", "cost", "arm", "bts", "effect"], items: [
        { name: "Bashi Holo Suit", type: "LI", cost: "15", arm: "2", bts: "-", effect: "Holomask, Holoprojector, Surprise Attack (-3)" },
        { name: "Motorcycle", type: "-", cost: "16", arm: "-", bts: "-", effect: "MOV 8-4, Motorcycle (S4), Impetuous, Mimetism (-3), No Cover" },
        { name: "Namurr Mobility Suit", type: "MI", cost: "18", arm: "2", bts: "6", effect: "Climbing Plus, MOV 6-2, +1 Wounds Skill" },
        { name: "Hazmat Suit", type: "HI", cost: "20", arm: "-", bts: "9", effect: "Immunity (Continuous)" }
      ] }
    ]
  },
  {
    name: "Frontier General",
    roll: "9-10",
    faction: "Ariadna",
    specialty: "T2",
    alignment: "Neutral",
    sections: [
      { name: "Primary", columns: ["name", "cost", "swc"], items: [
        { name: "T2 Rifle", cost: "6", swc: "-" },
        { name: "T2 Marksman Rifle", cost: "10", swc: "-" },
        { name: "T2 Boarding Shotgun", cost: "12", swc: "-" },
        { name: "T2 Sniper Rifle", cost: "20", swc: "1.5" },
        { name: "Portable Autocannon", cost: "30", swc: "1.5" }
      ] },
      { name: "Secondary", columns: ["name", "cost", "swc"], items: [
        { name: "T2 Tactical Bow", cost: "8", swc: "-" },
        { name: "Contender", cost: "10", swc: "-" },
        { name: "Ohotnik", cost: "12", swc: "-" }
      ] },
      { name: "Sidearm", columns: ["name", "cost", "swc"], items: [
        { name: "Trench Hammer", cost: "5", swc: "-" },
        { name: "T2 CCW", cost: "6", swc: "-" },
        { name: "Assault Pistol", cost: "6", swc: "-" }
      ] },
      { name: "Accessories", columns: ["name", "cost", "swc"], items: [{ name: "Smoke Grenades", cost: "8", swc: "-" }] },
      { name: "Augments", columns: ["name", "req", "cost"], items: [
        { name: "PH=12", req: "-", cost: "10" },
        { name: "Thrown Attack (+3)", req: "BS Attack (PH)", cost: "5" },
        { name: "Deployable Cover", req: "Engineer", cost: "5" }
      ], note: "PH=12 sets the trooper's current value to this number. It may be increased further after the augment." },
      { name: "Armor", columns: ["name", "type", "cost", "arm", "bts", "effect"], items: [
        { name: "Irmandihno Wetsuit", type: "LI", cost: "15", arm: "1", bts: "-", effect: "Booty, Engineer" },
        { name: "Scout Suit", type: "LI", cost: "15", arm: "1", bts: "-", effect: "Camouflage, Infiltrate, Surprise Attack (-3)" },
        { name: "Cuckoo Virus Infusion", type: "-", cost: "20", arm: "4", bts: "-", effect: "MOV 6-4, Super Jump, +2 Wounds Skill, No Primary" },
        { name: "Teseum Plate Armor", type: "HI", cost: "20", arm: "5", bts: "=0", effect: "Immunity (IMM-B), lose Hackable trait" }
      ], note: "Teseum Plate Armor cannot raise BTS above 0. Irmandihno Wetsuit's Booty roll is made once and stays attached to the armor." }
    ]
  },
  {
    name: "Alpha Sec",
    roll: "11-12",
    faction: "Aleph/O-12",
    specialty: "E/M / PARA",
    alignment: "Lawful",
    sections: [
      { name: "Primary", columns: ["name", "cost", "swc"], items: [
        { name: "Adhesive Launcher Rifle", cost: "6", swc: "-" },
        { name: "E/M Carbine", cost: "8", swc: "-" },
        { name: "E/M Grenade Launcher", cost: "12", swc: "0.5" }
      ] },
      { name: "Secondary", columns: ["name", "cost", "swc"], items: [
        { name: "Zapper", cost: "8", swc: "-" },
        { name: "Heavy Riotstopper", cost: "10", swc: "-" },
        { name: "E/Mitter", cost: "12", swc: "-" }
      ] },
      { name: "Sidearm", columns: ["name", "cost", "swc"], items: [
        { name: "E/M Grenades", cost: "6", swc: "-" },
        { name: "PARA CCW (-6)", cost: "8", swc: "-" },
        { name: "E/M CCW", cost: "12", swc: "-" }
      ] },
      { name: "Accessories", columns: ["name", "cost", "swc"], items: [{ name: "Eclipse Grenades", cost: "12", swc: "-" }] },
      { name: "Roles", columns: ["name", "cost", "swc"], items: [{ name: "Hacker (+EVO Hacking Device)", cost: "15", swc: "0.5" }] },
      { name: "Augments", columns: ["name", "req", "cost"], items: [
        { name: "WIP=12", req: "-", cost: "10" },
        { name: "Armed Turret (E/Mitter)", req: "Engineer", cost: "12" },
        { name: "Hacking UPGRADE: Assisted Fire", req: "Killer/Hacking Device", cost: "15" }
      ], note: "WIP=12 sets the trooper's current value to this number. It may be increased further after the augment." },
      { name: "Armor", columns: ["name", "type", "cost", "arm", "bts", "effect"], items: [
        { name: "Myrmidon Suit", type: "LI", cost: "15", arm: "2", bts: "-", effect: "Frenzy, Mimetism (-6), Stealth" },
        { name: "Waverider Cybersuit", type: "MI", cost: "30", arm: "3", bts: "6", effect: "Hacker, Hacking Device (UPGRADE: Oblivion (+1B))" },
        { name: "Hoplite Armor", type: "HI", cost: "30", arm: "3", bts: "6", effect: "Immunity (Enhanced), Religious" },
        { name: "Gamma Armor", type: "HI", cost: "40", arm: "6", bts: "6", effect: "2W, NWI, S5" }
      ], note: "Gamma Armor makes the unit 2 VITA/STR with NWI, replacing previous Wounds Skill. MOV is always 4-4." }
    ]
  },
  {
    name: "Greengrocer",
    roll: "13-14",
    faction: "Tohaa",
    specialty: "Viral",
    alignment: "Lawful",
    sections: [
      { name: "Primary", columns: ["name", "cost", "swc"], items: [
        { name: "Viral Combi", cost: "8", swc: "-" },
        { name: "Viral Marksman Rifle", cost: "12", swc: "-" },
        { name: "Viral Sniper Rifle", cost: "21", swc: "1.5" }
      ] },
      { name: "Secondary", columns: ["name", "cost", "swc"], items: [
        { name: "Viral Tactical Bow", cost: "6", swc: "-" },
        { name: "Viral Mine", cost: "8", swc: "-" },
        { name: "Nanopulser", cost: "10", swc: "-" }
      ] },
      { name: "Sidearm", columns: ["name", "cost", "swc"], items: [
        { name: "Viral CCW", cost: "6", swc: "-" },
        { name: "Viral Pistol", cost: "8", swc: "-" }
      ] },
      { name: "Accessories", columns: ["name", "cost", "swc"], items: [
        { name: "PT: Endgame", cost: "15", swc: "0.5" },
        { name: "PT: Eraser (Disposable 2)", cost: "13", swc: "0.5" }
      ] },
      { name: "Augments", columns: ["name", "req", "cost"], items: [
        { name: "QAZ Creature (Disposable 1, Perimeter, Deployable)", req: "Doctor", cost: "12" },
        { name: "Peripheral (Controller)", req: "-", cost: "5 + Cost of Unit" }
      ], note: "QAZ works like a Deployable Armed Turret but places a QAZ. Peripheral (Controller) adds a non-servant Tohaa peripheral unit to the company." },
      { name: "Armor", columns: ["name", "type", "cost", "arm", "bts", "effect"], items: [
        { name: "Nanosuit", type: "LI", cost: "8", arm: "1", bts: "3", effect: "Nanoscreen, No Cover" },
        { name: "Taqeul Armor", type: "MI", cost: "20", arm: "3", bts: "6", effect: "Regeneration, Immunity (Shock)" },
        { name: "Symbio-Resonance", type: "-", cost: "20", arm: "-", bts: "-", effect: "Combine Transmutation (X)" },
        { name: "Ablative Armor", type: "HI", cost: "20", arm: "3", bts: "3", effect: "Symbiomate (Self Use)" }
      ], note: "Symbio-Resonance lets a unit with Transmutation (X) choose one profile, remove remaining profiles, and lose Transmutation (X). Ablative Armor starts with Symbiomate effects." }
    ]
  },
  {
    name: "Bantai Yamaco",
    roll: "15-16",
    faction: "JSA",
    specialty: "K1",
    alignment: "Chaotic",
    sections: [
      { name: "Primary", columns: ["name", "cost", "swc"], items: [
        { name: "K1 Combi", cost: "8", swc: "-" },
        { name: "K1 Marksman Rifle", cost: "12", swc: "-" },
        { name: "K1 Sniper Rifle", cost: "21", swc: "1.5" }
      ] },
      { name: "Secondary", columns: ["name", "cost", "swc"], items: [
        { name: "K1+DA Tactical Bow", cost: "8", swc: "-" },
        { name: "K1 Mine", cost: "8", swc: "-" }
      ] },
      { name: "Sidearm", columns: ["name", "cost", "swc"], items: [
        { name: "EXP CCW", cost: "12", swc: "-" },
        { name: "Monofilament CCW", cost: "15", swc: "-" }
      ] },
      { name: "Accessories", columns: ["name", "cost", "swc"], items: [{ name: "Bangbomb (+4)", cost: "3", swc: "-" }] },
      { name: "Augments", columns: ["name", "req", "cost"], items: [
        { name: "CC=21", req: "-", cost: "10" },
        { name: "CC Attack (AP)", req: "-", cost: "10" },
        { name: "Camouflage [1 Use]", req: "Forward Observer", cost: "10" }
      ], note: "CC=21 sets the trooper's current value to this number. It may be increased further after the augment." },
      { name: "Armor", columns: ["name", "type", "cost", "arm", "bts", "effect"], items: [
        { name: "Harmonic Combat Exosuit", type: "-", cost: "10", arm: "-", bts: "-", effect: "Martial Arts Lvl (+1)" },
        { name: "Oniwaban Suit", type: "LI", cost: "15", arm: "1", bts: "-", effect: "Infiltration, Camouflage, Hidden Deployment" },
        { name: "Power Suit", type: "MI", cost: "10", arm: "2", bts: "6", effect: "PH=15, CC Attack (PS=5 Optional)" },
        { name: "Shizoku Armor", type: "HI", cost: "30", arm: "5", bts: "6", effect: "Berserk, Frenzy" }
      ], note: "Harmonic Combat Exosuit increases Martial Arts by 1 or grants MA1. If the troop already has Infiltration, Oniwaban Suit grants Infiltration (+3). Power Suit's CC Attack cannot change Monofilament or Vorpal PS." }
    ]
  },
  {
    name: "Exrah Surplus",
    roll: "17-18",
    faction: "CA",
    specialty: "Plasma",
    alignment: "Chaotic",
    sections: [
      { name: "Primary", columns: ["name", "cost", "swc"], items: [
        { name: "Pulzar", cost: "8", swc: "-" },
        { name: "Plasma Rifle", cost: "12", swc: "-" },
        { name: "Red Fury", cost: "18", swc: "1" },
        { name: "Plasma Sniper Rifle", cost: "25", swc: "1.5" }
      ] },
      { name: "Secondary", columns: ["name", "cost", "swc"], items: [
        { name: "Dazer", cost: "5", swc: "-" },
        { name: "Sepsitor", cost: "15", swc: "-" }
      ], note: "Sepsitorized is automatically cancelled at the end of every Turn." },
      { name: "Sidearm", columns: ["name", "cost", "swc"], items: [{ name: "Vorpal CCW", cost: "12", swc: "-" }] },
      { name: "Accessories", columns: ["name", "cost", "swc"], items: [
        { name: "Chest Mine", cost: "6", swc: "-" },
        { name: "MSV3", cost: "25", swc: "-" }
      ] },
      { name: "Augments", columns: ["name", "req", "cost"], items: [
        { name: "Hacking UPGRADE: Total Control (Targets: HI/REM/VH, PS=7)", req: "Hacker", cost: "15" },
        { name: "Shasvastii, Impersonation", req: "Forward Observer", cost: "20" }
      ], note: "POS is automatically cancelled at the end of every Turn. Impersonation is modified in Mercenaries." },
      { name: "Armor", columns: ["name", "type", "cost", "arm", "bts", "effect"], items: [
        { name: "Unstable Exrah Exoskeleton", type: "-", cost: "10", arm: "-", bts: "-", effect: "Exrah, Explode (PS=4), Super-Jump" },
        { name: "EI Comm Implant", type: "-", cost: "20", arm: "-", bts: "-", effect: "Fireteam: Wildcard (Counts as any)" },
        { name: "Nexus Stim Suit", type: "MI", cost: "20", arm: "3", bts: "3", effect: "NWI" },
        { name: "Morat Heavy Armor", type: "HI", cost: "30", arm: "4", bts: "6", effect: "Immunity (AP), Warhorse, Tinbot: Firewall (-3)" }
      ], note: "EI Comm Implant allows the trooper to join any Fireteam and count as any other Trooper." }
    ]
  }
];

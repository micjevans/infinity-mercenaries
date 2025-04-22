import { traits } from "./traits";

export const events = [
  {
    id: 1,
    description: "A cop pulls you over for driving erratically…",
    traits: [],
    options: [
      {
        id: 1,
        description: "(CC-10)...you reach for the cops gun",
        traits: [traits.chaotic, traits.weapon, traits.attack, traits.xp],
      },
      {
        id: 2,
        description: "(PH)...you floor it and drive away",
        traits: [traits.chaotic, traits.xp],
      },
      {
        id: 3,
        description: "(WIP)...you talk your way out with money",
        traits: [traits.lawful, traits.p2p],
      },
    ],
  },
  {
    id: 2,
    description:
      "An ammo dealer supplies you with faulty ammo and refuses to refund you…",
    traits: [traits.swc],
    options: [
      {
        id: 1,
        description: "(BS) …you attack the dealer's crew",
        traits: [traits.chaotic, traits.attack, traits.xp],
      },
      {
        id: 2,
        description: "(PS=10+ARM) …you let him shoot you to prove your point",
        traits: [traits.attack],
      },
      {
        id: 3,
        description:
          "(WIP) …intimidate the dealer into giving you an honest refund",
        traits: [traits.cr],
      },
    ],
  },
  {
    id: 3,
    description:
      "You catch one of your Mercs in romantic cahoots with a rival Merc team member after they met in the most recent contract…",
    traits: [traits.mvp, traits.opponent],
    options: [
      {
        id: 1,
        description: "(PS=10) …do nothing and see what happens",
        traits: [
          traits.xp,
          (traitData) => ({ ...traits.cr(traitData), neg: true }),
        ],
      },
      {
        id: 2,
        description: "(WIP) …convince them to stop seeing each other",
        traits: [traits.cr],
      },
      {
        id: 3,
        description: "(PH) …knock some sense into them",
        traits: [traits.xp, traits.attack],
      },
    ],
  },
  {
    id: 4,
    description:
      "You get wind that a Rival Mercs team is planning an ambush on your team after some unfinished business from the most recent contract…",
    traits: [traits.opponent],
    options: [
      {
        id: 1,
        description: "(CC-10) …hide in wait and counter ambush them",
        traits: [traits.attack, traits.chaotic, traits.xp],
      },
      {
        id: 2,
        description: "(WIP) …avoid the confrontation",
        traits: [(traitData) => traits.cr(traitData, "Stealth"), traits.attack],
      },
      {
        id: 3,
        description: "(WIP) …report them to the cops",
        traits: [traits.lawful],
      },
    ],
  },
  {
    id: 5,
    description:
      "Select a Merc that went unconscious this contract. A rival Mercs team has taken them hostage after the most recent contract…",
    traits: [traits.opponent],
    options: [
      {
        id: 1,
        description: "(WIP) …you negotiate a ransom",
        traits: [traits.p2p, traits.lawful, traits.xp],
      },
      {
        id: 2,
        description: "(BS) …you ambush them at the drop site",
        traits: [traits.chaotic, traits.attack, traits.xp],
      },
      {
        id: 3,
        description: "(PH) …let the Merc escape on their own",
        traits: [
          traits.merc,
          traits.xp,
          (traitData) => ({ ...traits.cr(traitData), neg: true }),
        ],
      },
    ],
  },
  {
    id: 6,
    description:
      "One of your Mercs has decided he's better suited to be the captain…",
    traits: [],
    options: [
      {
        id: 1,
        description: "(PS=10) …allow the change of leadership",
        traits: [
          (traitData) => ({ ...traits.cr(traitData), neg: true }),
          traits.lt,
        ],
      },
      {
        id: 2,
        description: "(WIP) …negotiate a new salary",
        traits: [traits.captain, traits.xp, traits.p2p],
      },
      {
        id: 3,
        description: "(CC-10) …agni kai",
        traits: [traits.captain, traits.attack, traits.chaotic],
      },
    ],
  },
  {
    id: 7,
    description:
      "The Merc with the highest renown must be selected for this event. They have run into legal trouble and must present themselves in court…",
    traits: [],
    options: [
      {
        id: 1,
        description: "(PS=10) …you settle the issue out of court",
        traits: [traits.p2p, traits.xp],
      },
      {
        id: 2,
        description: "(WIP) …they defend themselves in court",
        traits: [traits.cr, traits.lawful],
      },
      {
        id: 3,
        description:
          "(CC-10) …they attempt to intimidate the opposing legal team",
        traits: [traits.cr, traits.chaotic],
      },
    ],
  },
  {
    id: 8,
    description:
      "You left behind your work laptop at the last contract and the opposing Merc team took it to see what they could gain…",
    traits: [],
    options: [
      {
        id: 1,
        description: "(WIP) …you ask nicely for it back with some incentive",
        traits: [traits.p2p, traits.swc, traits.lawful],
      },
      {
        id: 2,
        description: "(WIP) …you hack the computer to shut it down",
        traits: [
          traits.attack,
          traits.xp,
          (traitData) => traits.requirement(traitData, "Hacker"),
        ],
      },
      {
        id: 3,
        description: "(WIP) …you counter hack whoever is on the other end",
        traits: [
          traits.attack,
          traits.chaotic,
          traits.xp,
          (traitData) => traits.requirement(traitData, "Hacker"),
        ],
      },
    ],
  },
  {
    id: 9,
    description:
      "Your team gets caught into a brawl after some heated discussion turns to fist to cuffs…",
    traits: [],
    options: [
      {
        id: 1,
        description: "(PH) … you intimidate them to stop fighting",
        traits: [traits.attack, traits.lawful],
      },
      {
        id: 2,
        description: "(CC-10) …you revel in the chaos",
        traits: [
          traits.chaotic,
          (traitData) => traits.skill(traitData, "Natural Born Warrior"),
          traits.attack,
        ],
      },
      {
        id: 3,
        description: "(BS) …you bring a gun to a fist fight",
        traits: [traits.chaotic, traits.cr],
      },
    ],
  },
  {
    id: 10,
    description:
      "No incident occurs. You may reroll until you get an incident if you wish or choose to have no event.",
    traits: [],
    options: [
      {
        id: 1,
        description: "Choose to have no event",
        traits: [],
      },
      {
        id: 2,
        description: "Reroll for a new event",
        traits: [],
      },
    ],
  },
];

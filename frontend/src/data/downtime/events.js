import { traits } from "./traits";

export const events = [
  {
    id: "1",
    description: "A cop pulls you over for driving erratically…",
    traits: [],
    options: [
      {
        id: "1",
        description: "...you reach for the cops gun",
        traits: [traits.chaotic, traits.weapon, traits.attack, traits.xp],
      },
      {
        id: "2",
        description: "You try to bribe the cop.",
        outcome: "The cop takes your money and lets you go.",
      },
      {
        id: "3",
        description: "You run away.",
        outcome: "The cop chases you down and arrests you.",
      },
    ],
  },
];

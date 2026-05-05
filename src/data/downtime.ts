export type DowntimeOutcome = "" | "failure" | "pass" | "critical-pass";

export type DowntimeChoiceDefinition = {
  id: string;
  check: string;
  text: string;
  traits: string[];
};

export type DowntimeEventDefinition = {
  id: string;
  roll: string;
  event: string;
  traits: string[];
  choices: DowntimeChoiceDefinition[];
};

export type DowntimeTraitTooltip =
  | {
      type: "cols";
      special?: string;
      fail?: string;
      pass?: string;
      crit?: string;
    }
  | { type: "text"; desc: string };

export const DOWNTIME_OUTCOME_OPTIONS: Array<{
  value: DowntimeOutcome;
  label: string;
}> = [
  { value: "", label: "Not rolled" },
  { value: "failure", label: "Failure" },
  { value: "pass", label: "Pass" },
  { value: "critical-pass", label: "Critical Pass" },
];

export const DOWNTIME_EVENTS: DowntimeEventDefinition[] = [
  {
    id: "cop-pulls-you-over",
    roll: "1-2",
    event: "A cop pulls you over for driving erratically...",
    traits: [],
    choices: [
      {
        id: "reach-for-gun",
        check: "CC -10",
        text: "...you reach for the cop's gun",
        traits: ["Attack", "Weapon", "Chaotic", "XP"],
      },
      {
        id: "floor-it",
        check: "PH",
        text: "...you floor it and drive away",
        traits: ["Chaotic", "XP"],
      },
      {
        id: "talk-with-money",
        check: "WIP",
        text: "...you try to talk your way out with money",
        traits: ["Lawful", "P2P"],
      },
    ],
  },
  {
    id: "faulty-ammo",
    roll: "3-4",
    event:
      "An ammo dealer supplies you with faulty ammo and refuses to refund you...",
    traits: ["SWC"],
    choices: [
      {
        id: "attack-crew",
        check: "BS",
        text: "...you attack the dealer's crew",
        traits: ["Attack", "Chaotic", "XP"],
      },
      {
        id: "prove-your-point",
        check: "PS=10+ARM",
        text: "...you let him shoot you to prove your point",
        traits: ["Attack", "XP"],
      },
      {
        id: "intimidate-refund",
        check: "WIP",
        text: "...you intimidate the dealer into giving you an honest refund",
        traits: ["CR"],
      },
    ],
  },
  {
    id: "romantic-cahoots",
    roll: "5-6",
    event:
      "You catch one of your Mercs in romantic cahoots with a rival Merc team member after they met in the most recent Contract...",
    traits: ["MVP", "Opponent (Mutual)"],
    choices: [
      {
        id: "do-nothing",
        check: "PS=10",
        text: "...do nothing and see what happens",
        traits: ["XP", "CR (Neg)"],
      },
      {
        id: "convince-to-stop",
        check: "WIP",
        text: "...convince them to stop seeing each other",
        traits: ["CR"],
      },
      {
        id: "knock-sense",
        check: "PH",
        text: "...knock some sense into them",
        traits: ["XP", "Attack"],
      },
    ],
  },
  {
    id: "planning-an-ambush",
    roll: "7-8",
    event:
      "You get wind that a rival Merc team is planning an ambush after some unfinished business from the most recent Contract...",
    traits: ["Opponent"],
    choices: [
      {
        id: "counter-ambush",
        check: "CC -10",
        text: "...hide in wait and counter-ambush them",
        traits: ["Attack", "Chaotic", "XP"],
      },
      {
        id: "avoid-confrontation",
        check: "WIP",
        text: "...avoid the confrontation",
        traits: ["Skill (Stealth)", "Attack"],
      },
      {
        id: "report-to-cops",
        check: "WIP",
        text: "...report them to the cops",
        traits: ["Lawful"],
      },
    ],
  },
  {
    id: "taken-hostage",
    roll: "9-10",
    event:
      "Select a Merc that was Dead or Unconscious at the end of this Contract. A rival Merc team has taken them hostage...",
    traits: ["Opponent"],
    choices: [
      {
        id: "negotiate-ransom",
        check: "WIP",
        text: "...you negotiate a ransom",
        traits: ["P2P", "Lawful", "XP"],
      },
      {
        id: "ambush-drop-site",
        check: "BS",
        text: "...you ambush them at the drop site",
        traits: ["Chaotic", "Attack", "XP"],
      },
      {
        id: "let-escape",
        check: "PH",
        text: "...you let the Merc escape on their own",
        traits: ["Merc", "XP", "CR (Neg)"],
      },
    ],
  },
  {
    id: "new-captain",
    roll: "11-12",
    event:
      "One of your Mercs has decided they are better suited to be the Captain...",
    traits: [],
    choices: [
      {
        id: "allow-change",
        check: "PS=10",
        text: "...allow the change of leadership",
        traits: ["CR (Neg)", "LT"],
      },
      {
        id: "negotiate-salary",
        check: "WIP",
        text: "...negotiate a new salary",
        traits: ["Captain", "XP", "P2P"],
      },
      {
        id: "challenge-duel",
        check: "CC -10",
        text: "...challenge them to a duel — winner takes command",
        traits: ["Captain", "Attack", "Chaotic"],
      },
    ],
  },
  {
    id: "legal-trouble",
    roll: "13-14",
    event:
      "The Merc with the highest Renown has run into legal trouble and must present themselves in court...",
    traits: ["Renowned"],
    choices: [
      {
        id: "settle-out-of-court",
        check: "PS=10",
        text: "...you settle the issue out of court",
        traits: ["P2P", "XP"],
      },
      {
        id: "defend-in-court",
        check: "WIP",
        text: "...they defend themselves in court",
        traits: ["CR", "Lawful"],
      },
      {
        id: "intimidate-legal-team",
        check: "CC -10",
        text: "...they attempt to intimidate the opposing legal team",
        traits: ["CR", "Chaotic"],
      },
    ],
  },
  {
    id: "lost-laptop",
    roll: "15-16",
    event:
      "You left behind your work laptop at the last Contract and the opposing Merc team took it to see what they could gain...",
    traits: [],
    choices: [
      {
        id: "ask-for-it-back",
        check: "WIP",
        text: "...you ask nicely for it back with some incentive",
        traits: ["P2P", "SWC", "Lawful"],
      },
      {
        id: "hack-shut-down",
        check: "WIP",
        text: "...you hack the computer to shut it down",
        traits: ["Attack", "XP", "Requirement (Hacker)"],
      },
      {
        id: "counter-hack",
        check: "WIP",
        text: "...you counter-hack whoever is on the other end",
        traits: ["Attack", "Chaotic", "XP", "Requirement (Trinity Program)"],
      },
    ],
  },
  {
    id: "caught-in-a-brawl",
    roll: "17-18",
    event:
      "Your team gets caught in a brawl after a heated discussion turns to fists...",
    traits: [],
    choices: [
      {
        id: "intimidate-stop",
        check: "PH",
        text: "...you intimidate them into stopping",
        traits: ["Attack", "Lawful"],
      },
      {
        id: "revel-in-chaos",
        check: "CC -10",
        text: "...you revel in the chaos",
        traits: ["Chaotic", "Skill (Natural Born Warrior)", "Attack"],
      },
      {
        id: "bring-a-gun",
        check: "BS",
        text: "...you bring a gun to a fist fight",
        traits: ["Chaotic", "CR"],
      },
    ],
  },
  {
    id: "nothing-to-report",
    roll: "19-20",
    event:
      "Nothing to report. The period between Contracts passes without incident.",
    traits: [],
    choices: [
      {
        id: "reroll",
        check: "—",
        text: "...reroll and face a new event this Downtime.",
        traits: [],
      },
      {
        id: "take-the-quiet",
        check: "—",
        text: "...take the quiet. Remove an additional Injury from any unit in your roster.",
        traits: [],
      },
    ],
  },
];

export const DOWNTIME_EVENT_BY_ID = new Map(
  DOWNTIME_EVENTS.map((event) => [event.id, event]),
);

export function getDowntimeEventById(
  eventId?: string,
): DowntimeEventDefinition | null {
  return eventId ? DOWNTIME_EVENT_BY_ID.get(eventId) || null : null;
}

export function getDowntimeChoiceById(
  eventId?: string,
  choiceId?: string,
): DowntimeChoiceDefinition | null {
  const event = getDowntimeEventById(eventId);
  if (!event || !choiceId) return null;
  return event.choices.find((choice) => choice.id === choiceId) || null;
}

export function getDowntimeActiveTraits(
  eventId?: string,
  choiceId?: string,
): string[] {
  const event = getDowntimeEventById(eventId);
  if (!event) return [];
  const choice = getDowntimeChoiceById(eventId, choiceId);
  return [...(event.traits || []), ...(choice?.traits || [])];
}

export function describeDowntimeOutcomeLabel(value: DowntimeOutcome): string {
  return (
    DOWNTIME_OUTCOME_OPTIONS.find((option) => option.value === value)?.label ||
    "Not rolled"
  );
}

const DOWNTIME_TRAIT_TOOLTIPS: Record<string, DowntimeTraitTooltip> = {
  Attack: { type: "cols", fail: "Gain an Injury" },
  Chaotic: {
    type: "cols",
    fail: "-1 Notoriety",
    pass: "+1 Notoriety",
    crit: "+2 Notoriety",
  },
  Lawful: {
    type: "cols",
    fail: "+1 Notoriety",
    pass: "-1 Notoriety",
    crit: "-2 Notoriety",
  },
  CR: { type: "cols", fail: "-5 CR", pass: "+5 CR", crit: "+6 CR" },
  "CR (Neg)": {
    type: "cols",
    special: "Fail only - pass and crit have no effect",
    fail: "-5 CR",
  },
  XP: { type: "cols", pass: "+2 XP", crit: "+3 XP" },
  SWC: { type: "cols", pass: "+0.5 SWC", crit: "+0.5 SWC" },
  Weapon: { type: "cols", pass: "Random pistol", crit: "Random pistol +1 SD" },
  P2P: {
    type: "cols",
    special: "Spend CR before rolling - +1 to your roll per CR spent",
    fail: "CR lost",
    pass: "CR lost",
    crit: "CR returned",
  },
  LT: { type: "cols", pass: "Choose new Captain", crit: "Choose new Captain" },
  "Skill (*)": { type: "cols", pass: "Gain the skill", crit: "Gain the skill" },
  MVP: {
    type: "text",
    desc: "The MVP of your last Contract must perform this event",
  },
  Captain: { type: "text", desc: "Your Captain must perform this event" },
  Renowned: {
    type: "text",
    desc: "The highest Renown member must perform this event",
  },
  Merc: {
    type: "text",
    desc: "The event description specifies which Merc participates",
  },
  Opponent: {
    type: "text",
    desc: "On a fail, your opponent receives the pass benefit (except Notoriety). Any P2P CR you spend also goes to them.",
  },
  "Opponent (Mutual)": {
    type: "text",
    desc: "On a pass or crit, your opponent receives the same benefit you do (except Notoriety).",
  },
  "(Neg)": {
    type: "text",
    desc: "Only the fail effect of the paired trait applies.",
  },
};

export function getDowntimeTraitTooltip(
  trait: string,
): DowntimeTraitTooltip | undefined {
  if (DOWNTIME_TRAIT_TOOLTIPS[trait]) return DOWNTIME_TRAIT_TOOLTIPS[trait];
  if (trait.startsWith("Skill (")) {
    return { type: "cols", pass: "Gain the skill", crit: "Gain the skill" };
  }
  if (trait.startsWith("Requirement (")) {
    return {
      type: "text",
      desc: "This option requires the named skill or equipment",
    };
  }
  return undefined;
}

function parseBracketTrait(prefix: string, trait: string): string | null {
  const match = trait.match(new RegExp(`^${prefix} \\((.+)\\)$`, "i"));
  return match?.[1]?.trim() || null;
}

export function getDowntimeEffectSummary(
  trait: string,
  outcome: DowntimeOutcome,
): string | null {
  const normalized = trait.trim();
  if (!normalized || !outcome) return null;

  if (normalized === "Chaotic") {
    if (outcome === "failure") return "Lose 1 Notoriety.";
    if (outcome === "pass") return "Gain 1 Notoriety.";
    if (outcome === "critical-pass") return "Gain 2 Notoriety.";
  }

  if (normalized === "Lawful") {
    if (outcome === "failure") return "Gain 1 Notoriety.";
    if (outcome === "pass") return "Lose 1 Notoriety.";
    if (outcome === "critical-pass") return "Lose 2 Notoriety.";
  }

  if (normalized === "Attack") {
    return outcome === "failure" ? "Participant gains an Injury." : null;
  }

  if (normalized.startsWith("CR")) {
    if (normalized.includes("(Neg)")) {
      return outcome === "failure" ? "Lose 5 CR." : null;
    }
    if (outcome === "failure") return "Lose 5 CR.";
    if (outcome === "pass") return "Gain 5 CR.";
    if (outcome === "critical-pass") return "Gain 6 CR.";
  }

  if (normalized === "XP") {
    if (outcome === "pass") return "Gain 2 XP.";
    if (outcome === "critical-pass") return "Gain 3 XP.";
  }

  if (normalized === "SWC") {
    if (outcome === "pass" || outcome === "critical-pass") {
      return "Gain 0.5 SWC.";
    }
  }

  if (normalized === "P2P") {
    if (outcome === "critical-pass") return "Spent CR are not lost.";
    return "Spent CR are lost.";
  }

  if (normalized === "Weapon") {
    if (outcome === "pass") return "Gain a random pistol.";
    if (outcome === "critical-pass") {
      return "Gain a random pistol with +1 SD.";
    }
  }

  if (normalized === "LT") {
    if (outcome === "pass" || outcome === "critical-pass") {
      return "Choose any team member to become the new Captain.";
    }
  }

  const skillName = parseBracketTrait("Skill", normalized);
  if (skillName) {
    if (outcome === "pass" || outcome === "critical-pass") {
      return `Gain ${skillName}.`;
    }
    return null;
  }

  if (normalized === "Opponent") {
    return outcome === "failure"
      ? "Opponent receives the pass benefit instead (except Notoriety)."
      : null;
  }

  if (normalized === "Opponent (Mutual)") {
    return outcome === "pass" || outcome === "critical-pass"
      ? "Opponent receives the same benefit too (except Notoriety)."
      : null;
  }

  if (normalized.includes("(Neg)")) {
    return outcome === "failure"
      ? "Only the fail portion of the paired trait applies."
      : null;
  }

  return null;
}

export function isDowntimeParticipantTrait(trait: string): boolean {
  return (
    trait === "MVP" ||
    trait === "Captain" ||
    trait === "Renowned" ||
    trait === "Merc" ||
    trait.startsWith("Requirement (")
  );
}

export function isDowntimeResolutionTrait(trait: string): boolean {
  return !isDowntimeParticipantTrait(trait);
}

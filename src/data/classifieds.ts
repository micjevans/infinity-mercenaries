export type ClassifiedCard = {
  id: string;
  slot: number;
  title: string;
  category: "intel" | "support" | "offense" | "sponsor";
  summary: string;
  details: string;
  sponsorOnly?: boolean;
  image?: string;
};

// First pass imported from current deck screenshots.
// Add `image` paths or expanded `details` as additional cards are transcribed.
export const classifiedCards: ClassifiedCard[] = [
  {
    id: "experimental-drugs",
    slot: 1,
    title: "Experimental Drugs",
    category: "support",
    summary: "Temporary combat stimulant objective.",
    details:
      "Full card text pending transcription. Use official card art for exact requirements and effects.",
  },
  {
    id: "weapons-dealer",
    slot: 2,
    title: "Weapons Dealer",
    category: "support",
    summary: "Acquire gear through black-market channels.",
    details:
      "Full card text pending transcription. Use official card art for exact requirements and effects.",
  },
  {
    id: "market-analyst",
    slot: 3,
    title: "Market Analyst",
    category: "intel",
    summary: "Leverage economic intel for in-contract gains.",
    details:
      "Full card text pending transcription. Use official card art for exact requirements and effects.",
  },
  {
    id: "data-transfer",
    slot: 4,
    title: "Data Transfer",
    category: "intel",
    summary: "Secure and move sensitive digital payloads.",
    details:
      "Full card text pending transcription. Use official card art for exact requirements and effects.",
  },
  {
    id: "sabotage",
    slot: 5,
    title: "Sabotage",
    category: "offense",
    summary: "Disrupt enemy assets as a side objective.",
    details:
      "Full card text pending transcription. Use official card art for exact requirements and effects.",
  },
  {
    id: "undercover",
    slot: 6,
    title: "Undercover",
    category: "intel",
    summary: "Blend in and complete covert actions.",
    details:
      "Full card text pending transcription. Use official card art for exact requirements and effects.",
  },
  {
    id: "assassination",
    slot: 7,
    title: "Assassination",
    category: "offense",
    summary: "Eliminate a high-value enemy target.",
    details:
      "Full card text pending transcription. Use official card art for exact requirements and effects.",
  },
  {
    id: "outside-help",
    slot: 8,
    title: "Outside Help",
    category: "support",
    summary: "Call in temporary external support.",
    details:
      "Full card text pending transcription. Use official card art for exact requirements and effects.",
  },
  {
    id: "battle-medicine",
    slot: 9,
    title: "Battle Medicine",
    category: "support",
    summary: "Medical intervention objective during combat.",
    details:
      "Full card text pending transcription. Use official card art for exact requirements and effects.",
  },
  {
    id: "merciful",
    slot: 10,
    title: "Merciful",
    category: "support",
    summary: "Complete objective while preserving enemy lives.",
    details:
      "Full card text pending transcription. Use official card art for exact requirements and effects.",
  },
  {
    id: "merciless",
    slot: 11,
    title: "Merciless",
    category: "offense",
    summary: "Complete objective through decisive violence.",
    details:
      "Full card text pending transcription. Use official card art for exact requirements and effects.",
  },
  {
    id: "premonition",
    slot: 12,
    title: "Premonition",
    category: "intel",
    summary: "Predictive edge objective.",
    details:
      "Full card text pending transcription. Use official card art for exact requirements and effects.",
  },
  {
    id: "special-sponsor-objective",
    slot: 13,
    title: "Special Sponsor Objective",
    category: "sponsor",
    summary: "Objective reserved for sponsor-enabled events.",
    details:
      "Full card text pending transcription. Use official card art for exact requirements and effects.",
    sponsorOnly: true,
  },
];

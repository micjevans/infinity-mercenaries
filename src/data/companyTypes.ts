export type CompanyType = {
  id: string;
  name: string;
  tagline: string;
  /**
   * Maximum number of named sectorials this company type can have.
   * Standard allows 2 (or 1 vanilla army). All others allow 1.
   */
  maxSectorials: 1 | 2;
};

export const companyTypes: CompanyType[] = [
  {
    id: "standard",
    name: "Standard Company",
    tagline:
      "The flexible all-rounder — maximum faction freedom with no tradeoffs.",
    maxSectorials: 2,
  },
  {
    id: "cohesive",
    name: "Cohesive Company",
    tagline:
      "An elite synchronized unit built around a single fireteam's deep synergy.",
    maxSectorials: 1,
  },
  {
    id: "leader",
    name: "Inspiring Leader",
    tagline:
      "One exceptional Captain leading a crew of irregulars from across the Human Sphere.",
    maxSectorials: 1,
  },
  {
    id: "airborne",
    name: "Airborne Company",
    tagline:
      "A hard-insertion force built entirely around Airborne Deployment.",
    maxSectorials: 1,
  },
  {
    id: "tag",
    name: "TAG Company",
    tagline: "A repurposed industrial TAG at the centre of the roster.",
    maxSectorials: 1,
  },
];

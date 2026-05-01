export type SponsorMilestone = {
  milestone: string;
  benefit: string;
};

export type SponsorGearItem = {
  category:
    | "Primary"
    | "Secondary"
    | "Sidearm"
    | "Accessories"
    | "Augment"
    | "Armor";
  name: string;
  costCR: string;
  costSWC?: string;
  tier: string;
  notes?: string;
};

export type Sponsor = {
  id: string;
  name: string;
  faction: string;
  summary: string;
  objective: string;
  tracking: string;
  startingBenefit: string;
  milestones: SponsorMilestone[];
  benefitRules?: string[];
  depositStats?: { arm: number; bts: number; w: number; s: number };
  gearItems?: SponsorGearItem[];
};

export type SponsorPair = {
  id: string;
  title: string;
  sponsors: [Sponsor, Sponsor];
};

export const sponsorPairs: SponsorPair[] = [
  {
    id: "cosmica-pharmacomp",
    title: "Cosmica + Pharmacomp",
    sponsors: [
      {
        id: "cosmica",
        name: "Cosmica",
        faction: "Nomad",
        summary:
          "When a Cosmica crew arrives on-site, you can tell by the prototype equipment strapped to their overalls and the faint smell of burnt insulation. Founded in the Bakunin free-zone as an unofficial collective of structural engineers and rogue tech artisans, they have built habitation modules, weapons platforms, and more than a few things that exploded when they should not — all under the banner of rapid innovation and admirably loose regulatory oversight. Their Gizmokits are issued before safety certification is complete, because in Cosmica's view, the contract is the certification. Printed on every cargo bay door in sun-bleached block lettering: BUILD FIRST. REPORT NEVER.",
        objective:
          "Field-test experimental Gizmokits and Engineer support during contracts.",
        tracking:
          "Record each time one of your troopers is successfully brought from Unconscious using Engineer or a Gizmokit.",
        startingBenefit:
          "When first aligning, one trooper that does not already have one gains a Gizmokit for free.",
        milestones: [
          {
            milestone: "1 successful recovery",
            benefit: "Purchasable Gizmokit for 5 CR.",
          },
          {
            milestone: "4 successful recoveries",
            benefit:
              "Purchasable Engineer for 5 CR. Trooper must already have Gizmokit.",
          },
          {
            milestone: "6 successful recoveries",
            benefit:
              "Purchasable Engineer (2W) for 5 CR. Trooper must already have Engineer.",
          },
        ],
        benefitRules: [
          "Gained skills and equipment do not take a trooper slot and are not added to inventory.",
          "These benefits cannot be sold.",
          "These benefits do not contribute to trooper Renown when the trooper retires.",
        ],
      },
      {
        id: "pharmacomp",
        name: "Pharmacomp",
        faction: "PanOceania",
        summary:
          "To hear Pharmacomp's PR division tell it, the company is saving lives one clinical trial at a time: funding hospice care in the Neocolonial provinces, gifting field medkits to disaster zones, sponsoring the Human Sphere's most-watched medical holodramas. The truth, buried in subsidiary contracts and shell-company filings, is rather more interesting. Pharmacomp's core revenue comes from combat-readiness pharmaceutical programs — stimulants that keep wounded troopers functional past the point of reason, anesthetics that double as interrogation aids, and regenerative compounds that have not cleared any review board outside a warzone field test. The trials move between facilities because the results have to. Their tagline: Healing the Sphere, One Contract at a Time.",
        objective:
          "Field-test experimental Medikits and Doctor support during contracts.",
        tracking:
          "Record each time one of your troopers is successfully brought from Unconscious using Doctor or a Medikit.",
        startingBenefit:
          "When first aligning, one trooper that does not already have one gains a Medikit for free.",
        milestones: [
          {
            milestone: "1 successful recovery",
            benefit: "Purchasable Medikit for 5 CR.",
          },
          {
            milestone: "4 successful recoveries",
            benefit:
              "Purchasable Doctor for 5 CR. Trooper must already have Medikit.",
          },
          {
            milestone: "6 successful recoveries",
            benefit:
              "Purchasable Doctor (2W) for 5 CR. Trooper must already have Doctor.",
          },
        ],
        benefitRules: [
          "Gained skills and equipment do not take a trooper slot and are not added to inventory.",
          "These benefits cannot be sold.",
          "These benefits do not contribute to trooper Renown when the trooper retires.",
        ],
      },
    ],
  },
  {
    id: "heartmark-spirit-holomasks",
    title: "Heartmark + Spirit Holomasks",
    sponsors: [
      {
        id: "heartmark",
        name: "Heartmark",
        faction: "PanOceania",
        summary:
          "Nobody sends a card anymore — or so the analysts said, right before Heartmark's Q3 revenue tripled. The pivot happened quietly and then all at once: the greeting card division became a lifestyle brand, and the lifestyle brand became something harder to name. Under the saccharine packaging lies a precision arms operation built around plausible deniability. Their Thinking of You shipment line delivers encrypted intel chips sealed in foil envelopes. Their Commemorative Edition Keepsake range includes ornaments with integrated micro-explosive payloads. Their Just Because Wellness Box contains items the Human Sphere Health Authority has never officially approved. Heartmark does not sell weapons — they sell the feeling of being remembered. Their tagline: When you absolutely need to send the very best. Make it count.",
        objective:
          "Deliver sponsor packages during contracts to unlock higher warmarket tiers.",
        tracking:
          "Track the number of successful package deliveries. Each completed delivery adds 1 progress toward this sponsor's milestones.",
        startingBenefit:
          "Aligned players gain access to the Heartmark special warmarket. Purchases are limited by unlocked tier.",
        milestones: [
          {
            milestone: "2 packages delivered",
            benefit: "Unlock Tier 1 items.",
          },
          {
            milestone: "5 packages delivered",
            benefit: "Unlock Tier 2 items.",
          },
          {
            milestone: "7 packages delivered",
            benefit: "Unlock Tier 3 items.",
          },
        ],
        gearItems: [
          {
            category: "Primary",
            name: "Industrial Package Tracker",
            costCR: "8",
            tier: "1",
            notes: "Forward Observer (+2 SD)",
          },
          {
            category: "Secondary",
            name: "Exquisite Invitation Suite",
            costCR: "10",
            tier: "2",
            notes: "Sepsitor Mine",
          },
          {
            category: "Secondary",
            name: "Molotov Ornaments",
            costCR: "6",
            tier: "1",
            notes: "Grenades (Continuous Damage)",
          },
          {
            category: "Sidearm",
            name: "Thrown Greeting Cards",
            costCR: "6",
            tier: "1",
            notes: "Trench-Hammer (BS Weapon (CC))",
          },
          {
            category: "Accessories",
            name: "Santas Bag",
            costCR: "18",
            tier: "2",
            notes:
              "Baggage (Panoply 1 Use). Once per contract another trooper in base contact may spend a Short Skill to roll Booty as if using a Panoply.",
          },
          {
            category: "Augment",
            name: "Santas Elf",
            costCR: "10",
            tier: "2",
            notes: "Peripheral (Servant) (+3). Requires Engineer or Doctor.",
          },
          {
            category: "Armor",
            name: "Santa Costume",
            costCR: "15",
            tier: "2",
            notes: "Engineer, Doctor",
          },
          {
            category: "Armor",
            name: "Rudolf the Red Nosed Apache Attack Chopper",
            costCR: "20",
            tier: "3",
            notes:
              "Aerial, Tech-Recovery, Mimetism (-6), Super-Jump (Jet Propulsion, 3 in), No Cover",
          },
        ],
      },
      {
        id: "spirit-holomasks",
        name: "Spirit Holomasks",
        faction: "Nomad",
        summary:
          "In the Human Sphere's urban sprawl, no one knows how they do it: one day a building is vacant, the next it is draped in torn banners and neon cobwebs. Spirit Holomasks perfected the art of pop-up logistics, slipping entire arms depots into abandoned storefronts, liquidating stock in a few weeks, and vanishing before O-12 inspectors arrive. Their merchandise is black-market tech and surplus ordnance disguised as novelty props, rubber scythes that cut through armor, pumpkin grenades, and vampire capes lined with reactive nanoweave. A good merc knows the truth: under the layers of glitter and cheap paint lies deadly firepower. Their motto: Dress for the kill.",
        objective:
          "Deliver sponsor packages during contracts to unlock higher warmarket tiers.",
        tracking:
          "Track the number of successful package deliveries. Each completed delivery adds 1 progress toward this sponsor's milestones.",
        startingBenefit:
          "Aligned players gain access to the Spirit Holomasks special warmarket. Purchases are limited by unlocked tier.",
        milestones: [
          {
            milestone: "2 packages delivered",
            benefit: "Unlock Tier 1 items.",
          },
          {
            milestone: "5 packages delivered",
            benefit: "Unlock Tier 2 items.",
          },
          {
            milestone: "7 packages delivered",
            benefit: "Unlock Tier 3 items.",
          },
        ],
        gearItems: [
          {
            category: "Primary",
            name: "Hypnosis Goggles",
            costCR: "20",
            tier: "3",
            notes:
              "AP CC Weapon (Non-Lethal, Sepsitorized, CC Weapon (WIP+10))",
          },
          {
            category: "Primary",
            name: "Trick or Treat!!!",
            costCR: "15",
            tier: "2",
            notes:
              "Combi Rifle may target allies. On hit: 1-10 EXP, 11-20 treat as Medikit that works on conscious troopers and can heal to max.",
          },
          {
            category: "Secondary",
            name: "The Scream Voice Modulator",
            costCR: "12",
            tier: "2",
            notes: "Jammer (BS Weapon (PH))",
          },
          {
            category: "Secondary",
            name: "Zombie Lawn Decoration",
            costCR: "10",
            tier: "2",
            notes: "CrazyKoala (Bioweapon (DA+SHOCK))",
          },
          {
            category: "Sidearm",
            name: "Pumpkin Smasher",
            costCR: "6",
            tier: "1",
            notes: "Trench Hammer (State: Stunned)",
          },
          {
            category: "Augment",
            name: "12 Foot Tall Skeleton",
            costCR: "10",
            tier: "2",
            notes: "Deployable Cover (S6). Requires Engineer.",
          },
          {
            category: "Augment",
            name: "Third Eye",
            costCR: "10",
            tier: "2",
            notes:
              "Upgrade (Enhanced Reaction (LI/MI)). Requires Hacker. Must be used on LI or MI instead of REM.",
          },
          {
            category: "Armor",
            name: "Bed Sheet with 2 eye cutouts",
            costCR: "10",
            tier: "2",
            notes: "Hidden Deployment",
          },
          {
            category: "Armor",
            name: "Grucho Glasses",
            costCR: "20",
            tier: "3",
            notes: "Impersonation, Surprise Attack (-3)",
          },
          {
            category: "Armor",
            name: "Jack-O-Lantern",
            costCR: "25",
            tier: "3",
            notes:
              "Line of Sight (Attack -3). Does not stack with other -3 Attack mods such as BS or CC Attack (-3).",
          },
        ],
      },
    ],
  },
  {
    id: "bantai-yamaco-minescorp",
    title: "Bantai Yamaco + Minescorp",
    sponsors: [
      {
        id: "bantai-yamaco",
        name: "Bantai Yamaco",
        faction: "JSA",
        summary:
          "Bantai Yamaco did not ask permission to become the most disruptive force in off-world extraction. They simply started drilling. Born from a collective of JSA engineers who regarded PanOceanian mining monopolies as just another form of colonial occupation, they entered the resource market with patented high-speed bore assemblies, autonomous refinery modules, and an operational philosophy borrowed directly from the Bushido tradition: total commitment, maximum efficiency, no wasted movement. They survey faster, break deeper, and process cleaner than their rivals — and charge less to prove it. Where other corps build fences, Bantai Yamaco plants survey markers and dares anyone to contest them. Inscribed on every extraction rig: The earth does not yield to patience. It yields to preparation.",
        objective:
          "Survey mineral deposits during contracts to unlock anti-material and servant options.",
        tracking:
          "Track successful Mineral Deposit surveys. Each completed survey adds 1 progress toward this sponsor's milestones.",
        startingBenefit:
          "When first aligning, one trooper gains Sensor for free.",
        milestones: [
          {
            milestone: "1 successful survey",
            benefit: "Can purchase CC Attack (Anti-Material) for 5 CR.",
          },
          {
            milestone: "3 successful surveys",
            benefit: "Can purchase CC Attack (Anti-Material +1 SD) for 10 CR.",
          },
          {
            milestone: "5 successful surveys",
            benefit:
              "May purchase a Bob-omb Servant for 15 CR (JSA Yaozao with D-Charges (+1 SD)), or upgrade an existing Servant bot for 12 CR. Doctor/Engineer requirement does not apply.",
          },
        ],
        depositStats: { arm: 4, bts: 6, w: 2, s: 3 },
        benefitRules: [
          "As long as the Deposit is surveyed at least once, the player gains 1 OP for that contract (up to a maximum of 8).",
          "You may not attack or survey a Deposit that was placed by you.",
        ],
      },
      {
        id: "minescorp",
        name: "Minescorp",
        faction: "PanOceania",
        summary:
          "Minescorp has been extracting resources from colonial and frontier territories for longer than some member-nations have existed. The largest mining corporation in PanOceania — and by its own quarterly reports, the Human Sphere's single biggest private employer of armed security personnel — they long ago stopped pretending that mining and military operations were separate concerns. Their corporate security division, the Jackals, deploys as a matter of course wherever a new extraction site is established: not to protect workers, but to protect throughput. The equipment they sponsor is the same gear their Jackals carry, and the data they collect during sponsored contracts feeds directly into site survey. Minescorp does not fund your company out of generosity. Their motto: The finest technology. The longest reach.",
        objective:
          "Survey mineral deposits during contracts to unlock anti-material and servant options.",
        tracking:
          "Track successful Mineral Deposit surveys. Each completed survey adds 1 progress toward this sponsor's milestones.",
        startingBenefit:
          "When first aligning, one trooper gains Sensor for free.",
        milestones: [
          {
            milestone: "1 successful survey",
            benefit:
              "Can purchase Weapon Mining Attachment for a primary weapon for 5 CR (adds Anti-Material mode: B1, AP, Anti-Material).",
          },
          {
            milestone: "3 successful surveys",
            benefit: "Can purchase BS Attack (Anti-Material +1 SD) for 10 CR.",
          },
          {
            milestone: "5 successful surveys",
            benefit:
              "May purchase a Hammerbros Servant for 15 CR (PanO Palbot with Trench Hammer (+1 SD)), or upgrade an existing Servant bot for 12 CR. Doctor/Engineer requirement does not apply.",
          },
        ],
        depositStats: { arm: 4, bts: 6, w: 2, s: 3 },
        benefitRules: [
          "As long as the Deposit is surveyed at least once, the player gains 1 OP for that contract (up to a maximum of 8).",
          "You may not attack or survey a Deposit that was placed by you.",
        ],
      },
    ],
  },
];

export const sponsors = sponsorPairs.flatMap((pair) => pair.sponsors);

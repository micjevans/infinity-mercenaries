import { Avatar, Box, Chip, Grid2, TextField, Typography } from "@mui/material";
import {
  generateLootItem,
  generateTier,
  RARITY_TIERS,
} from "../../utils/lootUtils";

// Add a helper function to get trait descriptions
export const getTraitDescription = (traitKey) => {
  const descriptions = {
    chaotic: "Increases notoriety on success, decreases on failure",
    lawful: "Decreases notoriety on success, increases on failure",
    attack: "May result in injury on failure",
    cr: "Credits gain/loss based on outcome",
    xp: "Experience points gain based on outcome",
    weapon: "Gain a random weapon on success",
    swc: "Gain SWC on success",
    p2p: "Spend credits to increase success chance",
    skill: "Gain a specific skill on success",
    lt: "Change company leadership",
    mvp: "Requires the MVP from last mission",
    captain: "Requires the company captain",
    renowned: "Requires the trooper with highest renown",
    opponent: "Involves the opponent from last contract",
    merc: "Effects apply to a specific merc",
    crNeg: "Negative impact on company credits",
    requireHacker: "Requires a trooper with hacking skills",
    requireTrinity: "Requires a trooper with Trinity program",
    skillNaturalBornWarrior: "Grants Natural Born Warrior skill",
    skillStealth: "Grants Stealth skill",
  };

  return descriptions[traitKey] || "No description available";
};

export const traits = {
  chaotic: (traitData) => ({
    name: "chaotic",
    type: "consequence",
    fail: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        notoriety: traitData.company.notoriety - 1,
      },
    }),
    pass: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        notoriety: traitData.company.notoriety + 1,
      },
    }),
    crit: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        notoriety: traitData.company.notoriety + 2,
      },
    }),
  }),
  lawful: (traitData) => ({
    name: "lawful",
    type: "consequence",
    fail: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        notoriety: traitData.company.notoriety + 1,
      },
    }),
    pass: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        notoriety: traitData.company.notoriety - 1,
      },
    }),
    crit: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        notoriety: traitData.company.notoriety - 2,
      },
    }),
  }),
  attack: (traitData) => ({
    name: "attack",
    id: 3,
    fail: () => ({
      ...traitData,
      troopers: traitData.troopers.map((trooper) => ({
        ...trooper,
        perks: [...trooper.perks, "injury"],
      })),
    }),
  }),
  cr: (traitData) => ({
    name: "cr",
    id: 4,
    fail: {
      key: "credits",
      value: -5,
    },
    pass: {
      key: "credits",
      value: 5,
    },
    crit: {
      key: "credits",
      value: 6,
    },
  }),
  xp: (traitData) => ({
    name: "xp",
    pass: {
      key: "xp",
      value: 2,
    },
    crit: {
      key: "xp",
      value: 3,
    },
  }),
  weapon: (traitData) => ({
    name: "weapon",
    type: "consequence",
    pass: {
      key: "company.inventory",
      value: () => {
        generateLootItem(
          { id: 69, type: "weapon" },
          generateTier(new Date().now(), [
            RARITY_TIERS.UNCOMMON,
            RARITY_TIERS.RARE,
          ])
        );
      },
    },
    crit: {
      key: "company.inventory",
      value: () => {
        generateLootItem(
          { id: 69, type: "weapon" },
          generateTier(new Date().now(), [
            RARITY_TIERS.UNCOMMON,
            RARITY_TIERS.RARE,
          ])
        );
      },
    },
  }),
  swc: (traitData) => ({
    name: "company.swc",
    type: "consequence",
    pass: {
      key: "swc",
      value: 1,
    },
    crit: {
      key: "swc",
      value: 2,
    },
  }),
  p2p: (traitData) => ({
    name: "p2p",
    render: (value, onChange) => (
      <TextField
        id="outlined-number"
        label="Number"
        type="number"
        value={value}
        onChange={onChange}
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
      />
    ),
    fail: {
      key: "company.credits",
      value: "p2p",
    },
    pass: {
      key: "company.credits",
      value: "p2p",
    },
  }),
  skill: (traitData, skill) => ({
    name: `skill (${skill})`,
    type: "consequence",
    pass: {
      key: "perks",
      value: skill,
    },
    crit: {
      key: "perks",
      value: skill,
    },
  }),
  lt: (traitData) => ({
    name: "lt",
    type: "consequence",
    render: (troopers, value, onChange) => (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Select a trooper to be the lieutenant:
        </Typography>
        <Grid2 container spacing={1} sx={{ mt: 1 }}>
          {troopers.map((trooper) => {
            return (
              <Grid2 item key={trooper}>
                <Chip
                  avatar={<Avatar src={trooper.resume?.logo} />}
                  label={trooper.name}
                  onClick={() => onChange(trooper)}
                  clickable
                  color="primary"
                  variant="outlined"
                />
              </Grid2>
            );
          })}
        </Grid2>
      </Box>
    ),
    trooper: traitData.troopers.find((trooper) => trooper.captain === true),
    pass: {
      key: "captain",
      value: traitData.troopers,
    },
    crit: {
      key: "captain",
      value: traitData.troopers,
    },
  }),
  mvp: (troopers) => ({
    type: "participant",
    name: "mvp",
    trooper: troopers.find((trooper) => trooper.mvp === true),
  }),
  captain: (troopers) => ({
    type: "participant",
    name: "captain",
    trooper: troopers.find((trooper) => trooper.captain === true),
  }),
  renowned: (troopers) => ({
    type: "participant",
    name: "renowned",
    trooper: troopers.find((trooper) => trooper.renowned === true),
  }),
  opponent: (traitData) => ({
    type: "special",
    name: "opponent",
  }),
}; // traits.js

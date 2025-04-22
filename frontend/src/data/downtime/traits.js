import {
  Avatar,
  Box,
  capitalize,
  Chip,
  Grid2,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  generateLootItem,
  generateTier,
  RARITY_TIERS,
} from "../../utils/lootUtils";
import MapItem from "../../components/MapItem";

export const traits = {
  chaotic: (traitData) => ({
    name: "chaotic",
    type: "consequence",
    icon: "🔥",
    failDetails: "Decrease company notoriety by 1",
    passDetails: "Increase company notoriety by 1",
    critDetails: "Increase company notoriety by 2",
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
    icon: "⚖️",
    failDetails: "Increase company notoriety by 1",
    passDetails: "Decrease company notoriety by 1",
    critDetails: "Decrease company notoriety by 2",
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
    icon: "⚔️",
    failDetails: "Trooper gains an injury",
    fail: () => ({
      ...traitData,
      troopers: traitData.troopers.map((trooper) =>
        trooper.id === traitData.trooper
          ? {
              ...trooper,
              perks: [...trooper.perks, "injury"],
            }
          : trooper
      ),
    }),
  }),

  cr: (traitData) => ({
    name: "cr",
    id: 4,
    icon: "💰",
    failDetails: "Lose 5 credits",
    passDetails: "Gain 5 credits",
    critDetails: "Gain 6 credits",
    fail: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        notoriety: traitData.company.credits - 5,
      },
    }),
    pass: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        notoriety: traitData.company.credits + 5,
      },
    }),
    crit: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        notoriety: traitData.company.credits + 6,
      },
    }),
  }),

  xp: (traitData) => ({
    name: "xp",
    icon: "⭐",
    passDetails: "Trooper gains 2 XP",
    critDetails: "Trooper gains 3 XP",
    pass: () => ({
      ...traitData,
      troopers: traitData.troopers.map((trooper) =>
        trooper.id === traitData.trooper
          ? {
              ...trooper,
              xp: trooper.xp + 2,
            }
          : trooper
      ),
    }),
    crit: () => ({
      ...traitData,
      troopers: traitData.troopers.map((trooper) =>
        trooper.id === traitData.trooper
          ? {
              ...trooper,
              xp: trooper.xp + 3,
            }
          : trooper
      ),
    }),
  }),

  weapon: (traitData) => ({
    name: "weapon",
    type: "consequence",
    icon: "🔫",
    passDetails: "Gain an Uncommon or Rare Pistol",
    critDetails: "Gain a Rare or Epic Pistol",
    render: () => {
      console.log(
        generateLootItem(
          { id: 69, key: "weapons", name: "Pistol" },
          generateTier(traitData.resultData.id, ["UNCOMMON", "RARE"]),
          traitData.resultData.id
        )
      );
      return (
        <Box display={"flex"} flexDirection="row" gap={2}>
          <Stack>
            <Typography mb={2}>Pass</Typography>
            <MapItem
              item={generateLootItem(
                { id: 69, key: "weapons", name: "Pistol" },
                generateTier(traitData.resultData.id, ["UNCOMMON", "RARE"]),
                traitData.resultData.id
              )}
            />
          </Stack>
          <Stack>
            <Typography mb={2}>Critical Pass</Typography>
            <MapItem
              item={generateLootItem(
                { id: 69, key: "weapons", name: "Pistol" },
                generateTier(traitData.resultData.id, ["RARE", "EPIC"]),
                traitData.resultData.id
              )}
            />
          </Stack>
        </Box>
      );
    },
    pass: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        inventory: [
          ...traitData.company.inventory,
          generateLootItem(
            { id: 69, key: "weapons", name: "Pistol" },
            generateTier(traitData.resultData.id, ["UNCOMMON", "RARE"]),
            traitData.resultData.id
          ),
        ],
      },
    }),
    crit: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        inventory: [
          ...traitData.company.inventory,
          generateLootItem(
            { id: 69, type: "weapon", name: "Pistol" },
            generateTier(traitData.resultData.id, ["RARE", "EPIC"]),
            traitData.resultData.id
          ),
        ],
      },
    }),
  }),

  swc: (traitData) => ({
    name: "swc",
    type: "consequence",
    icon: "💎",
    passDetails: "Gain 0.5 SWC",
    critDetails: "Gain 1 SWC",
    pass: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        notoriety: traitData.company.swc + 0.5,
      },
    }),
    crit: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        notoriety: traitData.company.swc + 1,
      },
    }),
  }),

  p2p: (traitData, setTraitData) => ({
    name: "p2p",
    icon: "🤝",
    specialDesc: "You may spend CR to increase your SR by 1 for each CR spent",
    failDetails: "Spent CR are lost",
    passDetails: "Spent CR are lost",
    critDetails: "Spent CR are not lost",
    render: () => (
      <Stack>
        <Typography mb={2}>
          Available Credits: {traitData.company.credits}
        </Typography>
        <TextField
          id="outlined-number"
          label="P2P"
          type="number"
          disabled={traitData?.resultData?.downtime?.result}
          value={traitData?.resultData?.downtime?.p2p || 0}
          onChange={(e) => {
            if (traitData.company.credits - e.target.value > 0) {
              setTraitData((prev) => ({
                ...prev,
                resultData: {
                  ...prev?.resultData,
                  downtime: {
                    ...prev?.resultData?.downtime,
                    p2p: e.target.value,
                  },
                },
              }));
            }
          }}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        />
      </Stack>
    ),
    fail: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        notoriety: traitData.company.credits - traitData.p2p,
      },
    }),
    pass: () => ({
      ...traitData,
      company: {
        ...traitData.company,
        notoriety: traitData.company.credits - traitData.p2p,
      },
    }),
  }),

  skill: (traitData, skill) => ({
    name: `skill (${skill})`,
    type: "consequence",
    icon: "🔧",
    passDetails: `Trooper gains ${skill} skill`,
    critDetails: `Trooper gains ${skill} skill`,
    pass: () => ({
      ...traitData,
      troopers: traitData.troopers.map((trooper) =>
        trooper.id === traitData.trooper
          ? {
              ...trooper,
              perks: [...trooper.perks, skill],
            }
          : trooper
      ),
    }),
    crit: () => ({
      ...traitData,
      troopers: traitData.troopers.map((trooper) =>
        trooper.id === traitData.trooper
          ? {
              ...trooper,
              perks: [...trooper.perks, skill],
            }
          : trooper
      ),
    }),
  }),

  lt: (traitData) => ({
    name: "lt",
    type: "consequence",
    icon: "👑",
    passDetails: "You may select any member of your team to be the new Captain",
    critDetails: "You may select any member of your team to be the new Captain",
    pass: () => ({
      ...traitData,
      troopers: traitData.troopers.map((trooper) => {
        // If it's the captain then change them to no longer be the captain
        if (trooper.captain)
          return {
            ...trooper,
            captain: false,
          };
        // If its the trooper we want then make them the captain
        if (trooper.id === traitData.trooper)
          return {
            ...trooper,
            captain: true,
          };
        return trooper;
      }),
    }),
    crit: () => ({
      ...traitData,
      troopers: traitData.troopers.map((trooper) => {
        // If it's the captain then change them to no longer be the captain
        if (trooper.captain)
          return {
            ...trooper,
            captain: false,
          };
        // If its the trooper we want then make them the captain
        if (trooper.id === traitData.trooper)
          return {
            ...trooper,
            captain: true,
          };
        return trooper;
      }),
    }),
  }),

  mvp: (traitData) => ({
    type: "participant",
    name: "mvp",
    icon: "🏆",
    specialDesc: "The MVP of the last contract must perform the event",
    troopers: [
      traitData.troopers.find(
        (trooper) =>
          traitData.resultData.troopers.find(
            (resultTrooper) => resultTrooper.mvp === true
          ).trooper === trooper.id
      ),
    ],
  }),

  captain: (traitData) => ({
    type: "participant",
    name: "captain",
    icon: "🎖️",
    specialDesc: "The Captain of the company must perform the event",
    troopers: [traitData.troopers.find((trooper) => trooper.captain === true)],
  }),

  renowned: (traitData) => ({
    type: "participant",
    name: "renowned",
    icon: "📊",
    specialDesc:
      "The highest renown member of the company must perform the event",
    troopers: [
      traitData.troopers.reduce(
        (renownedTrooer, trooper) =>
          trooper.xp > renownedTrooer.xp ? trooper : renownedTrooer,
        traitData.troopers[0]
      ),
    ],
  }),

  requirement: (traitData, requirement) => ({
    type: "participant",
    name: requirement,
    icon: "📋",
    specialDesc: `The trooper performing the event must have ${requirement}`,
    troopers: [
      traitData.troopers.filter(
        (trooper) =>
          trooper.perks.find((perk) => perk === requirement) !== undefined
      ),
    ],
  }),

  opponent: (traitData, mutual = false) => ({
    type: "special",
    name: "opponent",
    icon: "🎯",
    mutual: mutual,
    specialDesc:
      "Opponent of the last contract gains any CR spent for P2P choices",
    failDetails:
      "If not Opp (Mutual) then the Opponent of the last contract gets the benefits of if you passed except for Notoriety. Opponent may choose the benefiting trooper if one is not specified by another trait.",
    passDetails:
      "If Opp (Mutual) then the Opponent of the last contract gets the benefits of if you passed except for Notoriety. Opponent may choose the benefiting trooper if one is not specified by another trait.",
    critDetails:
      "If Opp (Mutual) then the Opponent of the last contract gets the benefits of if you passed except for Notoriety. Opponent may choose the benefiting trooper if one is not specified by another trait.",
  }),
}; // traits.js

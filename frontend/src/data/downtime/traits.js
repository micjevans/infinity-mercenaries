import { Avatar, Box, Chip, Grid2, TextField, Typography } from "@mui/material";

export const traits = {
  chaotic: (downtimeState) => ({
    fail: [{ key: "company", value: downtimeState.company.notoriety - 1 }],
    pass: downtimeState.company.notoriety + 1,
    crit: downtimeState.company.notoriety + 2,
  }),
  lawful: (downtimeState) => ({
    fail: [{ key: "company", value: downtimeState.company.notoriety + 1 }],
    pass: [{ key: "company", value: downtimeState.company.notoriety - 1 }],
    crit: [{ key: "company", value: downtimeState.company.notoriety - 2 }],
  }),
  attack: {
    id: 3,
    fail: (company, trooper) => ({
      ...company,
      notoriety: company.notoriety + 1,
    }),
  },
  cr: {
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
  },
  xp: {
    pass: {
      key: "xp",
      value: 2,
    },
    crit: {
      key: "xp",
      value: 3,
    },
  },
  weapon: {
    pass: {
      key: "inventory",
      value: () => {
        return [1, 2, 3, 4, 5]; // Example inventory values
      },
    },
    crit: {
      key: "inventory",
      value: () => {
        return [1, 2, 3, 4, 5]; // Example inventory values
      },
    },
  },
  swc: {
    pass: {
      key: "swc",
      value: 1,
    },
    crit: {
      key: "swc",
      value: 2,
    },
  },
  p2p: {
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
      key: "credits",
      value: "p2p",
    },
    pass: {
      key: "credits",
      value: "p2p",
    },
  },
  skill: (skill) => ({
    pass: {
      key: "perks",
      value: skill,
    },
    crit: {
      key: "perks",
      value: skill,
    },
  }),
  lt: (troopers) => ({
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
    pass: {
      key: "captain",
      value: troopers,
    },
    crit: {
      key: "captain",
      value: troopers,
    },
  }),
}; // traits.js

import React, { useState } from "react";
import {
  Autocomplete,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

const SKILLS_DATA = {
  Dodge: {
    hasModifiers: true,
    modifiers: ['+1"', '+2"', '+3"'],
  },
  Immunity: {
    hasModifiers: true,
    modifiers: ["Total", "Shock", "Viral"],
  },
  "CC Attack": {
    hasModifiers: false,
  },
  // Add more skills as needed
};

const SkillSelect = ({ value = [], onChange }) => {
  const [open, setOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState([]);

  const handleSkillSelect = (event, newValues) => {
    if (!newValues) return;

    // Handle deletion
    if (newValues.length < value.length) {
      const updatedValue = value.filter((item) =>
        newValues.includes(item.skill)
      );
      onChange(updatedValue);
      return;
    }

    // Handle addition
    const newSkill = newValues[newValues.length - 1];
    if (!newSkill) return;

    if (SKILLS_DATA[newSkill]?.hasModifiers) {
      setSelectedSkill(newSkill);
      setOpen(true);
    } else {
      onChange([...value, { skill: newSkill, modifier: null }]);
    }
  };

  const handleModifierConfirm = () => {
    if (selectedSkill && selectedModifiers.length > 0) {
      onChange([
        ...value,
        { skill: selectedSkill, modifiers: selectedModifiers },
      ]);
    }
    setOpen(false);
    setSelectedSkill(null);
    setSelectedModifiers([]);
  };

  return (
    <>
      <Autocomplete
        multiple
        options={Object.keys(SKILLS_DATA)}
        getOptionLabel={(option) => option || ""}
        renderTags={(tagValue, getTagProps) =>
          value.map((option, index) => (
            <Chip
              key={`${option.skill}-${index}`}
              label={`${option.skill}${
                option.modifiers?.length
                  ? ` (${option.modifiers.join(", ")})`
                  : ""
              }`}
              {...getTagProps({ index })}
            />
          ))
        }
        renderInput={(params) => (
          <TextField {...params} placeholder="Add skills" />
        )}
        onChange={handleSkillSelect}
        value={value.map((v) => v.skill)}
      />

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Select {selectedSkill} Modifiers</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            options={SKILLS_DATA[selectedSkill]?.modifiers || []}
            getOptionLabel={(option) => option || ""}
            renderInput={(params) => (
              <TextField {...params} label="Modifiers" />
            )}
            onChange={(event, newValue) => setSelectedModifiers(newValue)}
            value={selectedModifiers}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleModifierConfirm}
            variant="contained"
            color="primary"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SkillSelect;

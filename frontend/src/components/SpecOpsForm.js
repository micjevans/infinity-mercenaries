import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Paper,
  styled,
  Card,
  CardContent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { mapItemData } from "../utils/metadataMapping";
import MapDetails from "./MapDetails";

// Styled component for attribute option buttons
const AttributeOption = styled(Button)(({ theme, selected }) => ({
  minWidth: "60px",
  padding: "6px 12px",
  margin: "0 4px",
  borderRadius: "4px",
  fontWeight: selected ? "bold" : "normal",
  borderBottom: selected ? `2px solid ${theme.palette.primary.main}` : "none",
  backgroundColor: selected ? theme.palette.action.selected : "transparent",
}));

const SpecOpsForm = ({ specops }) => {
  // Base attribute values
  const baseAttributes = {
    cc: 12,
    bs: 12,
    ph: 10,
    wip: 13,
    arm: 1,
    bts: 0,
    w: 1,
  };

  // Define attribute increase rules and maximums with updated W rule
  const attributeRules = {
    cc: { increments: [0, 2, 5, 10], max: 30 },
    bs: { increments: [0, 1, 2, 3], max: 15 },
    ph: { increments: [0, 1, 2, 3], max: 15 },
    wip: { increments: [0, 1, 2, 3], max: 15 },
    arm: { increments: [0, 1, 3], max: 10 },
    bts: { increments: [0, 3, 6, 9], max: 12 },
    w: { increments: [0, 1], max: 2 }, // Updated: +1 increment with max of 2
  };

  // XP costs for options (index-based)
  const xpCosts = [0, 2, 5, 10];

  // Selected attribute values (starting with base values)
  const [attributes, setAttributes] = useState({ ...baseAttributes });

  // Track which level is selected for each attribute (0 = base value)
  const [selectedLevels, setSelectedLevels] = useState({
    cc: 0,
    bs: 0,
    ph: 0,
    wip: 0,
    arm: 0,
    bts: 0,
    w: 0,
  });

  // Track selected items and their XP costs
  const [selectedWeapons, setSelectedWeapons] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);

  // Calculate total XP spent from all sources
  const [totalXP, setTotalXP] = useState(0);

  // Update total XP whenever any selection changes
  useEffect(() => {
    let attributeXP = 0;
    Object.entries(selectedLevels).forEach(([attr, level]) => {
      attributeXP += xpCosts[level] || 0;
    });

    const weaponsXP = selectedWeapons.reduce(
      (sum, item) => sum + (item.exp || 0),
      0
    );
    const skillsXP = selectedSkills.reduce(
      (sum, item) => sum + (item.exp || 0),
      0
    );
    const equipmentXP = selectedEquipment.reduce(
      (sum, item) => sum + (item.exp || 0),
      0
    );

    setTotalXP(attributeXP + weaponsXP + skillsXP + equipmentXP);
  }, [
    selectedLevels,
    selectedWeapons,
    selectedSkills,
    selectedEquipment,
    xpCosts,
  ]);

  // Generate valid options for an attribute based on rules
  const getAttributeOptions = (attribute, baseValue) => {
    const { increments, max } = attributeRules[attribute];
    const options = [];

    // Always include base value
    options.push({
      value: baseValue,
      level: 0,
      xpCost: 0,
    });

    // Add options with increments, respecting max value
    for (let i = 1; i < increments.length; i++) {
      const newValue = baseValue + increments[i];
      if (newValue <= max) {
        options.push({
          value: newValue,
          level: i,
          xpCost: xpCosts[i],
        });
      }
    }

    return options;
  };

  // Handle attribute selection
  const handleAttributeSelect = (attribute, optionIndex, optionValue) => {
    setAttributes((prev) => ({
      ...prev,
      [attribute]: optionValue,
    }));

    setSelectedLevels((prev) => ({
      ...prev,
      [attribute]: optionIndex,
    }));
  };

  // Toggle selection of an item
  const toggleSelection = (item, currentSelected, setSelected) => {
    const isSelected = currentSelected.some(
      (selected) => selected.id === item.id
    );

    if (isSelected) {
      setSelected(
        currentSelected.filter((selected) => selected.id !== item.id)
      );
    } else {
      setSelected([...currentSelected, item]);
    }
  };

  // Generate unique keys for each item type
  const getUniqueKey = (prefix, item) =>
    `${prefix}-${item.id || Math.random().toString(36).substr(2, 9)}`;

  // Render attribute options as tabs
  const renderAttributeOptions = (attribute, baseValue) => {
    const options = getAttributeOptions(attribute, baseValue);

    return (
      <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {attribute.toUpperCase()}
        </Typography>
        <Paper elevation={0} sx={{ display: "flex", justifyContent: "center" }}>
          {options.map((option, index) => (
            <AttributeOption
              // Use a compound key that includes the attribute name and index
              key={`${attribute}-option-${index}`}
              selected={selectedLevels[attribute] === index}
              onClick={() =>
                handleAttributeSelect(attribute, index, option.value)
              }
              disableRipple
              disableElevation
              variant="text"
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography>{option.value}</Typography>
                {option.xpCost > 0 && (
                  <Typography variant="caption">{option.xpCost} XP</Typography>
                )}
              </Box>
            </AttributeOption>
          ))}
        </Paper>
      </Box>
    );
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent
        sx={{
          py: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Spec Ops Configuration</Typography>
        <Typography variant="h6" color="primary" fontWeight="bold">
          Total XP: {totalXP}
        </Typography>
      </CardContent>
      {/* Collapsible section: Attributes */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Attributes</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {Object.entries(baseAttributes).map(([attr, baseValue]) => (
              <Box key={attr} sx={{ width: "30%", mb: 2 }}>
                {renderAttributeOptions(attr, baseValue)}
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Collapsible section: Weapons */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Weapons</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {specops.weapons.map((weapon) => {
              const xpCost = weapon.exp || 0;

              return (
                <FormControlLabel
                  // Use a unique prefixed key for weapons
                  key={getUniqueKey("weapon", weapon)}
                  control={
                    <Checkbox
                      checked={selectedWeapons.some((w) => w.id === weapon.id)}
                      onChange={() =>
                        toggleSelection(
                          weapon,
                          selectedWeapons,
                          setSelectedWeapons
                        )
                      }
                    />
                  }
                  label={
                    <Typography>
                      <MapDetails
                        list={[weapon]}
                        metaKey="weapons"
                        postText={` (${weapon.exp} XP)`}
                      />
                    </Typography>
                  }
                />
              );
            })}
            {specops.weapons.length === 0 && (
              <Typography variant="body2">No weapons available</Typography>
            )}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      {/* Collapsible section: Skills */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Skills</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {specops.skills.map((skill) => {
              const skillData = mapItemData(skill);
              const name = skillData?.[0]?.name || `Skill ${skill.id}`;
              const xpCost = skill.exp || 0;

              return (
                <FormControlLabel
                  // Use a unique prefixed key for skills
                  key={getUniqueKey("skill", skill)}
                  control={
                    <Checkbox
                      checked={selectedSkills.some((s) => s.id === skill.id)}
                      onChange={() =>
                        toggleSelection(
                          skill,
                          selectedSkills,
                          setSelectedSkills
                        )
                      }
                    />
                  }
                  label={
                    <Typography>
                      {name}
                      {xpCost > 0 && (
                        <Typography
                          component="span"
                          color="primary.light"
                          sx={{ ml: 1, fontWeight: "bold" }}
                        >
                          ({xpCost} XP)
                        </Typography>
                      )}
                    </Typography>
                  }
                />
              );
            })}
            {specops.skills.length === 0 && (
              <Typography variant="body2">No skills available</Typography>
            )}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      {/* Collapsible section: Equipment */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Equipment</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {specops.equip.map((equipment) => {
              const equipData = mapItemData(equipment);
              const name = equipData?.[0]?.name || `Equipment ${equipment.id}`;
              const xpCost = equipment.exp || 0;

              return (
                <FormControlLabel
                  // Use a unique prefixed key for equipment
                  key={getUniqueKey("equip", equipment)}
                  control={
                    <Checkbox
                      checked={selectedEquipment.some(
                        (e) => e.id === equipment.id
                      )}
                      onChange={() =>
                        toggleSelection(
                          equipment,
                          selectedEquipment,
                          setSelectedEquipment
                        )
                      }
                    />
                  }
                  label={
                    <Typography>
                      {name}
                      {xpCost > 0 && (
                        <Typography
                          component="span"
                          color="primary.light"
                          sx={{ ml: 1, fontWeight: "bold" }}
                        >
                          ({xpCost} XP)
                        </Typography>
                      )}
                    </Typography>
                  }
                />
              );
            })}
            {specops.equip.length === 0 && (
              <Typography variant="body2">No equipment available</Typography>
            )}
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
};

export default SpecOpsForm;

import React, { useState, useMemo } from "react";
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

// Generic ItemAccordion component to handle weapons, skills, and equipment
const ItemAccordion = ({
  title,
  items,
  selectedItems,
  metaKey,
  handleItemToggle,
}) => {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <FormGroup>
          {items.map((item) => {
            const isSelected = selectedItems.some(
              (s) => JSON.stringify(s) === JSON.stringify(item)
            );
            const xpCost = item.exp || 0;

            return (
              <FormControlLabel
                key={item._uniqueKey}
                control={
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleItemToggle(item, metaKey)}
                  />
                }
                label={
                  <MapDetails
                    list={[item]}
                    metaKey={metaKey}
                    postText={` (${xpCost} XP)`}
                  />
                }
              />
            );
          })}
          {items.length === 0 && (
            <Typography variant="body2">
              No {title.toLowerCase()} available
            </Typography>
          )}
        </FormGroup>
      </AccordionDetails>
    </Accordion>
  );
};

const SpecOpsForm = ({ editUnit, profile, xp, specops }) => {
  const option1 = [0, 0]; // Default first option for attributes
  const defaultOptions = [option1, [1, 2], [2, 5], [3, 10]]; // Default options for attributes

  const attributeRules = {
    cc: {
      options: [option1, [2, 2], [5, 5], [10, 10]].map(([val, xp]) => ({
        val: val + profile.cc,
        xp: xp,
      })),
      max: 30,
    },
    bs: {
      options: defaultOptions.map(([val, xp]) => ({
        val: val + profile.bs,
        xp: xp,
      })),
      max: 15,
    },
    ph: {
      options: defaultOptions.map(([val, xp]) => ({
        val: val + profile.ph,
        xp: xp,
      })),
      max: 15,
    },
    wip: {
      options: defaultOptions.map(([val, xp]) => ({
        val: val + profile.wip,
        xp: xp,
      })),
      max: 15,
    },
    arm: {
      options: [option1, [1, 5], [3, 10]].map(([val, xp]) => ({
        val: val + profile.arm,
        xp: xp,
      })),
      max: 10,
    },
    bts: {
      options: [option1, [3, 2], [6, 5], [9, 10]].map(([val, xp]) => ({
        val: val + profile.bts,
        xp: xp,
      })),
      max: 12,
    },
    w: {
      options: [option1, [1, 10]].map(([val, xp]) => ({
        val: val + profile.w,
        xp: xp,
      })),
      max: 2,
    },
  };

  // Track which level is selected for each attribute (0 = base value)
  const [selectedAttributes, setSelectedAttributes] = useState({
    cc: attributeRules.cc.options[0],
    bs: attributeRules.bs.options[0],
    ph: attributeRules.ph.options[0],
    wip: attributeRules.wip.options[0],
    arm: attributeRules.arm.options[0],
    bts: attributeRules.bts.options[0],
    w: attributeRules.w.options[0],
  });

  // Track selected items and their XP costs
  const [selectedWeapons, setSelectedWeapons] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);

  // Calculate total XP spent from all sources
  const [totalXP, setTotalXP] = useState(xp || 0);

  // Check if an XP change would make XP go negative
  const validateXpChange = (change) => {
    const newTotal = totalXP + change;
    return newTotal >= 0;
  };

  // Manually add index-based keys to specops items to ensure uniqueness
  const processedSpecops = useMemo(() => {
    const addUniqueKeys = (items, prefix) => {
      return items.map((item, index) => ({
        ...item,
        // Create a unique key identifier that can't conflict
        _uniqueKey: `${prefix}-${index}-${Math.random()
          .toString(36)
          .substring(2, 7)}`,
      }));
    };

    return {
      weapons: addUniqueKeys(specops.weapons || [], "weapon"),
      skills: addUniqueKeys(specops.skills || [], "skill"),
      equip: addUniqueKeys(specops.equip || [], "equip"),
    };
  }, [specops]);

  // Simplified and clean item selection handling with XP validation
  const handleItemToggle = (item, type) => {
    const itemXP = item.exp || 0;
    const stateMap = {
      weapons: { state: selectedWeapons, setter: setSelectedWeapons },
      skills: { state: selectedSkills, setter: setSelectedSkills },
      equips: { state: selectedEquipment, setter: setSelectedEquipment },
    };

    if (!stateMap[type]) {
      console.warn("Unhandled item type:", type);
      return;
    }

    const { state, setter } = stateMap[type];
    const isSelected = state.some(
      (existing) => JSON.stringify(existing) === JSON.stringify(item)
    );

    // Calculate XP change
    const xpChange = isSelected ? itemXP : -itemXP;

    // Validate XP change before proceeding
    if (!validateXpChange(xpChange)) {
      console.warn("Not enough XP for this selection");
      return; // Exit without making changes
    }

    // If we reach here, the XP change is valid, so update XP first
    setTotalXP((prevXP) => prevXP + xpChange);

    const newState = isSelected
      ? state.filter(
          (existing) => JSON.stringify(existing) !== JSON.stringify(item)
        )
      : [...state, item];

    // Update selection state after XP check
    setter(newState);
    const cleanItem = (itemToClean, itemType) => {
      let subItems = {};
      ["weapons", "skills", "equip", "peripherals"].forEach((key) => {
        if (itemToClean[key]) {
          subItems[key.endsWith("s") ? key : `${key}s`] = itemToClean[key].map(
            (subItem) => cleanItem(subItem, key.endsWith("s") ? key : `${key}s`)
          );
        }
      });
      return {
        ...subItems,
        id: itemToClean.id,
        extra: itemToClean.extras,
        key: itemType,
      }; // Clean the item to avoid circular references
    };
    const perks = [
      ...newState.map((newItem) => cleanItem(newItem, type)),
      // ...(type !== "attr"
      //   ? selectedAttributes.map((selectedAttribute) =>
      //       cleanItem(selectedAttribute)
      //     )
      //   : []), // Only include attributes if not handling them
      ...(type !== "equips"
        ? selectedEquipment.map((selectedEquip) =>
            cleanItem(selectedEquip, "equips")
          )
        : []), // Only include equipment if not handling them
      ...(type !== "weapons"
        ? selectedWeapons.map((selectedWeapon) =>
            cleanItem(selectedWeapon, "weapons")
          )
        : []), // Only include weapons if not handling them
      ...(type !== "skills"
        ? selectedSkills.map((selectedSkill) =>
            cleanItem(selectedSkill, "skills")
          )
        : []),
    ];
    editUnit(perks);
  };

  // Attribute option click handler with XP validation
  const handleAttributeOptionClick = (attr, option) => {
    // Calculate the XP change
    const currentXpCost = selectedAttributes[attr].xp || 0;
    const newXpCost = option.xp;
    const xpChange = currentXpCost - newXpCost; // Positive if we're saving XP, negative if spending more
    // Validate XP change before proceeding
    if (!validateXpChange(xpChange)) {
      console.warn("Not enough XP to upgrade this attribute");
      return; // Exit without making changes
    }

    // If XP change is valid, update XP first
    setTotalXP((prevXP) => prevXP + xpChange);

    // Then update the attribute selection
    setSelectedAttributes((prevAttr) => ({
      ...prevAttr,
      [attr]: option,
    }));

    // Finally, update the parent component
    editUnit(attr, option.val);
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
            {Object.entries(attributeRules).map(([attr, attrRules]) => (
              <Box key={attr} sx={{ width: "30%", mb: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {attr.toUpperCase()}
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{ display: "flex", justifyContent: "center" }}
                  >
                    {attrRules.options.map(
                      (option) =>
                        option.val <= attrRules.max && (
                          <AttributeOption
                            // Use a compound key that includes the attribute name and index
                            key={`${attr}-option-${option.val}`}
                            selected={
                              selectedAttributes[attr].val === option.val
                            }
                            onClick={() =>
                              handleAttributeOptionClick(attr, option)
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
                              <Typography>{option.val}</Typography>
                              {option.xp > 0 && (
                                <Typography variant="caption">
                                  {option.xp} XP
                                </Typography>
                              )}
                            </Box>
                          </AttributeOption>
                        )
                    )}
                  </Paper>
                </Box>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Use the new ItemAccordion component for weapons, skills, and equipment */}
      <ItemAccordion
        title="Weapons"
        items={processedSpecops.weapons}
        selectedItems={selectedWeapons}
        metaKey="weapons"
        handleItemToggle={handleItemToggle}
      />

      <ItemAccordion
        title="Skills"
        items={processedSpecops.skills}
        selectedItems={selectedSkills}
        metaKey="skills"
        handleItemToggle={handleItemToggle}
      />

      <ItemAccordion
        title="Equipment"
        items={processedSpecops.equip}
        selectedItems={selectedEquipment}
        metaKey="equips"
        handleItemToggle={handleItemToggle}
      />
    </Card>
  );
};

export default SpecOpsForm;

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  InputAdornment,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import DevicesIcon from "@mui/icons-material/Devices";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DescriptionIcon from "@mui/icons-material/Description";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import StarsIcon from "@mui/icons-material/Stars";
import HandshakeIcon from "@mui/icons-material/Handshake";
import StorageIcon from "@mui/icons-material/Storage";
import InfoIcon from "@mui/icons-material/Info";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShopDialog from "../components/ShopDialog";
import baseMarket from "../data/markets/baseMarket.json";
import TrooperList from "../components/TrooperList";
import { useAuth } from "../auth/AuthContext";
import { v4 as uuid4 } from "uuid";
import {
  updateCompanyDetails,
  updateInventoryAndCredits,
} from "../services/companyService";
import { getTroopers } from "../services/trooperService";
import metadata from "../data/factions/metadata";
import CasinoIcon from "@mui/icons-material/Casino";
import { calcItemCr } from "../utils/costUtils";
import { generateLootItem, generateTier } from "../utils/lootUtils"; // Add this import

const CompanyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [units, setUnits] = useState(null);

  let cleanedCompany = null;
  if (location?.state?.company) {
    const stateCompany = location.state.company;
    cleanedCompany = {
      ...stateCompany,
      sectorials: stateCompany.sectorials || [],
      inventory: stateCompany.inventory || [],
      notoriety: stateCompany.notoriety || 0,
      credits: stateCompany.credits || 0,
      sponsor: stateCompany.sponsor || "",
    };
  }

  const [company, setCompany] = useState(cleanedCompany);
  const [isModified, setIsModified] = useState(false);
  const [troopers, setTroopers] = useState([]); // Add state to track troopers for disabling sectorial selection

  // Check if sectorials can be edited (no troopers added yet)
  const canEditSectorials = !troopers || troopers.length === 0;

  // Load units data for AddTrooperDialog
  useEffect(() => {
    const loadUnits = async () => {
      try {
        if (!units) {
          // Replace this with actual units loading logic
          const loadedUnits = []; // Should load from your data source
          setUnits(loadedUnits);
        }
      } catch (error) {
        console.error("Error loading units:", error);
      }
    };
    loadUnits();
  }, [units]);

  // Fetch troopers data
  useEffect(() => {
    if (!user || !company?.id) return;

    const fetchTroopers = async () => {
      try {
        // Pass isLocal flag to getTroopers
        const troopersList = await getTroopers(
          company.id,
          user.uid,
          company.local
        );
        setTroopers(troopersList);
      } catch (error) {
        console.error("Error fetching troopers:", error);
      }
    };

    fetchTroopers();
  }, [company?.id, user, company?.local]);

  // Add state to track expanded sections (default all open)
  const [expandedSections, setExpandedSections] = useState({
    info: true,
    dashboard: true,
  });

  // Handle accordion expansion
  const handleAccordionChange = (section) => (event, isExpanded) => {
    setExpandedSections({
      ...expandedSections,
      [section]: isExpanded,
    });
  };

  // Replace simple assignment with loot generation for weapons
  const merchantItems = React.useMemo(() => {
    // If no company or seed is available, return regular items with uuid and cr
    if (!company?.seed) {
      return baseMarket.items.map((item) => ({
        ...item,
        cr: item.cr || calcItemCr(item),
        uuid: uuid4(),
      }));
    }

    // Separate weapons from other items
    const weaponItems = baseMarket.items.filter(
      (item) => item.key === "weapons" && item.upgrades !== false
    );
    const otherItems = baseMarket.items.filter(
      (item) => item.key !== "weapons" || item.upgrades === false
    );

    // Generate rarities for weapons based on seed
    const generatedWeapons = weaponItems.map((weapon) => {
      // Generate unique seed for this specific weapon
      const itemSeed = `${company.seed}-weapon-${weapon.id}`;
      const rarityTier = generateTier(itemSeed);
      // Generate loot item
      const lootItem = generateLootItem(weapon, rarityTier, itemSeed);

      // Add uuid and cr properties
      return {
        ...lootItem,
        cr: lootItem.cr || calcItemCr(lootItem),
        uuid: uuid4(),
      };
    });

    // Add uuid and cr to other items as well
    const processedOtherItems = otherItems.map((item) => ({
      ...item,
      cr: item.cr || calcItemCr(item),
      uuid: uuid4(),
    }));

    // Combine generated weapons with other items
    return [...generatedWeapons, ...processedOtherItems];
  }, [company?.seed]);

  if (!cleanedCompany) return null;

  const companyName = cleanedCompany?.name;

  // Add handler for description changes
  const handleDescriptionChange = (e) => {
    setCompany({
      ...company,
      description: e.target.value,
    });
    setIsModified(true);
  };

  // Add handler for credits changes (only for local companies)
  const handleCreditsChange = (e) => {
    const newValue = parseInt(e.target.value) || 0;
    setCompany({
      ...company,
      credits: newValue,
    });
    setIsModified(true);
  };

  // Add handlers for sectorial changes
  const handleSectorial1Change = (e) => {
    const selectedId = Number(e.target.value);
    const selectedFaction = metadata.factions.find(
      (faction) => faction.id === selectedId
    );

    if (!selectedFaction) return;

    // If sectorial1 changes, we may need to reset sectorial2 if it's no longer compatible
    let newSectorial2 = company.sectorial2;

    // If the selected faction is a parent faction, reset sectorial2
    if (selectedFaction.id === selectedFaction.parent) {
      newSectorial2 = null;
    }

    setCompany({
      ...company,
      sectorial1: selectedFaction,
      sectorial2: newSectorial2,
    });
    setIsModified(true);
  };

  const handleSectorial2Change = (e) => {
    const selectedId = Number(e.target.value);
    const selectedFaction = metadata.factions.find(
      (faction) => faction.id === selectedId
    );

    if (!selectedFaction) return;

    setCompany({
      ...company,
      sectorial2: selectedFaction,
    });
    setIsModified(true);
  };

  // Add a handler for seed changes
  const handleSeedChange = (e) => {
    setCompany((prev) => ({
      ...prev,
      seed: e.target.value,
    }));
    setIsModified(true);
  };

  // Add a function to generate a random seed
  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1000000).toString();
    setCompany((prev) => ({
      ...prev,
      seed: randomSeed,
    }));
    setIsModified(true);
  };

  // Update to use the service function with local flag
  const saveCompanyDetails = async () => {
    if (!user || !company || !company.id) return;

    try {
      const isLocal = location?.state?.isLocal || company?.local;

      await updateCompanyDetails(
        user.uid,
        company.id,
        {
          name: company.name,
          description: company.description,
          sectorial1: company.sectorial1,
          sectorial2: company.sectorial2,
          seed: company.seed,
          // Include credits in the update if local
          ...(company.local && { credits: company.credits }),
        },
        isLocal
      );

      setIsModified(false);
    } catch (error) {
      console.error("Error saving company details:", error);
    }
  };

  // Update to use the service function with local flag
  const saveInventoryChanges = async (updatedInventory, updatedCredits) => {
    if (!user || !company || !company.id) return;

    updateInventoryAndCredits(
      user.uid,
      company.id,
      updatedInventory,
      updatedCredits,
      company.local // Pass local flag
    );
  };

  if (!company) {
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      {/* Header with back button and title */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Tooltip title="Back to Companies">
          <IconButton
            onClick={() => navigate("/companies")}
            color="primary"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
            {companyName || "Company"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
            {company.local ? (
              <Chip
                icon={<DevicesIcon />}
                label="Local Company"
                size="small"
                color="primary"
                variant="outlined"
              />
            ) : (
              <Chip
                icon={<StorageIcon />}
                label="Database Company"
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Save button moved to header */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={saveCompanyDetails}
          disabled={!isModified}
        >
          Save Changes
        </Button>
      </Box>

      {/* Info Section - Combines Sectorials, Description, and Sponsor */}
      <Accordion
        expanded={expandedSections.info}
        onChange={handleAccordionChange("info")}
        sx={{
          mb: 3,
          boxShadow: 3,
          "&:before": { display: "none" }, // Remove the default divider
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "primary.contrastText" }} />}
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            height: 64,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <InfoIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Company Info</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          {/* Sectorials */}
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ fontWeight: "medium", mb: 2 }}
          >
            Sectorials
          </Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Sectorial 1 */}
            <Grid item xs={12} md={6}>
              {canEditSectorials ? (
                <FormControl fullWidth>
                  <InputLabel id="sectorial1-label">Sectorial 1</InputLabel>
                  <Select
                    labelId="sectorial1-label"
                    value={company.sectorial1 ? company.sectorial1.id : ""}
                    label="Sectorial 1"
                    onChange={handleSectorial1Change}
                    renderValue={(selected) => {
                      const faction = metadata.factions.find(
                        (f) => f.id === selected
                      );
                      return faction ? (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <img
                            src={faction.logo}
                            alt={faction.name}
                            style={{ width: 24, height: 24, marginRight: 8 }}
                          />
                          <span>{faction.name}</span>
                        </Box>
                      ) : (
                        "Select Sectorial 1"
                      );
                    }}
                  >
                    {metadata.factions.map((faction) => (
                      <MenuItem key={faction.id} value={faction.id}>
                        <img
                          src={faction.logo}
                          alt={faction.name}
                          style={{ width: 24, height: 24, marginRight: 8 }}
                        />
                        {faction.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Box
                  sx={{
                    border: "1px solid rgba(255, 255, 255, 0.23)",
                    borderRadius: 1,
                    p: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                  >
                    Sectorial 1
                  </Typography>
                  {company.sectorial1 ? (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <img
                        src={company.sectorial1.logo}
                        alt={company.sectorial1.name}
                        style={{ width: 24, height: 24, marginRight: 8 }}
                      />
                      <Typography>{company.sectorial1.name}</Typography>
                    </Box>
                  ) : (
                    <Typography color="text.secondary">
                      None selected
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>

            {/* Sectorial 2 */}
            <Grid item xs={12} md={6}>
              {canEditSectorials ? (
                <FormControl
                  fullWidth
                  disabled={
                    !company.sectorial1 ||
                    (company.sectorial1 &&
                      company.sectorial1.id === company.sectorial1.parent)
                  }
                >
                  <InputLabel id="sectorial2-label">Sectorial 2</InputLabel>
                  <Select
                    labelId="sectorial2-label"
                    value={company.sectorial2 ? company.sectorial2.id : ""}
                    label="Sectorial 2"
                    onChange={handleSectorial2Change}
                    renderValue={(selected) => {
                      const faction = metadata.factions.find(
                        (f) => f.id === selected
                      );
                      return faction ? (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <img
                            src={faction.logo}
                            alt={faction.name}
                            style={{ width: 24, height: 24, marginRight: 8 }}
                          />
                          <span>{faction.name}</span>
                        </Box>
                      ) : (
                        "Select Sectorial 2"
                      );
                    }}
                  >
                    {metadata.factions
                      .filter((faction) => faction.id !== faction.parent)
                      .map((faction) => (
                        <MenuItem key={faction.id} value={faction.id}>
                          <img
                            src={faction.logo}
                            alt={faction.name}
                            style={{ width: 24, height: 24, marginRight: 8 }}
                          />
                          {faction.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              ) : (
                <Box
                  sx={{
                    border: "1px solid rgba(255, 255, 255, 0.23)",
                    borderRadius: 1,
                    p: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                  >
                    Sectorial 2
                  </Typography>
                  {company.sectorial2 ? (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <img
                        src={company.sectorial2.logo}
                        alt={company.sectorial2.name}
                        style={{ width: 24, height: 24, marginRight: 8 }}
                      />
                      <Typography>{company.sectorial2.name}</Typography>
                    </Box>
                  ) : (
                    <Typography color="text.secondary">
                      None selected
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>
          </Grid>

          {!canEditSectorials && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Sectorials cannot be changed once troopers have been added to the
              company.
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Sponsor */}
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 3 }}>
            <HandshakeIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
                Sponsor
              </Typography>
              <Typography variant="body1">
                {company.sponsor || "None"}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Description */}
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
            <DescriptionIcon sx={{ mr: 1, mt: 0.5 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
              Company Description
            </Typography>
          </Box>
          <TextField
            fullWidth
            variant="outlined"
            multiline
            minRows={4}
            placeholder="Enter details about your company, its history, notable achievements, or future goals..."
            value={company?.description || ""}
            onChange={handleDescriptionChange}
          />

          {/* Add the seed field inside your company info accordion */}
          {company?.local && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                <TextField
                  label="Shop Seed"
                  fullWidth
                  value={company.seed || ""}
                  onChange={handleSeedChange}
                  helperText="Changes the random generation of shop items. Leave empty for random seed."
                  margin="normal"
                />
                <IconButton
                  color="primary"
                  onClick={generateRandomSeed}
                  sx={{ mt: 2.5, ml: 1 }}
                  title="Generate random seed"
                >
                  <CasinoIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Dashboard Card - Simplified to just show Credits, Notoriety, and Renown */}
      <Accordion
        expanded={expandedSections.dashboard}
        onChange={handleAccordionChange("dashboard")}
        sx={{
          mb: 3,
          boxShadow: 3,
          "&:before": { display: "none" }, // Remove the default divider
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "primary.contrastText" }} />}
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            height: 64,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <MilitaryTechIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Dashboard</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Credits */}
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Credits
                </Typography>

                {company.local ? (
                  <TextField
                    type="number"
                    value={company.credits}
                    onChange={handleCreditsChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CurrencyExchangeIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CurrencyExchangeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{company.credits}</Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Notoriety */}
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  height: "100%",
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <StarsIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notoriety
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                    {company.notoriety}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Renown */}
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  height: "100%",
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <MilitaryTechIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Renown
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                    {company.renown || 0}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Button
              onClick={() => setShopModalOpen(true)}
              variant="contained"
              color="primary"
              startIcon={<ShoppingCartIcon />}
              sx={{ px: 4 }}
            >
              Open Shop & Inventory
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Trooper List Section */}
      <TrooperList
        company={company}
        setCompany={setCompany}
        troopers={troopers}
      />

      {/* Shop Dialog - unchanged */}
      <ShopDialog
        open={shopModalOpen}
        onClose={() => setShopModalOpen(false)}
        companyItems={company.inventory || []}
        merchantItems={merchantItems}
        companyCredits={company.credits || 0}
        seed={company.seed} // Pass the seed to ShopDialog
        onConfirmExchange={async (exchangeData) => {
          try {
            const updatedInventory = [
              ...company.inventory.filter(
                (item) =>
                  !exchangeData.companyItems.some(
                    (exItem) => exItem.id === item.id
                  )
              ),
              ...exchangeData.merchantItems,
            ];

            const updatedCredits = company.credits + exchangeData.netExchange;

            setCompany((prev) => ({
              ...prev,
              inventory: updatedInventory,
              credits: updatedCredits,
            }));

            await saveInventoryChanges(updatedInventory, updatedCredits);

            setShopModalOpen(false);
          } catch (error) {
            console.error("Error processing exchange:", error);
          }
        }}
      />
    </Container>
  );
};

export default CompanyPage;

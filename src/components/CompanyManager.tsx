import { useEffect, useMemo, useState, Fragment } from "react";
import type React from "react";
import {
  deleteLocalCompany,
  loadLocalCompanies,
  saveLocalCompanies,
  updateCompanySectorials,
  type LocalCompany,
} from "../lib/mercs/companyStore";
import {
  loadCompany,
  loadAllCompanies,
  saveCompany as saveCompanyToLayer,
  isCompanyDriveBacked,
} from "../lib/mercs/companyDataLayer";
import {
  isSignedIn as getGoogleSignedIn,
  restorePersistedAuthState,
} from "../lib/google-drive-adapter";
import { perkTrees, type Perk } from "../data/perks";
import baseMarket from "../data/infinity/markets/baseMarket.json";
import { warMarkets } from "../data/markets";
import silhouetteImage from "../legacy/old-app/assets/images/silhouette.png?url";
import { factionList, mapItemData, mapType } from "../lib/mercs/metadata";
import {
  getRecruitableUnits,
  loadRecruitmentPool,
  searchRecruitableUnits,
} from "../lib/mercs/recruitment";
import {
  makeDefaultSpecOpsAttributeRules,
  shouldUseDefaultSpecOpsAttributeChart,
} from "../lib/mercs/specops";
import {
  EQUIPMENT_SLOTS,
  applyItemToTrooper,
  cleanUnitForRoster,
  flattenTrooperForRoster,
  getCaptainSpecOpsXpBudget,
  getTrooperPoints,
  getTrooperSwc,
  makeId,
  numberValue,
  renderCombinedDetails,
} from "../lib/mercs/trooperUtils";
import type {
  FactionMetadata,
  MetadataItem,
  Profile,
  ProfileGroup,
  ProfileOption,
  Unit,
} from "../lib/mercs/types";
import { AppIcon, type AppIconName } from "./AppIcon";
import {
  RecruitableUnit,
  SpecOpsConfigurator,
  SpecOpsItemSection,
  type CaptainDraft,
  type SpecopsPool,
} from "./CaptainCreatorStep";
import { UnitProfileDisplay } from "./UnifiedProfileCard";

type SectionKey = "info" | "dashboard" | "troopers";

function formatDate(value?: string): string {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function findFactionById(id: string): FactionMetadata | null {
  const numericId = Number(id);
  return factionList.find((faction) => faction.id === numericId) || null;
}

function getSectorial2Options(
  primary: FactionMetadata | null | undefined,
): FactionMetadata[] {
  if (!primary || primary.id === primary.parent) return [];
  return factionList.filter((faction) => faction.id !== faction.parent);
}

function calculateLevel(xp?: number): number {
  const safeXp = Number(xp || 0);
  if (safeXp < 5) return 1;
  if (safeXp < 15) return 2;
  if (safeXp < 30) return 3;
  if (safeXp < 50) return 4;
  if (safeXp < 75) return 5;
  if (safeXp < 105) return 6;
  if (safeXp < 140) return 7;
  return 8;
}

function LegacyAccordion({
  id,
  title,
  icon,
  expanded,
  onToggle,
  action,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`legacy-accordion${expanded ? " is-expanded" : ""}`}
      id={id}
    >
      <div className="legacy-accordion__header">
        <button
          className="legacy-accordion__summary"
          type="button"
          onClick={onToggle}
        >
          <span className="legacy-accordion__title">
            <span className="legacy-accordion__icon" aria-hidden="true">
              {icon}
            </span>
            {title}
          </span>
          <AppIcon name={expanded ? "up" : "down"} size={17} />
        </button>
        {action && <div className="legacy-accordion__action">{action}</div>}
      </div>
      {expanded && <div className="legacy-accordion__details">{children}</div>}
    </section>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="legacy-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function FactionOption({ faction }: { faction: FactionMetadata }) {
  return (
    <>
      {faction.logo && <img src={faction.logo} alt="" aria-hidden="true" />}
      <span>{faction.name}</span>
    </>
  );
}

function DashboardCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  hint?: string;
}) {
  return (
    <div className="legacy-dashboard-card">
      <span aria-hidden="true">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        {hint && <em>{hint}</em>}
      </div>
    </div>
  );
}

function TrooperCard({
  trooper,
  onEdit,
  onDelete,
}: {
  trooper: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const renderedTrooper = renderCombinedDetails(trooper);

  const trooperActions = (
    <>
      <button className="command-button" type="button" onClick={onEdit}>
        Edit Trooper
      </button>
      <button
        className="command-button command-button--danger"
        type="button"
        onClick={onDelete}
      >
        <AppIcon name="trash" size={16} />
        Delete
      </button>
    </>
  );

  return (
    <article
      className={`legacy-trooper-card${trooper.captain ? " is-captain" : ""}`}
    >
      <UnitProfileDisplay
        unit={renderedTrooper}
        profileGroups={renderedTrooper.profileGroups || []}
        collapsible
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        showTts={expanded}
        ttsActions={trooperActions}
      />
    </article>
  );
}

function getInventoryItemName(item: MetadataItem): string {
  const mapped = mapItemData(item);
  const first = mapped[0];
  const rarity =
    typeof item.rarity === "object" && item.rarity && "name" in item.rarity
      ? ` (${(item.rarity as any).name})`
      : "";
  return `${first?.name || item.name || item.displayName || item.id}${rarity}`;
}

function getInventoryItemSlot(item: MetadataItem): string {
  const mapped = mapItemData(item);
  const slot = String(mapped[0]?.slot || item.slot || "other").toLowerCase();
  if (slot.includes("primary")) return "primary";
  if (slot.includes("secondary")) return "secondary";
  if (slot.includes("sidearm") || slot.includes("side arm")) return "sidearm";
  if (slot.includes("role")) return "role";
  if (slot.includes("armor") || slot.includes("armour")) return "armor";
  if (slot.includes("augment")) return "augment";
  if (item.key === "weapons") {
    const name = String(item.name || mapped[0]?.name || "").toLowerCase();
    if (
      ["stun pistol", "da cc", "grenades", "para cc"].some((value) =>
        name.includes(value),
      )
    )
      return "sidearm";
    if (
      ["mine", "repeater", "boarding shotgun"].some((value) =>
        name.includes(value),
      )
    )
      return "secondary";
    return "primary";
  }
  return "accessory";
}

function getShopSlotLabel(slot: string): string {
  const labels: Record<string, string> = {
    primary: "Primary",
    secondary: "Secondary",
    sidearm: "Sidearm",
    accessory: "Accessories",
    role: "Roles",
    armor: "Armor",
    augment: "Augments",
    other: "Other",
  };
  return labels[slot] || slot;
}

function normalizeShopLookupName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+]/g, "");
}

function canonicalShopLookupName(value: string): string {
  const normalized = normalizeShopLookupName(value);
  const aliases: Record<string, string> = {
    heavymachinegun: "hmg",
    shockmine: "shockmines",
    daccweapon: "daccw",
    paraccweapon: "paracc3",
    paraccw3: "paracc3",
  };
  return aliases[normalized] || normalized;
}

type BaseMarketRuleInfo = {
  section: string;
  type?: string;
  arm?: string;
  bts?: string;
  effect?: string;
  note?: string;
  swc?: string;
};

function findShopSectionNoteForItem(
  sectionNote: string | undefined,
  itemName: string,
): string | undefined {
  if (!sectionNote) return undefined;
  const noteNormalized = normalizeShopLookupName(sectionNote);
  const itemNormalized = normalizeShopLookupName(itemName);
  if (!itemNormalized) return undefined;
  if (noteNormalized.includes(itemNormalized)) return sectionNote;

  const itemTokens = itemName
    .split(/[^A-Za-z0-9+]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4)
    .map((token) => normalizeShopLookupName(token));

  return itemTokens.some((token) => token && noteNormalized.includes(token))
    ? sectionNote
    : undefined;
}

const baseMarketRuleLookup = (() => {
  const lookup = new Map<string, BaseMarketRuleInfo>();
  const baseMarketData = warMarkets.find(
    (market) => market.name === "Base Market",
  );
  if (!baseMarketData) return lookup;

  baseMarketData.sections.forEach((section) => {
    section.items.forEach((entry) => {
      lookup.set(canonicalShopLookupName(entry.name), {
        section: section.name,
        type: entry.type,
        arm: entry.arm,
        bts: entry.bts,
        effect: entry.effect,
        note: findShopSectionNoteForItem(section.note, entry.name),
        swc: entry.swc,
      });
    });
  });

  return lookup;
})();

function getShopItemRuleInfo(
  item: MetadataItem,
): BaseMarketRuleInfo | undefined {
  const mapped = mapItemData(item);
  const mappedName = String(mapped[0]?.name || item.name || "");
  const lookupKey = canonicalShopLookupName(mappedName);
  return baseMarketRuleLookup.get(lookupKey);
}

function getShopItemVisualMeta(item: MetadataItem): {
  kicker: string;
  detail?: string;
  chips: string[];
  note?: string;
} {
  const slot = getInventoryItemSlot(item);
  const slotLabel = getShopSlotLabel(slot);
  const mapped = mapItemData(item);
  const mappedItem = mapped[0] as Record<string, unknown> | undefined;
  const rule = getShopItemRuleInfo(item);

  const chips: string[] = [slotLabel];
  if (rule?.type && rule.type !== "-") chips.push(`Type ${rule.type}`);
  if (rule?.arm && rule.arm !== "-") chips.push(`ARM ${rule.arm}`);
  if (rule?.bts && rule.bts !== "-") chips.push(`BTS ${rule.bts}`);

  if (item.key === "weapons" && mappedItem) {
    const burst = String(mappedItem.burst || "");
    const damage = String(mappedItem.damage || "");
    if (burst && burst !== "-") chips.push(`B ${burst}`);
    if (damage && damage !== "-") chips.push(`DMG ${damage}`);
  }

  const properties = Array.isArray(mappedItem?.properties)
    ? (mappedItem?.properties as unknown[])
        .map((entry) => String(entry).trim())
        .filter((entry) => entry && !entry.startsWith("["))
    : [];

  const detail =
    rule?.effect ||
    (properties.length > 0 ? properties.slice(0, 3).join(", ") : undefined);

  return {
    kicker: rule ? `${rule.section} Catalog` : `${slotLabel} Listing`,
    detail,
    chips,
    note: rule?.note,
  };
}

function getStaticMarketCost(item: MetadataItem): number {
  if (item.cr !== undefined) return Number(item.cr) || 0;
  const byName: Record<string, number> = {
    mk12: 12,
    spitfire: 18,
    "heavy machine gun": 24,
    "shock mine": 5,
    "deployable repeater": 8,
    "boarding shotgun": 10,
    "stun pistol": 1,
    "da cc weapon": 3,
    grenades: 4,
    "para cc weapon": 4,
  };
  return byName[String(item.name || "").toLowerCase()] || 0;
}

function makeShopItem(item: MetadataItem, index: number): MetadataItem {
  return {
    ...structuredClone(item),
    uuid: `market-${item.key || "item"}-${item.id}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    cr: getStaticMarketCost(item),
  };
}

function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 5;
  if (level === 3) return 15;
  if (level === 4) return 30;
  if (level === 5) return 50;
  if (level === 6) return 75;
  if (level === 7) return 105;
  return 140;
}

function getPerkIdentity(perk: any): string {
  return JSON.stringify({
    id: perk.id,
    key: perk.key,
    extra: perk.extra,
    name: perk.name,
    tree: perk.tree,
    tier: perk.tier,
    roll: perk.roll,
  });
}

function mergeMetadataItemsById(
  items: any[],
): Map<string, Set<number | string>> {
  const merged = new Map<string, Set<number | string>>();

  items.forEach((item: any) => {
    const key = String(item?.id ?? "");
    if (!key) return;

    const extras = merged.get(key) || new Set<number | string>();
    const itemExtra = Array.isArray(item?.extra) ? item.extra : [];
    itemExtra.forEach((extra: number | string) => extras.add(extra));
    merged.set(key, extras);
  });

  return merged;
}

function collectTrooperMetadataItems(trooper: any, keys: string[]): any[] {
  const profile = trooper.profileGroups?.[0]?.profiles?.[0] || {};
  const option = trooper.profileGroups?.[0]?.options?.[0] || {};

  return keys.flatMap((key) => {
    const topLevelItems = Array.isArray(trooper[key]) ? trooper[key] : [];
    const profileItems = Array.isArray(profile[key]) ? profile[key] : [];
    const optionItems = Array.isArray(option[key]) ? option[key] : [];
    return [...topLevelItems, ...profileItems, ...optionItems];
  });
}

function hasAllMetadataItems(
  currentItems: any[],
  requiredItems: any[],
): boolean {
  const mergedCurrentItems = mergeMetadataItemsById(currentItems);

  return requiredItems.every((requiredItem: any) => {
    const requiredExtra = Array.isArray(requiredItem.extra)
      ? requiredItem.extra
      : [];
    const currentExtra = mergedCurrentItems.get(String(requiredItem.id));
    if (!currentExtra) return false;
    return requiredExtra.every((extraId: number | string) =>
      currentExtra.has(extraId),
    );
  });
}

function isPerkSelected(trooper: any, perk: any): boolean {
  if (
    (trooper.perks || []).some(
      (existing: any) => getPerkIdentity(existing) === getPerkIdentity(perk),
    )
  ) {
    return true;
  }

  // Include currently equipped shop/loadout items by checking the rendered trooper state.
  const renderedTrooper = renderCombinedDetails(trooper);

  const metadataChecks: Array<[any[], any[]]> = [
    [
      [
        ...collectTrooperMetadataItems(trooper, ["skills"]),
        ...collectTrooperMetadataItems(renderedTrooper, ["skills"]),
      ],
      Array.isArray(perk.skills) ? perk.skills : [],
    ],
    [
      [
        ...collectTrooperMetadataItems(trooper, ["equip", "equips"]),
        ...collectTrooperMetadataItems(renderedTrooper, ["equip", "equips"]),
      ],
      Array.isArray(perk.equips) ? perk.equips : [],
    ],
    [
      [
        ...collectTrooperMetadataItems(trooper, ["weapons"]),
        ...collectTrooperMetadataItems(renderedTrooper, ["weapons"]),
      ],
      Array.isArray(perk.weapons) ? perk.weapons : [],
    ],
    [
      [
        ...collectTrooperMetadataItems(trooper, ["peripheral", "peripherals"]),
        ...collectTrooperMetadataItems(renderedTrooper, [
          "peripheral",
          "peripherals",
        ]),
      ],
      Array.isArray(perk.peripherals) ? perk.peripherals : [],
    ],
  ];

  const activeChecks = metadataChecks.filter(
    ([, requiredItems]) => requiredItems.length > 0,
  );
  if (activeChecks.length > 0) {
    return activeChecks.every(([currentItems, requiredItems]) =>
      hasAllMetadataItems(currentItems, requiredItems),
    );
  }

  return false;
}

function makeReferencePerk(treeName: string, perk: Perk): MetadataItem {
  const baseId = `perk:${treeName}:${perk.tier}:${perk.roll}:${perk.name}:${perk.detail || ""}`;
  const displayName = perk.detail ? `${perk.name} (${perk.detail})` : perk.name;

  const base: MetadataItem = {
    id: baseId,
    name: displayName,
    key: "perk",
    tree: treeName,
    tier: perk.tier,
    roll: perk.roll,
    requires: perk.requires || [],
  };

  return perk.effect ? { ...base, ...structuredClone(perk.effect) } : base;
}

function EditTrooperDialog({
  trooperToEdit,
  companyInventory,
  onClose,
  saveChanges,
}: {
  trooperToEdit: any;
  companyInventory: MetadataItem[];
  onClose: () => void;
  saveChanges: (trooper: any, inventory: MetadataItem[]) => void;
}) {
  const [trooper, setTrooper] = useState(() => structuredClone(trooperToEdit));
  const [inventory, setInventory] = useState<MetadataItem[]>(() =>
    structuredClone(companyInventory || []),
  );
  const [selectedTab, setSelectedTab] = useState<"equipment" | "perks">(
    "equipment",
  );
  const [selectedSlot, setSelectedSlot] = useState<string>("primary");
  const level = calculateLevel(trooper.xp);
  const nextLevel = xpForLevel(level + 1);
  const currentLevel = xpForLevel(level);
  const xpToNextLevel = Math.max(0, nextLevel - Number(trooper.xp || 0));
  const progress = Math.min(
    100,
    Math.max(
      0,
      ((Number(trooper.xp || 0) - currentLevel) /
        Math.max(1, nextLevel - currentLevel)) *
        100,
    ),
  );

  function handleEquipmentChange(slot: string, uuid: string) {
    const currentItem = trooper[slot];
    const selectedItem = inventory.find((item) => item.uuid === uuid) || null;
    setTrooper((current: any) => ({ ...current, [slot]: selectedItem }));
    setInventory((current) => {
      const withoutSelected = selectedItem
        ? current.filter((item) => item.uuid !== selectedItem.uuid)
        : current;
      return currentItem?.uuid
        ? [...withoutSelected, currentItem]
        : withoutSelected;
    });
  }

  const selectedSlotItems = inventory.filter(
    (item) => getInventoryItemSlot(item) === selectedSlot,
  );
  const selectedEquippedItem = trooper[selectedSlot] as
    | MetadataItem
    | null
    | undefined;

  return (
    <div
      className="legacy-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Edit trooper"
    >
      <div className="legacy-modal__panel legacy-modal__panel--edit">
        <header className="legacy-modal__header">
          <div className="legacy-editor-intro">
            <span className="panel-kicker">Trooper File</span>
            <h2>{trooper.name || trooper.isc || "Trooper"}</h2>
            <p>Adjust XP, perk points, and loadout.</p>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <AppIcon name="close" />
          </button>
        </header>

        <div className="legacy-editor-header">
          <div className="legacy-level-chip">Level {level}</div>
          <Field label="XP">
            <input
              type="number"
              min="0"
              value={trooper.xp || 0}
              onChange={(event) =>
                setTrooper((current: any) => ({
                  ...current,
                  xp: Number(event.target.value) || 0,
                }))
              }
            />
          </Field>
          <Field label="Available Perk Points">
            <input
              type="number"
              min="0"
              value={trooper.perkPoints ?? 0}
              onChange={(event) =>
                setTrooper((current: any) => ({
                  ...current,
                  perkPoints: Number(event.target.value) || 0,
                }))
              }
            />
          </Field>
          <div className="legacy-xp-progress" aria-live="polite">
            <div className="legacy-xp-progress__meta">
              <span className="panel-kicker">Level Progress</span>
              <strong>{Math.round(progress)}%</strong>
              <small>
                {xpToNextLevel} XP to Level {level + 1}
              </small>
            </div>
            <div
              className="legacy-xp-bar"
              title={`${xpToNextLevel} XP needed for next level`}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="legacy-tabs" role="tablist">
          <button
            className={selectedTab === "equipment" ? "is-active" : ""}
            type="button"
            onClick={() => setSelectedTab("equipment")}
          >
            Equipment
          </button>
          <button
            className={selectedTab === "perks" ? "is-active" : ""}
            type="button"
            onClick={() => setSelectedTab("perks")}
          >
            Perks
          </button>
        </div>

        <div className="legacy-editor-body">
          {selectedTab === "equipment" ? (
            <div className="legacy-paperdoll-editor">
              <section
                className="legacy-paperdoll-stage"
                aria-label="Equipment slots"
              >
                <img src={silhouetteImage} alt="" aria-hidden="true" />
                {EQUIPMENT_SLOTS.map((slot) => {
                  const equipped = trooper[slot] as
                    | MetadataItem
                    | null
                    | undefined;
                  return (
                    <button
                      className={`legacy-paperdoll-slot legacy-paperdoll-slot--${slot}${selectedSlot === slot ? " is-selected" : ""}${equipped ? " is-equipped" : ""}`}
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <span>{getShopSlotLabel(slot)}</span>
                      <strong>
                        {equipped ? getInventoryItemName(equipped) : "Empty"}
                      </strong>
                    </button>
                  );
                })}
              </section>

              <aside className="legacy-slot-editor">
                <header>
                  <span className="panel-kicker">Selected Slot</span>
                  <h3>{getShopSlotLabel(selectedSlot)}</h3>
                  <p>
                    {selectedEquippedItem
                      ? getInventoryItemName(selectedEquippedItem)
                      : "No item equipped."}
                  </p>
                </header>

                <div
                  className="legacy-slot-tabs"
                  role="list"
                  aria-label="Equipment slots"
                >
                  {EQUIPMENT_SLOTS.map((slot) => (
                    <button
                      className={selectedSlot === slot ? "is-active" : ""}
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {getShopSlotLabel(slot)}
                    </button>
                  ))}
                </div>

                {selectedEquippedItem && (
                  <button
                    className="legacy-slot-unequip"
                    type="button"
                    onClick={() => handleEquipmentChange(selectedSlot, "")}
                  >
                    Unequip {getInventoryItemName(selectedEquippedItem)}
                  </button>
                )}

                <div className="legacy-slot-inventory">
                  <h4>Available Items</h4>
                  {selectedSlotItems.map((item) => (
                    <button
                      className="legacy-slot-item"
                      type="button"
                      key={String(item.uuid || item.id)}
                      onClick={() =>
                        handleEquipmentChange(selectedSlot, String(item.uuid))
                      }
                    >
                      <span>{getInventoryItemName(item)}</span>
                      <small>
                        {getShopSlotLabel(getInventoryItemSlot(item))}
                      </small>
                    </button>
                  ))}
                  {selectedSlotItems.length === 0 && (
                    <p className="empty-note">No stored items fit this slot.</p>
                  )}
                </div>
              </aside>
            </div>
          ) : (
            <VisualPerkTree trooper={trooper} setTrooper={setTrooper} />
          )}
        </div>

        <footer className="legacy-modal__actions">
          <button className="command-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="command-button command-button--primary"
            type="button"
            onClick={() => {
              const cleanedTrooper = { ...trooper };
              EQUIPMENT_SLOTS.forEach((slot) => {
                if (cleanedTrooper[slot] === undefined)
                  cleanedTrooper[slot] = null;
              });
              saveChanges(cleanedTrooper, inventory);
            }}
          >
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
}

function ShopExchangeDialog({
  companyItems,
  merchantItems,
  companyCredits,
  onClose,
  onConfirmExchange,
}: {
  companyItems: MetadataItem[];
  merchantItems: MetadataItem[];
  companyCredits: number;
  onClose: () => void;
  onConfirmExchange: (inventory: MetadataItem[], credits: number) => void;
}) {
  const [availableCompanyItems, setAvailableCompanyItems] = useState<
    MetadataItem[]
  >(() => structuredClone(companyItems || []));
  const [availableMerchantItems, setAvailableMerchantItems] = useState<
    MetadataItem[]
  >(() => structuredClone(merchantItems || []));
  const [stagedCompany, setStagedCompany] = useState<MetadataItem[]>([]);
  const [stagedMerchant, setStagedMerchant] = useState<MetadataItem[]>([]);

  const sellTotal = stagedCompany.reduce(
    (total, item) => total + Number(item.cr || 0),
    0,
  );
  const buyTotal = stagedMerchant.reduce(
    (total, item) => total + Number(item.cr || 0),
    0,
  );
  const netExchange = sellTotal - buyTotal;
  const nextCredits = companyCredits + netExchange;
  const insufficientFunds = nextCredits < 0;

  function stageCompanyItem(item: MetadataItem) {
    setStagedCompany((current) => [...current, item]);
    setAvailableCompanyItems((current) =>
      current.filter((candidate) => candidate.uuid !== item.uuid),
    );
  }

  function stageMerchantItem(item: MetadataItem) {
    setStagedMerchant((current) => [...current, item]);
    setAvailableMerchantItems((current) =>
      current.filter((candidate) => candidate.uuid !== item.uuid),
    );
  }

  function unstageCompanyItem(item: MetadataItem) {
    setAvailableCompanyItems((current) => [...current, item]);
    setStagedCompany((current) =>
      current.filter((candidate) => candidate.uuid !== item.uuid),
    );
  }

  function unstageMerchantItem(item: MetadataItem) {
    setAvailableMerchantItems((current) => [...current, item]);
    setStagedMerchant((current) =>
      current.filter((candidate) => candidate.uuid !== item.uuid),
    );
  }

  function confirmExchange() {
    if (
      insufficientFunds ||
      (stagedCompany.length === 0 && stagedMerchant.length === 0)
    )
      return;
    onConfirmExchange(
      [...availableCompanyItems, ...stagedMerchant],
      nextCredits,
    );
    onClose();
  }

  return (
    <div
      className="legacy-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Shop and inventory"
    >
      <div className="legacy-modal__panel legacy-modal__panel--shop">
        <header className="legacy-modal__header">
          <div>
            <span className="panel-kicker">Static Market</span>
            <h2>Shop & Inventory</h2>
            <p>
              Buy from the base market, sell company inventory, and confirm the
              exchange when the credit balance works.
            </p>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <AppIcon name="close" />
          </button>
        </header>

        <div className="legacy-shop-layout">
          <ShopInventoryColumn
            title="Company Items"
            items={availableCompanyItems}
            emptyText="No company inventory."
            onItemClick={stageCompanyItem}
            variant="company"
          />

          <section className="legacy-shop-staging">
            <h3>Staged Exchange</h3>
            <div className="legacy-shop-balance">
              <span>Current</span>
              <strong>{companyCredits} CR</strong>
              <span>Net</span>
              <strong
                className={netExchange < 0 ? "is-negative" : "is-positive"}
              >
                {netExchange > 0 ? `+${netExchange}` : netExchange} CR
              </strong>
              <span>After</span>
              <strong className={insufficientFunds ? "is-negative" : ""}>
                {nextCredits} CR
              </strong>
            </div>
            {insufficientFunds && (
              <p className="legacy-shop-warning">
                Insufficient credits for this exchange.
              </p>
            )}

            <div className="legacy-staged-grid">
              <StagedItems
                title="Selling"
                items={stagedCompany}
                onItemClick={unstageCompanyItem}
              />
              <StagedItems
                title="Buying"
                items={stagedMerchant}
                onItemClick={unstageMerchantItem}
              />
            </div>
          </section>

          <ShopInventoryColumn
            title="Merchant Items"
            items={availableMerchantItems}
            emptyText="No merchant items."
            onItemClick={stageMerchantItem}
            variant="merchant"
          />
        </div>

        <footer className="legacy-modal__actions">
          <button className="command-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="command-button command-button--primary"
            type="button"
            disabled={
              insufficientFunds ||
              (stagedCompany.length === 0 && stagedMerchant.length === 0)
            }
            onClick={confirmExchange}
          >
            Confirm Exchange
          </button>
        </footer>
      </div>
    </div>
  );
}

function ShopInventoryColumn({
  title,
  items,
  emptyText,
  onItemClick,
  variant,
}: {
  title: string;
  items: MetadataItem[];
  emptyText: string;
  onItemClick: (item: MetadataItem) => void;
  variant?: "company" | "merchant";
}) {
  const grouped = groupShopItems(items);
  const slots = [
    "primary",
    "secondary",
    "sidearm",
    "accessory",
    "role",
    "armor",
    "augment",
    "other",
  ];
  return (
    <section
      className={`legacy-shop-column${variant ? ` legacy-shop-column--${variant}` : ""}`}
    >
      <h3>{title}</h3>
      {items.length === 0 && <p className="empty-note">{emptyText}</p>}
      {slots.map((slot) =>
        grouped[slot]?.length ? (
          <div className="legacy-shop-group" key={`${title}-${slot}`}>
            <h4>{getShopSlotLabel(slot)}</h4>
            <div className="legacy-shop-items">
              {grouped[slot].map((item) => (
                <ShopItemButton
                  item={item}
                  key={String(item.uuid || item.id)}
                  onClick={onItemClick}
                />
              ))}
            </div>
          </div>
        ) : null,
      )}
    </section>
  );
}

function StagedItems({
  title,
  items,
  onItemClick,
}: {
  title: string;
  items: MetadataItem[];
  onItemClick: (item: MetadataItem) => void;
}) {
  return (
    <div className="legacy-staged-items">
      <h4>{title}</h4>
      {items.map((item) => (
        <ShopItemButton
          item={item}
          key={String(item.uuid || item.id)}
          onClick={onItemClick}
        />
      ))}
      {items.length === 0 && <p className="empty-note">Nothing staged.</p>}
    </div>
  );
}

function ShopItemButton({
  item,
  onClick,
}: {
  item: MetadataItem;
  onClick: (item: MetadataItem) => void;
}) {
  const visual = getShopItemVisualMeta(item);
  return (
    <button
      className="legacy-shop-item"
      type="button"
      onClick={() => onClick(item)}
    >
      <div className="legacy-shop-item__body">
        <span className="legacy-shop-item__kicker">{visual.kicker}</span>
        <strong className="legacy-shop-item__title">
          {getInventoryItemName(item)}
        </strong>
        {visual.detail && <p>{visual.detail}</p>}
        {visual.note && <small>{visual.note}</small>}
        {visual.chips.length > 0 && (
          <div className="legacy-shop-item__chips">
            {visual.chips.map((chip) => (
              <span key={`${String(item.id)}-${chip}`}>{chip}</span>
            ))}
          </div>
        )}
      </div>
      <span className="legacy-shop-item__price">{Number(item.cr || 0)} CR</span>
    </button>
  );
}

function groupShopItems(items: MetadataItem[]): Record<string, MetadataItem[]> {
  const grouped: Record<string, MetadataItem[]> = {};
  items.forEach((item) => {
    const slot = getInventoryItemSlot(item) || "other";
    grouped[slot] = grouped[slot] || [];
    grouped[slot].push(item);
  });
  return grouped;
}

function VisualPerkTree({
  trooper,
  setTrooper,
}: {
  trooper: any;
  setTrooper: React.Dispatch<React.SetStateAction<any>>;
}) {
  const allPerkTrees = perkTrees;
  const [selectedTree, setSelectedTree] = useState<string | null>(null);
  const perkTreeIconByName: Record<string, AppIconName> = {
    Initiative: "target",
    Cool: "rank4",
    Body: "rank5",
    Reflex: "rank6",
    Intelligence: "info",
    Empathy: "troopers",
  };
  const getTreeIconName = (treeName: string): AppIconName =>
    perkTreeIconByName[treeName] || "target";
  const tree =
    allPerkTrees.find((candidate) => candidate.name === selectedTree) ||
    allPerkTrees[0];
  const rolls = [...new Set(tree.perks.map((perk) => perk.roll))].sort(
    (a, b) => rollSortValue(a) - rollSortValue(b),
  );
  const perkPoints = Number(trooper.perkPoints || 0);
  const level = calculateLevel(trooper.xp);
  const perkCountsByTree = useMemo(() => {
    const counts = Object.fromEntries(
      allPerkTrees.map((candidate) => [candidate.name, 0]),
    ) as Record<string, number>;

    (trooper.perks || []).forEach((selected: any) => {
      const selectedTreeName = String(selected.tree || "");
      if (selectedTreeName in counts) {
        counts[selectedTreeName] += 1;
        return;
      }

      const selectedName = String(selected.name || "").toLowerCase();
      const matchedTree = allPerkTrees.find((candidate) =>
        candidate.perks.some((candidatePerk) => {
          const candidateName = candidatePerk.detail
            ? `${candidatePerk.name} (${candidatePerk.detail})`
            : candidatePerk.name;
          return candidateName.toLowerCase() === selectedName;
        }),
      );

      if (matchedTree) counts[matchedTree.name] += 1;
    });

    return counts;
  }, [allPerkTrees, trooper.perks]);

  const treeProgramStats = useMemo(
    () =>
      allPerkTrees.map((candidate) => {
        const allocated = perkCountsByTree[candidate.name] || 0;
        const total = candidate.perks.length || 1;
        const completion = Math.min(100, Math.round((allocated / total) * 100));
        return {
          candidate,
          allocated,
          total,
          completion,
        };
      }),
    [allPerkTrees, perkCountsByTree],
  );

  function togglePerk(perk: Perk) {
    const referencePerk = makeReferencePerk(tree.name, perk);
    if (isPerkSelected(trooper, referencePerk)) return;
    if (perkPoints <= 0) return;
    if (level < perk.tier) return;
    const requirements = perk.requires || [];
    if (requirements.length > 0) {
      const selectedNames = new Set(
        (trooper.perks || []).map((selected: any) =>
          String(selected.name || "").toLowerCase(),
        ),
      );
      const hasRequirement = requirements.some((requirement) =>
        selectedNames.has(requirement.toLowerCase()),
      );
      if (!hasRequirement) return;
    }

    setTrooper((current: any) => ({
      ...current,
      perkPoints: Math.max(0, Number(current.perkPoints || 0) - 1),
      perks: [...(current.perks || []), referencePerk],
    }));
  }

  return (
    <div className="legacy-perk-tree-editor">
      {!selectedTree ? (
        <div className="legacy-perk-selection-view">
          <header className="legacy-perk-program-header">
            <span className="panel-kicker">Program Matrix</span>
            <h3>Select a perk program to install</h3>
            <p>
              Each tree is themed as a tactical software package for your
              trooper. Pick one to open its module lanes.
            </p>
          </header>

          <div
            className="legacy-perk-program-grid"
            role="list"
            aria-label="Perk tree selection"
          >
            {treeProgramStats.map(
              ({ candidate, allocated, total, completion }) => (
                <button
                  className="legacy-perk-program-card"
                  key={candidate.name}
                  type="button"
                  onClick={() => setSelectedTree(candidate.name)}
                >
                  <div className="legacy-perk-program-card__head">
                    <span className="legacy-perk-program-icon">
                      <AppIcon
                        name={getTreeIconName(candidate.name)}
                        size={16}
                      />
                    </span>
                    <div>
                      <strong>{candidate.name}</strong>
                      <small>{candidate.roll}</small>
                    </div>
                  </div>
                  <p>{candidate.summary}</p>
                  <div className="legacy-perk-program-metrics">
                    <span>Installed {allocated}</span>
                    <span>Total {total}</span>
                  </div>
                  <div
                    className="legacy-perk-program-progress"
                    aria-hidden="true"
                  >
                    <div
                      style={{ width: `${completion}%` } as React.CSSProperties}
                    />
                  </div>
                </button>
              ),
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="legacy-perk-toolbar">
            <div>
              <span className="panel-kicker">Program Slots</span>
              <strong>{perkPoints} Available</strong>
            </div>
            <div className="legacy-perk-toolbar__status">
              <span>Trooper Level</span>
              <strong>{level}</strong>
            </div>
          </div>

          <div className="legacy-perk-tree-heading">
            <button
              className="command-button command-button--small"
              type="button"
              onClick={() => setSelectedTree(null)}
            >
              <AppIcon name="back" size={14} />
              Back to program matrix
            </button>
            <div className="legacy-perk-tree-heading__meta">
              <AppIcon name={getTreeIconName(tree.name)} size={16} />
              <strong>{tree.name}</strong>
              <small>{tree.roll}</small>
            </div>
          </div>

          <div
            className="legacy-perk-grid"
            style={{ "--perk-columns": 5 } as React.CSSProperties}
          >
            <div className="legacy-perk-corner">Roll</div>
            {[1, 2, 3, 4, 5].map((tier) => (
              <div
                className="legacy-perk-tier-head"
                key={`${tree.name}-tier-head-${tier}`}
              >
                <span>Tier</span>
                {tier}
              </div>
            ))}

            {rolls.map((roll) => (
              <Fragment key={`${tree.name}-roll-row-${roll}`}>
                <div className="legacy-perk-roll">{roll}</div>
                {[1, 2, 3, 4, 5].map((tier) => {
                  const perks = tree.perks.filter(
                    (perk) => perk.tier === tier && perk.roll === roll,
                  );
                  return (
                    <div
                      className="legacy-perk-cell"
                      key={`${tree.name}-${roll}-${tier}`}
                    >
                      {perks.map((perk) => {
                        const referencePerk = makeReferencePerk(
                          tree.name,
                          perk,
                        );
                        const selected = isPerkSelected(trooper, referencePerk);
                        const locked =
                          !selected && (perkPoints <= 0 || level < perk.tier);
                        return (
                          <button
                            className={`legacy-perk-node${selected ? " is-selected" : ""}${locked ? " is-locked" : ""}`}
                            key={String(referencePerk.id)}
                            type="button"
                            onClick={() => togglePerk(perk)}
                          >
                            <strong>{perk.name}</strong>
                            {perk.detail && <small>{perk.detail}</small>}
                            {perk.requires?.length ? (
                              <em>Dependencies: {perk.requires.join(", ")}</em>
                            ) : (
                              <em>Ready to install</em>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function rollSortValue(roll: string): number {
  const match = roll.match(/\d+/);
  return match ? Number(match[0]) : 999;
}

const TAG_COMPANY_SPECIAL_PROFILE_ID = "tag-company-special-profile";

function AddTrooperDialog({
  open,
  onClose,
  company,
  onAddTrooper,
}: {
  open: boolean;
  onClose: () => void;
  company: LocalCompany;
  onAddTrooper: (trooper: any) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [specops, setSpecops] = useState<SpecopsPool>({
    equip: [],
    skills: [],
    weapons: [],
  });
  const [loading, setLoading] = useState(false);
  const [captainDraft, setCaptainDraft] = useState<CaptainDraft | null>(null);
  const isCreatingCaptain = !(company.troopers || []).length;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCaptainDraft(null);
    const slugs = [company.sectorial1?.slug, company.sectorial2?.slug].filter(
      Boolean,
    ) as string[];
    setLoading(true);
    loadRecruitmentPool(slugs)
      .then((pool) => {
        if (cancelled) return;
        setUnits(pool.units);
        setSpecops(pool.specops);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [company.sectorial1?.slug, company.sectorial2?.slug, open]);

  const filteredUnits = useMemo(() => {
    const recruitable = getRecruitableUnits(units, isCreatingCaptain, {
      companyTypeId: String(company.companyTypeId || ""),
      existingTroopers: (company.troopers || []) as any[],
    });
    return searchRecruitableUnits(recruitable, searchTerm);
  }, [
    company.companyTypeId,
    company.troopers,
    isCreatingCaptain,
    searchTerm,
    units,
  ]);

  if (!open) return null;

  return (
    <div
      className="legacy-modal"
      role="dialog"
      aria-modal="true"
      aria-label={isCreatingCaptain ? "Create Captain" : "Add Trooper"}
    >
      <div className="legacy-modal__panel legacy-modal__panel--recruit">
        <header className="legacy-modal__header">
          <div>
            <span className="panel-kicker">
              {isCreatingCaptain ? "Create Captain" : "Select Trooper"}
            </span>
            <h2>{isCreatingCaptain ? "Create Captain" : "Add Trooper"}</h2>
            <p>
              This follows the original recruitment filter: allowed SWC only,
              Lieutenant or Infinity Spec-Ops profiles for Captains, and no
              named characters.
            </p>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <AppIcon name="close" />
          </button>
        </header>

        <div className="legacy-modal__tools">
          {!captainDraft && (
            <div className="legacy-recruit-tools">
              <Field label="Filter by ISC">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search units"
                />
              </Field>
              <div className="legacy-recruit-results" aria-live="polite">
                <strong>{loading ? "..." : filteredUnits.length}</strong>
                <span>
                  {loading
                    ? "Loading"
                    : filteredUnits.length === 1
                      ? "Match"
                      : "Matches"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="legacy-unit-picker">
          {captainDraft ? (
            <SpecOpsConfigurator
              draft={captainDraft}
              specops={specops}
              onBack={() => setCaptainDraft(null)}
              onConfirm={(trooper) => {
                onAddTrooper(flattenTrooperForRoster(trooper));
                onClose();
              }}
            />
          ) : (
            <>
              {loading && (
                <p className="empty-note">Loading faction profiles...</p>
              )}
              {!loading &&
                filteredUnits.map((unit) => (
                  <RecruitableUnit
                    key={`${unit.slug}-${unit.id}`}
                    unit={unit}
                    isCreatingCaptain={isCreatingCaptain}
                    specops={specops}
                    onAdd={(group, option) => {
                      const cleanedUnit = cleanUnitForRoster(
                        unit,
                        group,
                        option,
                        isCreatingCaptain,
                      );
                      if (isCreatingCaptain) {
                        const xpBudget = getCaptainSpecOpsXpBudget(
                          cleanedUnit,
                          unit,
                        );
                        if (xpBudget > 0) {
                          setCaptainDraft({
                            unit,
                            group,
                            option,
                            trooper: cleanedUnit,
                            xp: xpBudget,
                            baseProfile: structuredClone(
                              cleanedUnit.profileGroups[0].profiles[0],
                            ),
                          });
                          return;
                        }
                      }
                      onAddTrooper(flattenTrooperForRoster(cleanedUnit));
                      onClose();
                    }}
                  />
                ))}
              {!loading && filteredUnits.length === 0 && (
                <p className="empty-note">
                  No matching profiles. Choose sectorials or adjust the filter.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CompanyManager() {
  const [companies, setCompanies] = useState<LocalCompany[]>([]);
  const [company, setCompany] = useState<LocalCompany | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<SectionKey, boolean>
  >({ info: true, dashboard: true, troopers: true });
  const [isModified, setIsModified] = useState(false);
  const [addTrooperOpen, setAddTrooperOpen] = useState(false);
  const [editingTrooper, setEditingTrooper] = useState<any | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const requestedId = params.get("id");
        const requestedFileId = params.get("fileId");
        const hasExplicitRequest = Boolean(requestedId || requestedFileId);
        const waitForAuthTick = () =>
          new Promise<void>((resolve) => window.setTimeout(resolve, 250));

        // Load all companies for the list. This may be local-only until auth is ready.
        const allCompanies = await loadAllCompanies();

        // Select the requested company.
        let selectedCompany: LocalCompany | null = null;
        if (requestedId) {
          selectedCompany =
            allCompanies.find((c) => c.id === requestedId) || null;
        } else if (requestedFileId) {
          selectedCompany =
            allCompanies.find((c) => c.shareFileId === requestedFileId) || null;
          if (!selectedCompany) {
            restorePersistedAuthState();
            selectedCompany = await loadCompany(requestedFileId);
          }

          // If auth is still initializing, briefly wait and retry direct file load.
          if (!selectedCompany && !getGoogleSignedIn()) {
            for (let attempt = 0; attempt < 8; attempt += 1) {
              if (!alive) break;
              await waitForAuthTick();
              if (restorePersistedAuthState() || getGoogleSignedIn()) {
                selectedCompany = await loadCompany(requestedFileId);
                if (selectedCompany) break;
              }
            }
          }
        }
        // Only default to the first company when no explicit route param is provided.
        if (!selectedCompany && !hasExplicitRequest) {
          selectedCompany = allCompanies[0] || null;
        }

        if (alive) {
          setCompanies(allCompanies);
          setCompany(
            selectedCompany ? normalizeCompany(selectedCompany) : null,
          );
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to load companies:", error);
        if (alive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const troopers = (company?.troopers || []) as any[];
  const canEditSectorials = troopers.length === 0;
  const totalRenown = useMemo(
    () =>
      troopers.reduce((total, trooper) => total + getTrooperPoints(trooper), 0),
    [troopers],
  );
  const totalSwc = useMemo(
    () =>
      troopers.reduce(
        (total, trooper) => total + numberValue(getTrooperSwc(trooper)),
        0,
      ),
    [troopers],
  );
  const sectorial2Options = getSectorial2Options(company?.sectorial1);
  const merchantItems = useMemo(
    () =>
      ((baseMarket as { items: MetadataItem[] }).items || []).map(
        (item, index) => makeShopItem(item, index),
      ),
    [],
  );

  function normalizeCompany(value: LocalCompany): LocalCompany {
    const driveBacked = Boolean(value.shareFileId || value.shareLink);
    return {
      ...value,
      sectorials: value.sectorials || [],
      inventory: value.inventory || [],
      notoriety: value.notoriety || 0,
      credits: value.credits || 0,
      sponsor: value.sponsor || "",
      troopers: value.troopers || [],
      local: value.local ?? !driveBacked,
    };
  }

  function updateCompany(
    update: (current: LocalCompany) => LocalCompany,
    modified = true,
  ) {
    if (!company) return;
    setCompany(
      normalizeCompany({
        ...update(company),
        updatedAt: new Date().toISOString(),
      }),
    );
    if (modified) setIsModified(true);
  }

  function saveCompany(nextCompany = company) {
    if (!nextCompany || isLoading) return;
    const normalized = normalizeCompany(nextCompany);
    const mappedCompanies = companies.map((item) =>
      item.id === normalized.id || item.shareFileId === normalized.shareFileId
        ? normalized
        : item,
    );
    const exists = mappedCompanies.some(
      (item) =>
        item.id === normalized.id ||
        (item.shareFileId && item.shareFileId === normalized.shareFileId),
    );
    const nextCompanies = exists
      ? mappedCompanies
      : [normalized, ...mappedCompanies];
    setCompanies(nextCompanies);
    setCompany(normalized);

    // Use data layer to save to appropriate backend
    void (async () => {
      try {
        await saveCompanyToLayer(normalized);
        setIsModified(false);
      } catch (error) {
        console.error("Failed to save company:", error);
        // Revert UI state on save failure
        setCompany(company);
        setCompanies(companies);
      }
    })();
  }

  function addTrooper(trooper: any) {
    if (!company) return;
    const existingTroopers = (company.troopers || []) as any[];
    const addingTagSpecialProfile =
      Boolean(trooper?.tagCompanySpecialTag) ||
      trooper?.id === TAG_COMPANY_SPECIAL_PROFILE_ID ||
      trooper?.slug === TAG_COMPANY_SPECIAL_PROFILE_ID;
    const hasTagSpecialProfile = existingTroopers.some(
      (item) =>
        Boolean(item?.tagCompanySpecialTag) ||
        item?.id === TAG_COMPANY_SPECIAL_PROFILE_ID ||
        item?.slug === TAG_COMPANY_SPECIAL_PROFILE_ID,
    );
    if (addingTagSpecialProfile && hasTagSpecialProfile) {
      return;
    }

    const nextTroopers = trooper.captain
      ? existingTroopers.map((item) => ({ ...item, captain: false }))
      : existingTroopers;
    const nextCompany = normalizeCompany({
      ...company,
      troopers: [...nextTroopers, trooper],
      updatedAt: new Date().toISOString(),
    });
    saveCompany(nextCompany);
  }

  function deleteTrooper(trooperId: string) {
    if (!company) return;
    const nextCompany = normalizeCompany({
      ...company,
      troopers: ((company.troopers || []) as any[]).filter(
        (trooper) => trooper.id !== trooperId,
      ),
      updatedAt: new Date().toISOString(),
    });
    saveCompany(nextCompany);
  }

  function saveTrooperChanges(
    updatedTrooper: any,
    updatedInventory: MetadataItem[],
  ) {
    if (!company) return;
    const nextCompany = normalizeCompany({
      ...company,
      inventory: updatedInventory,
      troopers: ((company.troopers || []) as any[]).map((trooper) =>
        trooper.id === updatedTrooper.id ? updatedTrooper : trooper,
      ),
      updatedAt: new Date().toISOString(),
    });
    saveCompany(nextCompany);
    setEditingTrooper(null);
  }

  function saveInventoryAndCredits(inventory: MetadataItem[], credits: number) {
    if (!company) return;
    const nextCompany = normalizeCompany({
      ...company,
      inventory,
      credits,
      updatedAt: new Date().toISOString(),
    });
    saveCompany(nextCompany);
  }

  if (isLoading) {
    return (
      <section className="company-manager legacy-company-page">
        <div className="company-empty-state">
          <span className="panel-kicker">Loading</span>
          <h1>Opening Company...</h1>
        </div>
      </section>
    );
  }

  if (!company) {
    const requestedFileId =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("fileId")
        : null;

    return (
      <section className="company-manager legacy-company-page">
        <div className="company-empty-state">
          <span className="panel-kicker">No Company Selected</span>
          <h1>Open a Company</h1>
          <p>
            {requestedFileId
              ? "Could not load this Drive company yet. Make sure you are signed in and still have access to the file."
              : "This page needs a company id from the company list."}
          </p>
          <a
            className="command-button command-button--primary"
            href="/companies/"
          >
            Back to Companies
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      className="company-manager legacy-company-page"
      aria-label="Company manager"
    >
      <div className="legacy-company-header">
        <a
          className="icon-button legacy-back-button"
          href="/companies/"
          aria-label="Back to companies"
        >
          <AppIcon name="back" />
        </a>
        <div className="legacy-company-title-block">
          <span className="panel-kicker">Company Dossier</span>
          <h1>{company.name || "Company"}</h1>
          <div className="legacy-company-meta">
            <span className="legacy-storage-chip">
              {isCompanyDriveBacked(company)
                ? "Drive-backed Company"
                : "Local Company"}
            </span>
            <span>{troopers.length} troopers</span>
            <span>{totalRenown} renown</span>
          </div>
        </div>
        <div className="legacy-company-actions">
          <button
            className="command-button command-button--primary"
            type="button"
            onClick={() => saveCompany()}
            disabled={!isModified}
          >
            {isModified ? "Save Changes" : "Saved"}
          </button>
        </div>
      </div>

      <LegacyAccordion
        id="company-info"
        title="Company Info"
        icon={<AppIcon name="info" size={18} />}
        expanded={expandedSections.info}
        onToggle={() =>
          setExpandedSections((sections) => ({
            ...sections,
            info: !sections.info,
          }))
        }
      >
        <div className="legacy-info-grid">
          <section className="legacy-info-panel legacy-info-panel--identity">
            <header>
              <span>Identity</span>
              <strong>Company Record</strong>
            </header>
            <div className="legacy-form-grid">
              <Field label="Company Name">
                <input
                  value={company.name || ""}
                  onChange={(event) =>
                    updateCompany((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Sponsor">
                <input
                  value={company.sponsor || ""}
                  onChange={(event) =>
                    updateCompany((current) => ({
                      ...current,
                      sponsor: event.target.value,
                    }))
                  }
                  placeholder="None"
                />
              </Field>
            </div>
            <Field label="Company Description">
              <textarea
                value={company.description || ""}
                rows={4}
                onChange={(event) =>
                  updateCompany((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Enter details about your company, its history, notable achievements, or future goals..."
              />
            </Field>
          </section>

          <section className="legacy-info-panel">
            <header>
              <span>Contacts</span>
              <strong>Sectorials</strong>
            </header>
            <div className="legacy-form-grid">
              <Field label="Sectorial 1">
                {canEditSectorials ? (
                  <select
                    value={company.sectorial1?.id || ""}
                    onChange={(event) => {
                      const selectedFaction = findFactionById(
                        event.target.value,
                      );
                      updateCompany((current) =>
                        updateCompanySectorials(
                          current,
                          selectedFaction,
                          selectedFaction?.id === selectedFaction?.parent
                            ? null
                            : current.sectorial2 || null,
                        ),
                      );
                    }}
                  >
                    <option value="">Select Sectorial 1</option>
                    {factionList.map((faction) => (
                      <option key={faction.id} value={faction.id}>
                        {faction.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="legacy-faction-static">
                    {company.sectorial1 ? (
                      <FactionOption faction={company.sectorial1} />
                    ) : (
                      "None selected"
                    )}
                  </div>
                )}
              </Field>
              <Field label="Sectorial 2">
                {canEditSectorials ? (
                  <select
                    value={company.sectorial2?.id || ""}
                    disabled={
                      !company.sectorial1 ||
                      company.sectorial1.id === company.sectorial1.parent
                    }
                    onChange={(event) =>
                      updateCompany((current) =>
                        updateCompanySectorials(
                          current,
                          current.sectorial1 || null,
                          findFactionById(event.target.value),
                        ),
                      )
                    }
                  >
                    <option value="">None</option>
                    {sectorial2Options.map((faction) => (
                      <option key={faction.id} value={faction.id}>
                        {faction.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="legacy-faction-static">
                    {company.sectorial2 ? (
                      <FactionOption faction={company.sectorial2} />
                    ) : (
                      "None selected"
                    )}
                  </div>
                )}
              </Field>
            </div>
            {!canEditSectorials && (
              <p className="legacy-alert">
                Sectorials are locked after the first trooper joins the company.
              </p>
            )}
          </section>
        </div>
      </LegacyAccordion>

      <LegacyAccordion
        id="company-dashboard"
        title="Dashboard"
        icon={<AppIcon name="dashboard" size={18} />}
        expanded={expandedSections.dashboard}
        onToggle={() =>
          setExpandedSections((sections) => ({
            ...sections,
            dashboard: !sections.dashboard,
          }))
        }
      >
        <div className="legacy-dashboard-grid">
          <DashboardCard
            label="Credits"
            icon="CR"
            value={
              <input
                aria-label="Credits"
                type="number"
                value={company.credits || 0}
                onChange={(event) =>
                  updateCompany((current) => ({
                    ...current,
                    credits: Number(event.target.value) || 0,
                  }))
                }
              />
            }
            hint="Available funds"
          />
          <DashboardCard
            label="Notoriety"
            icon="NT"
            value={company.notoriety || 0}
            hint="Market reputation"
          />
          <DashboardCard
            label="Total Renown"
            icon="RN"
            value={company.renown || totalRenown}
            hint="Company strength"
          />
          <DashboardCard
            label="Roster SWC"
            icon="SW"
            value={totalSwc}
            hint="Current roster"
          />
        </div>
        <div className="legacy-operation-strip">
          <div>
            <span className="panel-kicker">Inventory</span>
            <strong>{(company.inventory || []).length} stored items</strong>
          </div>
          <button
            className="command-button"
            type="button"
            onClick={() => setShopOpen(true)}
          >
            Open Shop & Inventory
          </button>
        </div>
      </LegacyAccordion>

      <LegacyAccordion
        id="company-troopers"
        title="Troopers"
        icon={<AppIcon name="troopers" size={18} />}
        expanded={expandedSections.troopers}
        onToggle={() =>
          setExpandedSections((sections) => ({
            ...sections,
            troopers: !sections.troopers,
          }))
        }
        action={
          <button
            className="command-button command-button--small"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setAddTrooperOpen(true);
            }}
          >
            {troopers.length === 0 ? "Create Captain" : "Add Trooper"}
          </button>
        }
      >
        <div className="legacy-trooper-list">
          {troopers.map((trooper) => (
            <TrooperCard
              key={trooper.id}
              trooper={trooper}
              onEdit={() => setEditingTrooper(trooper)}
              onDelete={() => deleteTrooper(trooper.id)}
            />
          ))}
          {troopers.length === 0 && (
            <p className="empty-note">
              No troopers found. Add a captain to get started.
            </p>
          )}
        </div>
      </LegacyAccordion>

      <AddTrooperDialog
        open={addTrooperOpen}
        onClose={() => setAddTrooperOpen(false)}
        company={company}
        onAddTrooper={addTrooper}
      />
      {editingTrooper && (
        <EditTrooperDialog
          trooperToEdit={editingTrooper}
          companyInventory={(company.inventory || []) as MetadataItem[]}
          onClose={() => setEditingTrooper(null)}
          saveChanges={saveTrooperChanges}
        />
      )}
      {shopOpen && (
        <ShopExchangeDialog
          companyItems={(company.inventory || []) as MetadataItem[]}
          merchantItems={merchantItems}
          companyCredits={Number(company.credits || 0)}
          onClose={() => setShopOpen(false)}
          onConfirmExchange={saveInventoryAndCredits}
        />
      )}
    </section>
  );
}

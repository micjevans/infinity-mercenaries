import { useEffect, useMemo, useState } from "react";
import type React from "react";
import {
  deleteLocalCompany,
  loadLocalCompanies,
  saveLocalCompanies,
  updateCompanySectorials,
  type LocalCompany,
} from "../lib/mercs/companyStore";
import { perkTrees, type Perk } from "../data/perks";
import baseMarket from "../data/infinity/markets/baseMarket.json";
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
import type {
  FactionMetadata,
  MetadataItem,
  Profile,
  ProfileGroup,
  ProfileOption,
  Unit,
} from "../lib/mercs/types";
import { AppIcon } from "./AppIcon";
import { UnitProfileDisplay } from "./UnifiedProfileCard";

type SectionKey = "info" | "dashboard" | "troopers";
type SpecopsPool = {
  equip: MetadataItem[];
  skills: MetadataItem[];
  weapons: MetadataItem[];
};
type CaptainDraft = {
  unit: Unit;
  group: ProfileGroup;
  option: ProfileOption;
  trooper: any;
  xp: number;
  baseProfile: Profile;
};

const EQUIPMENT_SLOTS = [
  "primary",
  "secondary",
  "sidearm",
  "accessory",
  "augment",
  "armor",
] as const;

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `trooper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

function numberValue(value: unknown): number {
  const parsed = Number(String(value ?? "0").replace("+", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPrimaryOption(trooper: any): any {
  return trooper?.profileGroups?.[0]?.options?.[0] || {};
}

function getTrooperPoints(trooper: any): number {
  return Number(getPrimaryOption(trooper).points ?? trooper.points ?? 0);
}

function getTrooperSwc(trooper: any): string {
  return String(getPrimaryOption(trooper).swc ?? trooper.swc ?? "0");
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

function applyItemToTrooper(trooperDraft: any, item: any, type?: string): any {
  if (!trooperDraft || !item) return trooperDraft;
  const profile = trooperDraft.profileGroups?.[0]?.profiles?.[0];
  if (!profile) return trooperDraft;

  if (type) {
    if (
      ["move", "cc", "bs", "wip", "ph", "arm", "bts", "w", "s"].includes(type)
    ) {
      if (type === "move") {
        profile.move = (profile.move || [0, 0]).map(
          (movVal: number, movIndex: number) =>
            (movVal < 0 ? 0 : movVal) + item.extra[movIndex],
        );
      } else {
        profile[type] = Number(profile[type] || 0) + Number(item.extra || 0);
      }
    } else if (type === "type") {
      trooperDraft.resume.type = item.id;
    } else {
      const normalizedType =
        type === "equips"
          ? "equip"
          : type === "peripherals"
            ? "peripheral"
            : type;
      profile[normalizedType] = profile[normalizedType] || [];
      const foundIndex = profile[normalizedType].findIndex(
        (profileItem: MetadataItem) => profileItem.id === item.id,
      );
      if (foundIndex >= 0) {
        profile[normalizedType][foundIndex].extra = [
          ...(profile[normalizedType][foundIndex].extra || []),
          ...(item.extra || []),
        ];
      } else {
        profile[normalizedType].push({ id: item.id, extra: item.extra });
      }
    }
  }

  [
    "equips",
    "weapons",
    "skills",
    "peripherals",
    "move",
    "cc",
    "bs",
    "wip",
    "ph",
    "arm",
    "bts",
    "w",
    "s",
  ].forEach((key) => {
    const nested = item[key];
    if (!nested) return;
    (Array.isArray(nested) ? nested : [nested]).forEach((subItem) =>
      applyItemToTrooper(trooperDraft, subItem, key),
    );
  });

  return trooperDraft;
}

function renderCombinedDetails(trooper: any): any {
  let renderedTrooper = structuredClone(trooper);
  EQUIPMENT_SLOTS.forEach((slot) => {
    if (trooper[slot])
      renderedTrooper = applyItemToTrooper(
        renderedTrooper,
        trooper[slot],
        trooper[slot].key,
      );
  });
  (trooper.perks || []).forEach((perk: MetadataItem) => {
    renderedTrooper = applyItemToTrooper(
      renderedTrooper,
      perk,
      String(perk.key || ""),
    );
  });
  return renderedTrooper;
}

function cleanUnitForRoster(
  unit: Unit,
  group: ProfileGroup,
  option: ProfileOption,
  captain: boolean,
): any {
  const cleanedUnit = structuredClone({
    ...unit,
    id: makeId(),
    perks: [],
    profileGroups: [
      {
        ...group,
        category: 10,
        profiles: (group.profiles || []).map((profile: Profile) => ({
          ...profile,
          skills: option.skills
            ? [...(profile.skills || []), ...option.skills]
            : profile.skills || [],
          equip: option.equip
            ? [...(profile.equip || []), ...option.equip]
            : profile.equip || [],
          peripheral: option.peripheral
            ? [...(profile.peripheral || []), ...option.peripheral]
            : profile.peripheral || [],
          weapons: option.weapons
            ? [...(profile.weapons || []), ...option.weapons]
            : profile.weapons || [],
        })),
        options: [
          {
            ...option,
            skills: [],
            equip: [],
            peripheral: [],
            weapons: [],
            orders: option.orders?.length
              ? option.orders
              : [{ type: "REGULAR", list: 1, total: 1 }],
          },
        ],
      },
    ],
    local: true,
    captain,
    xp: 0,
  });

  (unit.perks || []).forEach((perk) =>
    applyItemToTrooper(cleanedUnit, perk, String(perk.key || "")),
  );
  return cleanedUnit;
}

function cleanSpecOpsItem(item: MetadataItem, itemType: string): MetadataItem {
  const subItems: Record<string, MetadataItem[]> = {};
  ["weapons", "skills", "equip", "equips", "peripheral", "peripherals"].forEach(
    (key) => {
      const nested = item[key] as MetadataItem[] | undefined;
      if (Array.isArray(nested)) {
        const normalizedKey = key.endsWith("s") ? key : `${key}s`;
        subItems[normalizedKey] = nested.map((subItem) =>
          cleanSpecOpsItem(subItem, normalizedKey),
        );
      }
    },
  );

  return {
    ...subItems,
    id: item.id,
    name: item.name,
    extra: item.extras || item.extra,
    key: itemType,
  };
}

function getSpecOpsItemName(item: MetadataItem, metaKey: string): string {
  return (
    mapItemData({ ...item, key: metaKey })[0]?.name ||
    item.name ||
    String(item.id)
  );
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
        <span className="legacy-accordion__right">
          {action}
          <AppIcon name={expanded ? "up" : "down"} size={17} />
        </span>
      </button>
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
  const type = mapType(renderedTrooper.resume?.type || "");

  return (
    <article
      className={`legacy-trooper-card${trooper.captain ? " is-captain" : ""}`}
    >
      <button
        className="legacy-trooper-summary"
        type="button"
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="legacy-level-badge">
          Lvl {calculateLevel(trooper.xp)}
        </span>
        {trooper.resume?.logo && (
          <img src={trooper.resume.logo} alt="" aria-hidden="true" />
        )}
        <span>
          <strong>{trooper.isc}</strong>
          <small>{trooper.captain ? "Captain" : "Trooper"}</small>
        </span>
        <span className="legacy-trooper-type">{type}</span>
      </button>
      {expanded && (
        <div className="legacy-trooper-details">
          <UnitProfileDisplay
            unit={renderedTrooper}
            profileGroups={renderedTrooper.profileGroups || []}
          />
          <div className="legacy-trooper-actions">
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
          </div>
        </div>
      )}
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

function isPerkSelected(trooper: any, perk: any): boolean {
  return (trooper.perks || []).some(
    (existing: any) => getPerkIdentity(existing) === getPerkIdentity(perk),
  );
}

function makeReferencePerk(treeName: string, perk: Perk): MetadataItem {
  return {
    id: `perk:${treeName}:${perk.tier}:${perk.roll}:${perk.name}:${perk.detail || ""}`,
    name: perk.detail ? `${perk.name} (${perk.detail})` : perk.name,
    key: "perk",
    tree: treeName,
    tier: perk.tier,
    roll: perk.roll,
    requires: perk.requires || [],
  };
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
          <div>
            <span className="panel-kicker">Trooper File</span>
            <h2>{trooper.name || trooper.isc || "Trooper"}</h2>
            <p>
              This keeps the old editor model: XP, perk points, equipment slots,
              and inventory all save back into the company file.
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
          <div
            className="legacy-xp-bar"
            title={`${Math.max(0, nextLevel - Number(trooper.xp || 0))} XP needed for next level`}
          >
            <span style={{ width: `${progress}%` }} />
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
}: {
  title: string;
  items: MetadataItem[];
  emptyText: string;
  onItemClick: (item: MetadataItem) => void;
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
    <section className="legacy-shop-column">
      <h3>{title}</h3>
      {items.length === 0 && <p className="empty-note">{emptyText}</p>}
      {slots.map((slot) =>
        grouped[slot]?.length ? (
          <div className="legacy-shop-group" key={`${title}-${slot}`}>
            <h4>{getShopSlotLabel(slot)}</h4>
            <div className="legacy-shop-items">
              {grouped[slot].map((item) => (
                <button
                  className="legacy-shop-item"
                  type="button"
                  key={String(item.uuid || item.id)}
                  onClick={() => onItemClick(item)}
                >
                  <span>{getInventoryItemName(item)}</span>
                  <strong>{Number(item.cr || 0)} CR</strong>
                </button>
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
        <button
          className="legacy-shop-item"
          type="button"
          key={String(item.uuid || item.id)}
          onClick={() => onItemClick(item)}
        >
          <span>{getInventoryItemName(item)}</span>
          <strong>{Number(item.cr || 0)} CR</strong>
        </button>
      ))}
      {items.length === 0 && <p className="empty-note">Nothing staged.</p>}
    </div>
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
  const [selectedTree, setSelectedTree] = useState(
    perkTrees[0]?.name || "Initiative",
  );
  const tree =
    perkTrees.find((candidate) => candidate.name === selectedTree) ||
    perkTrees[0];
  const rolls = [...new Set(tree.perks.map((perk) => perk.roll))].sort(
    (a, b) => rollSortValue(a) - rollSortValue(b),
  );
  const perkPoints = Number(trooper.perkPoints || 0);
  const level = calculateLevel(trooper.xp);

  function togglePerk(perk: Perk) {
    const referencePerk = makeReferencePerk(tree.name, perk);
    if (isPerkSelected(trooper, referencePerk)) return;
    if (perkPoints <= 0) return;
    if (level < perk.tier) return;
    if ((perk.requires || []).length > 0) {
      const selectedNames = new Set(
        (trooper.perks || []).map((selected: any) =>
          String(selected.name || "").toLowerCase(),
        ),
      );
      const hasRequirement = perk.requires.some((requirement) =>
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
      <div className="legacy-perk-toolbar">
        <div>
          <span className="panel-kicker">Perk Tree</span>
          <strong>{perkPoints} Perk Points</strong>
        </div>
        <select
          value={selectedTree}
          onChange={(event) => setSelectedTree(event.target.value)}
        >
          {perkTrees.map((candidate) => (
            <option key={candidate.name} value={candidate.name}>
              {candidate.name}
            </option>
          ))}
        </select>
      </div>

      <div
        className="legacy-perk-grid"
        style={{ "--perk-columns": rolls.length } as React.CSSProperties}
      >
        <div className="legacy-perk-corner">Tier</div>
        {rolls.map((roll) => (
          <div className="legacy-perk-roll" key={roll}>
            {roll}
          </div>
        ))}

        {[1, 2, 3, 4, 5].map((tier) => (
          <>
            <div className="legacy-perk-tier" key={`${tree.name}-tier-${tier}`}>
              <span>Tier</span>
              {tier}
            </div>
            {rolls.map((roll) => {
              const perks = tree.perks.filter(
                (perk) => perk.tier === tier && perk.roll === roll,
              );
              return (
                <div
                  className="legacy-perk-cell"
                  key={`${tree.name}-${tier}-${roll}`}
                >
                  {perks.map((perk) => {
                    const referencePerk = makeReferencePerk(tree.name, perk);
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
                          <em>Requires {perk.requires.join(", ")}</em>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

function rollSortValue(roll: string): number {
  const match = roll.match(/\d+/);
  return match ? Number(match[0]) : 999;
}

function SpecOpsConfigurator({
  draft,
  specops,
  onBack,
  onConfirm,
}: {
  draft: CaptainDraft;
  specops: SpecopsPool;
  onBack: () => void;
  onConfirm: (trooper: any) => void;
}) {
  const [configuredTrooper, setConfiguredTrooper] = useState(() =>
    structuredClone(draft.trooper),
  );
  const [xpRemaining, setXpRemaining] = useState(draft.xp);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, { val: number; xp: number }>
  >({});
  const [selectedItems, setSelectedItems] = useState<
    Record<string, MetadataItem[]>
  >({ weapons: [], skills: [], equips: [] });
  const baseProfile = draft.baseProfile;
  const useDefaultAttributeChart = useMemo(
    () => shouldUseDefaultSpecOpsAttributeChart(baseProfile, specops),
    [baseProfile, specops],
  );
  const attributeRules = useMemo(
    () => makeDefaultSpecOpsAttributeRules(baseProfile),
    [baseProfile],
  );

  function setProfileValue(key: string, value: unknown) {
    setConfiguredTrooper((current: any) => {
      const next = structuredClone(current);
      next.profileGroups[0].profiles[0][key] = value;
      return next;
    });
  }

  function handleAttribute(attr: string, option: { val: number; xp: number }) {
    const currentXp = selectedAttributes[attr]?.xp || 0;
    const xpChange = currentXp - option.xp;
    if (xpRemaining + xpChange < 0) return;
    setXpRemaining((current) => current + xpChange);
    setSelectedAttributes((current) => ({ ...current, [attr]: option }));
    setProfileValue(attr, option.val);
  }

  function handleItemToggle(
    item: MetadataItem,
    type: "weapons" | "skills" | "equips",
  ) {
    const itemXp = Number(item.exp || 0);
    const currentSelection = selectedItems[type] || [];
    const isSelected = currentSelection.some(
      (selected) => JSON.stringify(selected) === JSON.stringify(item),
    );
    const xpChange = isSelected ? itemXp : -itemXp;
    if (xpRemaining + xpChange < 0) return;

    const nextSelection = isSelected
      ? currentSelection.filter(
          (selected) => JSON.stringify(selected) !== JSON.stringify(item),
        )
      : [...currentSelection, item];
    const nextSelectedItems = { ...selectedItems, [type]: nextSelection };
    const perks = [
      ...nextSelectedItems.weapons.map((selected) =>
        cleanSpecOpsItem(selected, "weapons"),
      ),
      ...nextSelectedItems.skills.map((selected) =>
        cleanSpecOpsItem(selected, "skills"),
      ),
      ...nextSelectedItems.equips.map((selected) =>
        cleanSpecOpsItem(selected, "equips"),
      ),
    ];

    setXpRemaining((current) => current + xpChange);
    setSelectedItems(nextSelectedItems);
    setConfiguredTrooper((current: any) => ({ ...current, perks }));
  }

  return (
    <div className="legacy-specops-configurator">
      <div className="legacy-specops-configurator__header">
        <div>
          <span className="panel-kicker">Spec-Ops Configuration</span>
          <h3>{configuredTrooper.isc}</h3>
          <p>
            Spend the Captain's remaining Spec-Ops XP before adding them to the
            company.
          </p>
        </div>
        <strong>{xpRemaining} XP</strong>
      </div>

      <UnitProfileDisplay
        unit={renderCombinedDetails(configuredTrooper)}
        profileGroups={
          renderCombinedDetails(configuredTrooper).profileGroups || []
        }
        showAva
      />

      {useDefaultAttributeChart ? (
        <section className="legacy-specops-card">
          <h4>Default Attribute Chart</h4>
          <p className="legacy-specops-note">
            Use this fallback chart when the Captain is not already an Infinity
            Spec-Ops profile, or when the chosen sectorials do not provide a
            Spec-Ops chart.
          </p>
          <div className="legacy-specops-attributes">
            {Object.entries(attributeRules).map(([attr, rule]) => (
              <div key={attr}>
                <span>{attr === "w" ? "VITA" : attr.toUpperCase()}</span>
                <div>
                  {rule.options.map((option) =>
                    option.val <= rule.max ? (
                      <button
                        className={
                          selectedAttributes[attr]?.val === option.val
                            ? "is-selected"
                            : ""
                        }
                        key={`${attr}-${option.val}`}
                        type="button"
                        onClick={() => handleAttribute(attr, option)}
                      >
                        <strong>{option.val}</strong>
                        <small>{option.xp ? `${option.xp} XP` : "Base"}</small>
                      </button>
                    ) : null,
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="legacy-specops-card">
          <h4>Spec-Ops Chart</h4>
          <p className="legacy-specops-note">
            This Captain is already an Infinity Spec-Ops profile, so the default
            fallback attribute chart does not apply here.
          </p>
        </section>
      )}

      <SpecOpsItemSection
        title="Weapons"
        items={specops.weapons || []}
        metaKey="weapons"
        selectedItems={selectedItems.weapons}
        onToggle={(item) => handleItemToggle(item, "weapons")}
      />
      <SpecOpsItemSection
        title="Skills"
        items={specops.skills || []}
        metaKey="skills"
        selectedItems={selectedItems.skills}
        onToggle={(item) => handleItemToggle(item, "skills")}
      />
      <SpecOpsItemSection
        title="Equipment"
        items={specops.equip || []}
        metaKey="equips"
        selectedItems={selectedItems.equips}
        onToggle={(item) => handleItemToggle(item, "equips")}
      />

      <footer className="legacy-specops-actions">
        <button className="command-button" type="button" onClick={onBack}>
          Back to Profiles
        </button>
        <button
          className="command-button command-button--primary"
          type="button"
          onClick={() => onConfirm(configuredTrooper)}
        >
          Add Captain
        </button>
      </footer>
    </div>
  );
}

function SpecOpsItemSection({
  title,
  items,
  metaKey,
  selectedItems,
  onToggle,
}: {
  title: string;
  items: MetadataItem[];
  metaKey: string;
  selectedItems: MetadataItem[];
  onToggle: (item: MetadataItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="legacy-specops-card">
      <button
        className="legacy-specops-card__summary"
        type="button"
        onClick={() => setExpanded((value) => !value)}
      >
        <span>{title}</span>
        <AppIcon name={expanded ? "up" : "down"} size={17} />
      </button>
      {expanded && (
        <div className="legacy-specops-items">
          {items.map((item, index) => {
            const selected = selectedItems.some(
              (selectedItem) =>
                JSON.stringify(selectedItem) === JSON.stringify(item),
            );
            return (
              <label
                className={selected ? "is-selected" : ""}
                key={`${title}-${index}-${item.id}`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggle(item)}
                />
                <span>{getSpecOpsItemName(item, metaKey)}</span>
                <strong>{Number(item.exp || 0)} XP</strong>
              </label>
            );
          })}
          {items.length === 0 && (
            <p className="empty-note">No {title.toLowerCase()} available.</p>
          )}
        </div>
      )}
    </section>
  );
}

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
    const recruitable = getRecruitableUnits(units, isCreatingCaptain);
    return searchRecruitableUnits(recruitable, searchTerm);
  }, [isCreatingCaptain, searchTerm, units]);

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
              Lieutenant profiles for Captains, and no named characters.
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
                onAddTrooper(trooper);
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
                      if (
                        isCreatingCaptain &&
                        getTrooperPoints(cleanedUnit) < 28
                      ) {
                        setCaptainDraft({
                          unit,
                          group,
                          option,
                          trooper: cleanedUnit,
                          xp: 28 - getTrooperPoints(cleanedUnit),
                          baseProfile: structuredClone(
                            cleanedUnit.profileGroups[0].profiles[0],
                          ),
                        });
                        return;
                      }
                      onAddTrooper(cleanedUnit);
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

function RecruitableUnit({
  unit,
  isCreatingCaptain,
  specops,
  onAdd,
}: {
  unit: Unit;
  isCreatingCaptain: boolean;
  specops: SpecopsPool;
  onAdd: (group: ProfileGroup, option: ProfileOption) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const renderableGroups = unit.profileGroups.filter(
    (group) =>
      (group.profiles || []).length > 0 && (group.options || []).length > 0,
  );

  return (
    <article className="legacy-recruit-card">
      <button
        className="legacy-recruit-summary"
        type="button"
        onClick={() => setExpanded((value) => !value)}
      >
        {unit.resume?.logo && (
          <img src={unit.resume.logo} alt="" aria-hidden="true" />
        )}
        <span>
          <strong>{unit.isc}</strong>
          <small>{mapType(unit.resume?.type || "")}</small>
        </span>
        <AppIcon name={expanded ? "up" : "down"} size={17} />
      </button>
      {expanded && (
        <div className="legacy-recruit-details">
          <UnitProfileDisplay
            unit={unit}
            profileGroups={renderableGroups}
            showAva
            optionClick={onAdd}
          />
          {renderableGroups.length === 0 && (
            <p className="legacy-empty-note">
              No valid profiles are available for this recruitment filter.
            </p>
          )}
          {isCreatingCaptain && specops && (
            <p className="legacy-specops-note">
              Spec-Ops pools loaded: {specops.weapons.length} weapons,{" "}
              {specops.skills.length} skills, {specops.equip.length} equipment
              items.
            </p>
          )}
        </div>
      )}
    </article>
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

  useEffect(() => {
    const loadedCompanies = loadLocalCompanies();
    const requestedId = new URLSearchParams(window.location.search).get("id");
    const selectedCompany =
      loadedCompanies.find((item) => item.id === requestedId) ||
      loadedCompanies[0] ||
      null;
    setCompanies(loadedCompanies);
    setCompany(selectedCompany ? normalizeCompany(selectedCompany) : null);
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
    return {
      ...value,
      sectorials: value.sectorials || [],
      inventory: value.inventory || [],
      notoriety: value.notoriety || 0,
      credits: value.credits || 0,
      sponsor: value.sponsor || "",
      troopers: value.troopers || [],
      local: value.local ?? true,
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
    if (!nextCompany) return;
    const normalized = normalizeCompany(nextCompany);
    const nextCompanies = companies.map((item) =>
      item.id === normalized.id ? normalized : item,
    );
    setCompanies(nextCompanies);
    setCompany(normalized);
    saveLocalCompanies(nextCompanies);
    setIsModified(false);
  }

  function addTrooper(trooper: any) {
    if (!company) return;
    const existingTroopers = (company.troopers || []) as any[];
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

  if (!company) {
    return (
      <section className="company-manager legacy-company-page">
        <div className="company-empty-state">
          <span className="panel-kicker">No Company Selected</span>
          <h1>Open a Company</h1>
          <p>This page needs a company id from the company list.</p>
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
              {company.local ? "Local Company" : "Database Company"}
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

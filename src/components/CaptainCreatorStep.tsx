/**
 * Captain creation UI — shared between the company creation wizard and
 * the AddTrooperDialog in CompanyManager. Exports both primitive components
 * and a high-level CaptainCreatorStep for embedding in multi-step flows.
 */

import { useEffect, useMemo, useState } from "react";
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
  cleanSpecOpsItem,
  cleanUnitForRoster,
  flattenTrooperForRoster,
  getCaptainSpecOpsXpBudget,
  getSpecOpsItemName,
  renderCombinedDetails,
} from "../lib/mercs/trooperUtils";
import type {
  MetadataItem,
  Profile,
  ProfileGroup,
  ProfileOption,
  Unit,
} from "../lib/mercs/types";
import { AppIcon } from "./AppIcon";
import styles from "./CaptainCreatorStep.module.css";
import { UnitProfileDisplay } from "./UnifiedProfileCard";

// ── Shared types ──────────────────────────────────────────────────────────────

export type SpecopsPool = {
  equip: MetadataItem[];
  skills: MetadataItem[];
  weapons: MetadataItem[];
};

export type CaptainDraft = {
  unit: Unit;
  group: ProfileGroup;
  option: ProfileOption;
  trooper: any;
  xp: number;
  baseProfile: Profile;
};

// ── SpecOpsItemSection ────────────────────────────────────────────────────────

export function SpecOpsItemSection({
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
    <section className={styles["legacy-specops-card"]}>
      <button
        className={styles["legacy-specops-card__summary"]}
        type="button"
        onClick={() => setExpanded((v) => !v)}
      >
        <span>{title}</span>
        <AppIcon name={expanded ? "up" : "down"} size={17} />
      </button>
      {expanded && (
        <div className={styles["legacy-specops-items"]}>
          {items.map((item, index) => {
            const selected = selectedItems.some(
              (s) => JSON.stringify(s) === JSON.stringify(item),
            );
            return (
              <label
                className={selected ? styles["is-selected"] : undefined}
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
            <p className={styles["legacy-empty-note"]}>
              No {title.toLowerCase()} available.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

// ── SpecOpsConfigurator ───────────────────────────────────────────────────────

export function SpecOpsConfigurator({
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
    setXpRemaining((c) => c + xpChange);
    setSelectedAttributes((c) => ({ ...c, [attr]: option }));
    setProfileValue(attr, option.val);
  }

  function handleItemToggle(
    item: MetadataItem,
    type: "weapons" | "skills" | "equips",
  ) {
    const itemXp = Number(item.exp || 0);
    const currentSelection = selectedItems[type] || [];
    const isSelected = currentSelection.some(
      (s) => JSON.stringify(s) === JSON.stringify(item),
    );
    const xpChange = isSelected ? itemXp : -itemXp;
    if (xpRemaining + xpChange < 0) return;

    const nextSelection = isSelected
      ? currentSelection.filter(
          (s) => JSON.stringify(s) !== JSON.stringify(item),
        )
      : [...currentSelection, item];
    const nextSelectedItems = { ...selectedItems, [type]: nextSelection };
    const perks = [
      ...nextSelectedItems.weapons.map((s) => cleanSpecOpsItem(s, "weapons")),
      ...nextSelectedItems.skills.map((s) => cleanSpecOpsItem(s, "skills")),
      ...nextSelectedItems.equips.map((s) => cleanSpecOpsItem(s, "equips")),
    ];

    setXpRemaining((c) => c + xpChange);
    setSelectedItems(nextSelectedItems);
    setConfiguredTrooper((current: any) => ({ ...current, perks }));
  }

  return (
    <div className={styles["legacy-specops-configurator"]}>
      <div className={styles["legacy-specops-configurator__header"]}>
        <div>
          <span className={styles["panel-kicker"]}>Spec-Ops Configuration</span>
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
          <p className={styles["legacy-specops-note"]}>
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

      <footer className={styles["legacy-specops-actions"]}>
        <button
          className={styles["command-button"]}
          type="button"
          onClick={onBack}
        >
          Back to Profiles
        </button>
        <button
          className={`${styles["command-button"]} ${styles["command-button--primary"]}`}
          type="button"
          onClick={() => onConfirm(flattenTrooperForRoster(configuredTrooper))}
        >
          Add Captain
        </button>
      </footer>
    </div>
  );
}

// ── RecruitableUnit ───────────────────────────────────────────────────────────

export function RecruitableUnit({
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
    <article className={styles["legacy-recruit-card"]}>
      <UnitProfileDisplay
        unit={unit}
        profileGroups={renderableGroups}
        showAva
        optionClick={onAdd}
        collapsible
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      >
        {expanded && renderableGroups.length === 0 && (
          <p className={styles["legacy-empty-note"]}>
            No valid profiles are available for this recruitment filter.
          </p>
        )}
        {expanded && isCreatingCaptain && specops && (
          <p className={styles["legacy-specops-note"]}>
            Spec-Ops pools loaded: {specops.weapons.length} weapons,{" "}
            {specops.skills.length} skills, {specops.equip.length} equipment
            items.
          </p>
        )}
      </UnitProfileDisplay>
    </article>
  );
}

// ── CaptainCreatorStep ────────────────────────────────────────────────────────
// Inline (no modal) captain creation for embedding in a multi-step wizard.

export function CaptainCreatorStep({
  sectorialSlugs,
  companyTypeId,
  existingTroopers,
  onConfirm,
}: {
  sectorialSlugs: string[];
  companyTypeId?: string;
  existingTroopers?: any[];
  onConfirm: (trooper: any) => void;
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

  const slugKey = sectorialSlugs.join(",");

  useEffect(() => {
    if (!sectorialSlugs.length) return;
    let cancelled = false;
    setCaptainDraft(null);
    setLoading(true);
    loadRecruitmentPool(sectorialSlugs)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugKey]);

  const filteredUnits = useMemo(() => {
    const recruitable = getRecruitableUnits(units, true, {
      companyTypeId,
      existingTroopers,
    });
    return searchRecruitableUnits(recruitable, searchTerm);
  }, [companyTypeId, existingTroopers, searchTerm, units]);

  if (captainDraft) {
    return (
      <SpecOpsConfigurator
        draft={captainDraft}
        specops={specops}
        onBack={() => setCaptainDraft(null)}
        onConfirm={onConfirm}
      />
    );
  }

  return (
    <div className="captain-creator-step">
      <div className="captain-creator-step__tools">
        <label className="field">
          <span>Filter by ISC</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search units…"
          />
        </label>
        <div className="captain-creator-step__count" aria-live="polite">
          <strong>{loading ? "…" : filteredUnits.length}</strong>
          <span>
            {loading
              ? "Loading"
              : filteredUnits.length === 1
                ? "match"
                : "matches"}
          </span>
        </div>
      </div>

      <div className="captain-creator-step__list">
        {loading && <p className="empty-note">Loading faction profiles…</p>}
        {!loading &&
          filteredUnits.map((unit) => (
            <RecruitableUnit
              key={`${unit.slug}-${unit.id}`}
              unit={unit}
              isCreatingCaptain={true}
              specops={specops}
              onAdd={(group, option) => {
                const cleaned = cleanUnitForRoster(unit, group, option, true);
                const xpBudget = getCaptainSpecOpsXpBudget(cleaned, unit);
                if (xpBudget > 0) {
                  setCaptainDraft({
                    unit,
                    group,
                    option,
                    trooper: cleaned,
                    xp: xpBudget,
                    baseProfile: structuredClone(
                      cleaned.profileGroups[0].profiles[0],
                    ),
                  });
                } else {
                  onConfirm(flattenTrooperForRoster(cleaned));
                }
              }}
            />
          ))}
        {!loading && filteredUnits.length === 0 && (
          <p className="empty-note">No matching profiles. Adjust the filter.</p>
        )}
      </div>
    </div>
  );
}

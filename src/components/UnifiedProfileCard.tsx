import { useMemo, useState } from "react";
import type React from "react";
import {
  infinityMetadata,
  mapCategory,
  mapItemData,
  mapType,
  renderStat,
} from "../lib/mercs/metadata";
import type {
  MetadataItem,
  Profile,
  ProfileGroup,
  ProfileOption,
} from "../lib/mercs/types";
import type { NpcProfile } from "../data/npcs";

const STAT_KEYS = [
  "move",
  "cc",
  "bs",
  "ph",
  "wip",
  "arm",
  "bts",
  "w",
  "s",
] as const;

const ORDER_ICON_BY_TYPE: Record<string, string> = {
  REGULAR: "https://assets.corvusbelli.net/army/img/icon/regular.svg",
  IRREGULAR: "https://assets.corvusbelli.net/army/img/icon/irregular.svg",
  IMPETUOUS: "https://assets.corvusbelli.net/army/img/icon/impetuous.svg",
  LIEUTENANT: "https://assets.corvusbelli.net/army/img/icon/lieutenant.svg",
  TACTICAL: "https://assets.corvusbelli.net/army/img/icon/tactical.svg",
};

type WeaponDistanceBand = {
  max?: number | string;
  mod?: string | number;
};

type WeaponDistance = {
  short?: WeaponDistanceBand | null;
  med?: WeaponDistanceBand | null;
  long?: WeaponDistanceBand | null;
  max?: WeaponDistanceBand | null;
};

type WeaponProfileRow = {
  name: string;
  mode: string;
  damage: string;
  burst: string;
  ammunition: string;
  saving: string;
  savingNum: string;
  properties: string[];
  distance?: WeaponDistance | null;
};

type WeaponProfileGroup = {
  key: string;
  name: string;
  rows: WeaponProfileRow[];
};

type ProfileStat = {
  label: string;
  value: string | number;
  key?: string;
};

type ProfileDetail = {
  title: string;
  value: string | string[];
  wide?: boolean;
  attr?: string;
  list?: boolean;
};

type StaticProfile = {
  id?: string;
  name: string;
  category: string;
  subtitle?: string;
  contracts?: string[];
  troopClass?: string;
  silhouette?: string | number;
  attributes?: Record<string, string | number>;
  baseSkills?: string[];
  weapons?: string[];
  priority?: string[];
  traits?: string[];
  spawn?: string;
  description?: string;
  notes?: string;
};

type StaticProfileCardProps = {
  profile?: StaticProfile;
  name?: string;
  category?: string;
  subtitle?: string;
  tags?: string[];
  stats?: ProfileStat[];
  details?: ProfileDetail[];
  interactive?: boolean;
  showTts?: boolean;
};

function normalizeMetaKey(metaKey: string): string {
  if (metaKey === "equip") return "equips";
  if (metaKey === "peripherals") return "peripheral";
  return metaKey;
}

function formatExtra(extraValue: unknown): string {
  const found = ((infinityMetadata.extras || []) as MetadataItem[]).find(
    (extra) => extra.id === extraValue,
  );
  if (!found) return String(extraValue);

  if (found.type === "DISTANCE") {
    const cm = Number.parseFloat(String(found.name));
    if (Number.isFinite(cm)) return `+${Math.round(cm / 2.54)}"`;
  }

  return String(found.name || extraValue);
}

function getItemDisplay(
  item: MetadataItem,
  metaKey: string,
): { label: string; wiki?: string } {
  const normalizedKey = normalizeMetaKey(metaKey);
  const mapped = mapItemData({ ...item, key: normalizedKey });
  const resolved = mapped[0] || item;
  const extraValues = (item.extra ?? item.extras) as unknown;
  const extras = (
    Array.isArray(extraValues) ? extraValues : extraValues ? [extraValues] : []
  ).map(formatExtra);
  const label = `${resolved.name || item.name || item.id}${extras.length ? ` (${extras.join(", ")})` : ""}`;
  return { label, wiki: String(resolved.wiki || item.wiki || "") || undefined };
}

function getAmmoLabel(ammunition: unknown): string {
  const options = (infinityMetadata.ammunitions || []) as MetadataItem[];
  const ammoId =
    typeof ammunition === "number" || typeof ammunition === "string"
      ? ammunition
      : "";
  const match = options.find((item) => item.id === ammoId);
  return String(match?.name || ammunition || "-");
}

function getWeaponRangeMods(distance?: WeaponDistance | null): string[] {
  if (!distance || typeof distance !== "object") {
    return ["", "", "", "", "", "", ""];
  }

  const endpoints = [20, 40, 60, 80, 100, 120, 240];
  const bands = Object.values(distance)
    .filter(Boolean)
    .map((band) => ({
      max: Number((band as WeaponDistanceBand).max),
      mod: String((band as WeaponDistanceBand).mod ?? ""),
    }))
    .filter((band) => Number.isFinite(band.max) && band.mod !== "")
    .sort((a, b) => a.max - b.max);

  if (!bands.length) return ["", "", "", "", "", "", ""];

  return endpoints.map((endpoint) => {
    const match = bands.find((band) => endpoint <= band.max);
    return match?.mod || "";
  });
}

function getRangeModClass(mod: string): string {
  const normalized = String(mod || "").trim();
  if (normalized === "-6") return "is-minus-6";
  if (normalized === "-3") return "is-minus-3";
  if (normalized === "0") return "is-zero";
  if (normalized === "+3" || normalized === "3") return "is-plus-3";
  if (normalized === "+6" || normalized === "6") return "is-plus-6";
  return "";
}

function collectWeaponProfileGroups(
  groups: ProfileGroup[],
): WeaponProfileGroup[] {
  const items: MetadataItem[] = [];

  for (const group of groups || []) {
    for (const profile of group.profiles || []) {
      items.push(...(profile.weapons || []));
    }
    for (const option of group.options || []) {
      items.push(...(option.weapons || []));
    }
  }

  const weaponGroups = new Map<string, WeaponProfileGroup>();

  for (const item of items) {
    const sourceName = String(item?.name || item?.id || "Weapon");
    const mappedRows = mapItemData({ ...item, key: "weapons" })
      .filter(Boolean)
      .map((entry) => ({
        name: String(entry.name || sourceName),
        mode: String(entry.mode || "-"),
        damage: String(entry.damage ?? "-"),
        burst: String(entry.burst ?? "-"),
        ammunition: getAmmoLabel(entry.ammunition),
        saving: String(entry.saving ?? "-"),
        savingNum: String(entry.savingNum ?? "-"),
        properties: Array.isArray(entry.properties)
          ? entry.properties.map((value) => String(value))
          : [],
        distance:
          entry.distance && typeof entry.distance === "object"
            ? (entry.distance as WeaponDistance)
            : null,
      }));

    if (!mappedRows.length) continue;

    const key = `${String(item.id)}-${String(item.type || "")}`;
    if (!weaponGroups.has(key)) {
      weaponGroups.set(key, {
        key,
        name: mappedRows[0].name,
        rows: mappedRows,
      });
      continue;
    }

    const existing = weaponGroups.get(key);
    if (!existing) continue;
    const existingModes = new Set(existing.rows.map((row) => row.mode));
    for (const row of mappedRows) {
      if (!existingModes.has(row.mode)) {
        existing.rows.push(row);
      }
    }
  }

  return Array.from(weaponGroups.values());
}

export function MetadataItemList({
  list,
  metaKey,
  preText,
  postText,
  separator = ", ",
}: {
  list?: MetadataItem[];
  metaKey: string;
  preText?: string;
  postText?: string;
  separator?: string;
}) {
  if (!list?.length) return null;

  return (
    <>
      {preText}
      {list.map((item, index) => {
        const display = getItemDisplay(item, metaKey);
        return (
          <span key={`${metaKey}-${item.id}-${index}`}>
            {index > 0 && separator}
            {display.wiki ? (
              <a
                className="profile-item-link"
                href={display.wiki}
                target="_blank"
                rel="noopener noreferrer"
              >
                {display.label}
              </a>
            ) : (
              display.label
            )}
          </span>
        );
      })}
      {postText}
    </>
  );
}

export function ProfileDetailLine({
  label,
  children,
  valueProps,
}: {
  label: string;
  children: React.ReactNode;
  valueProps?: React.HTMLAttributes<HTMLSpanElement>;
}) {
  if (!children) return null;
  return (
    <p className="legacy-detail-line">
      <strong>{label}</strong>
      <span {...valueProps}>{children}</span>
    </p>
  );
}

function ProfileItemLine({
  label,
  list,
  metaKey,
  valueProps,
}: {
  label: string;
  list?: MetadataItem[];
  metaKey: string;
  valueProps?: React.HTMLAttributes<HTMLSpanElement>;
}) {
  if (!list?.length) return null;
  return (
    <ProfileDetailLine label={label} valueProps={valueProps}>
      <MetadataItemList list={list} metaKey={metaKey} />
    </ProfileDetailLine>
  );
}

export function ProfileStats({
  profile,
  showAva,
  npcDataAttrs = false,
}: {
  profile: Profile;
  showAva?: boolean;
  npcDataAttrs?: boolean;
}) {
  const stats = showAva ? [...STAT_KEYS, "ava" as const] : STAT_KEYS;
  return (
    <div className="legacy-unit-stats">
      {stats.map((stat) => (
        <div key={stat}>
          <span>{stat === "move" ? "MOV" : stat.toUpperCase()}</span>
          <strong
            {...(npcDataAttrs && stat !== "move" && stat !== "s"
              ? { "data-npc-stat": stat === "w" ? "vita" : stat }
              : {})}
          >
            {renderStat(profile[stat])}
          </strong>
        </div>
      ))}
    </div>
  );
}

export function ProfileOptionRow({
  option,
  onClick,
  hideSwcPts = false,
  actionLabel,
}: {
  option: ProfileOption;
  onClick?: () => void;
  hideSwcPts?: boolean;
  actionLabel?: string;
}) {
  const disabled = Boolean(option.disabled);
  const hasDetails = Boolean(
    (option.skills || []).length ||
    (option.weapons || []).length ||
    (option.equip || option.equips || []).length ||
    (option.peripheral || option.peripherals || []).length,
  );
  return (
    <button
      className={`legacy-option-row${hasDetails ? "" : " legacy-option-row--name-only"}${hideSwcPts ? " legacy-option-row--action" : ""}`}
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <span className="legacy-option-orders">
        {renderOrderIcons(option.orders)}
      </span>
      <span className="legacy-option-body">
        <strong>
          {String(option.name || "Profile")}
          {(option.skills || []).length > 0 && (
            <span className="legacy-option-skills">
              {" "}
              (
              <MetadataItemList
                list={option.skills}
                metaKey="skills"
                separator=", "
              />
              )
            </span>
          )}
        </strong>
        {(option.weapons || []).length > 0 && (
          <span className="legacy-option-detail-line">
            <em>Weapons: </em>
            <MetadataItemList
              list={option.weapons}
              metaKey="weapons"
              separator=", "
            />
          </span>
        )}
        {(option.equip || option.equips || []).length > 0 && (
          <span className="legacy-option-detail-line">
            <em>Equipment: </em>
            <MetadataItemList
              list={option.equip || option.equips}
              metaKey="equips"
              separator=", "
            />
          </span>
        )}
        {(option.peripheral || option.peripherals || []).length > 0 && (
          <span className="legacy-option-detail-line">
            <em>Peripherals: </em>
            <MetadataItemList
              list={option.peripheral || option.peripherals}
              metaKey="peripheral"
              separator=", "
            />
          </span>
        )}
      </span>
      {hideSwcPts ? (
        <span className="legacy-option-action">{actionLabel || "Select"}</span>
      ) : (
        <>
          <span className="legacy-option-swc">{String(option.swc ?? "-")}</span>
          <span className="legacy-option-points">
            {String(option.points ?? "-")}
          </span>
        </>
      )}
    </button>
  );
}

function buildParentProfileGroup(unit: any): ProfileGroup[] {
  const hasStatData = [
    "move",
    "cc",
    "bs",
    "ph",
    "wip",
    "arm",
    "bts",
    "w",
    "s",
  ].some((key) => unit?.[key] !== undefined);
  const hasDetailData = [
    "skills",
    "weapons",
    "equip",
    "equips",
    "peripheral",
    "peripherals",
  ].some((key) => (unit?.[key] || []).length > 0);

  if (!hasStatData && !hasDetailData) return [];

  const summary = {
    orders: unit?.orders || [],
    swc: String(unit?.swc ?? "-"),
    points: String(unit?.points ?? "-"),
    level:
      unit?.level ??
      (typeof unit?.xp === "number"
        ? unit.xp < 5
          ? 1
          : unit.xp < 15
            ? 2
            : unit.xp < 30
              ? 3
              : unit.xp < 50
                ? 4
                : 5
        : undefined),
  };

  return [
    {
      category: unit?.category ?? 10,
      profiles: [
        {
          name: String(
            unit?.profileName || unit?.name || unit?.isc || "Profile",
          ),
          move: unit?.move,
          cc: unit?.cc,
          bs: unit?.bs,
          ph: unit?.ph,
          wip: unit?.wip,
          arm: unit?.arm,
          bts: unit?.bts,
          w: unit?.w,
          s: unit?.s,
          type: unit?.resume?.type || unit?.type,
          skills: unit?.skills || [],
          weapons: unit?.weapons || [],
          equip: unit?.equip || unit?.equips || [],
          peripheral: unit?.peripheral || unit?.peripherals || [],
        },
      ],
      options: [],
      summary,
    } as ProfileGroup,
  ];
}

function generateTrooperTtsText(unit: any, groups: ProfileGroup[]): string {
  const group = groups[0];
  const profile = group?.profiles?.[0];
  if (!profile) return "";

  const summary = (group as any).summary as
    | {
        orders?: ProfileOption["orders"];
        swc?: string;
        points?: string;
        level?: number;
      }
    | undefined;

  const category = String(mapCategory(group?.category || 10) || "Trooper");
  const type = String(mapType(unit?.resume?.type || profile.type || ""));
  const level = summary?.level;
  const swc = summary?.swc ?? "-";
  const pts = summary?.points ?? "-";

  const toNames = (list: MetadataItem[] | undefined, key: string) =>
    (list || [])
      .map((item) => getItemDisplay(item, key).label)
      .filter(Boolean)
      .join(", ");

  const skillsText = toNames(profile.skills, "skills");
  const weaponsText = toNames(profile.weapons, "weapons");
  const equipText = toNames(profile.equip || (profile as any).equips, "equips");
  const periText = toNames(
    profile.peripheral || (profile as any).peripherals,
    "peripheral",
  );

  const mov = Array.isArray(profile.move)
    ? profile.move.join("-")
    : String(profile.move ?? "-");

  const nameLine =
    level !== undefined
      ? `[${String(profile.name || unit?.isc || "")}] LVL ${level}`
      : String(profile.name || unit?.isc || "");

  return `${nameLine}
${type}
[sub]---------Attributes-------
[/sub]
[b]MOV[/b]: ${mov}
[b]CC[/b]: ${String(profile.cc ?? "-")}
[b]BS[/b]: ${String(profile.bs ?? "-")}
[b]PH[/b]: ${String(profile.ph ?? "-")}
[b]WIP[/b]: ${String(profile.wip ?? "-")}
[b]ARM[/b]: ${String(profile.arm ?? "-")}
[b]BTS[/b]: ${String(profile.bts ?? "-")}
[-][B]W[/B]: ${String(profile.w ?? "-")}
[B]S[/B]: ${String(profile.s ?? "-")}${
    equipText
      ? `
[ffdddd][sub]----------Equipment---------
${equipText}
[/sub]`
      : ""
  }${
    skillsText
      ? `
[ffdddd][sub]----------Skills---------
${skillsText}
[/sub]`
      : ""
  }${
    weaponsText
      ? `
[ddddff][sub]----------Weapons---------
${weaponsText}
[/sub]`
      : ""
  }${
    periText
      ? `
[ddddff][sub]----------Peripherals---------
${periText}
[/sub]`
      : ""
  }`;
}

function TtsCopyPanel({
  ttsText,
  isc,
  actions,
}: {
  ttsText: string;
  isc?: string;
  actions?: React.ReactNode;
}) {
  const [status, setStatus] = useState("");

  function copyText(text: string) {
    navigator.clipboard.writeText(text).then(
      () => {
        setStatus("Copied!");
        setTimeout(() => setStatus(""), 2000);
      },
      () => setStatus("Copy failed"),
    );
  }

  return (
    <section className="npc-tts-panel">
      <div className="npc-tts-bar">
        <div className="npc-tts-actions">
          {actions}
          {isc && (
            <button type="button" onClick={() => copyText(isc)}>
              Copy Name
            </button>
          )}
          <button type="button" onClick={() => copyText(ttsText)}>
            Copy Profile
          </button>
        </div>
        <p aria-live="polite">{status}</p>
      </div>
      <details className="npc-tts-details">
        <summary>Show formatted text</summary>
        <pre>{ttsText}</pre>
      </details>
    </section>
  );
}

export function UnitProfileDisplay({
  unit,
  profileGroups = [],
  showAva = false,
  npcDataAttrs = false,
  optionClick,
  collapsible = false,
  expanded = true,
  onToggle,
  showTts = false,
  ttsActions,
  children,
  optionActionLabel,
  hideOptionSwcPts = false,
  extraHeadChips,
}: {
  unit: { isc?: string; resume?: { type?: string | number } | null };
  profileGroups?: ProfileGroup[];
  showAva?: boolean;
  npcDataAttrs?: boolean;
  optionClick?: (group: ProfileGroup, option: ProfileOption) => void;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  showTts?: boolean;
  ttsActions?: React.ReactNode;
  children?: React.ReactNode;
  optionActionLabel?: string;
  hideOptionSwcPts?: boolean;
  extraHeadChips?: React.ReactNode;
}) {
  const groupsToRender = profileGroups?.length
    ? profileGroups
    : buildParentProfileGroup(unit);
  const weaponProfileGroups = useMemo(
    () => collectWeaponProfileGroups(groupsToRender),
    [groupsToRender],
  );
  const rangeLabels = ['8"', '16"', '24"', '32"', '40"', '48"', '96"'];

  if (!groupsToRender.length) return null;

  return (
    <div className="legacy-profile-stack">
      {groupsToRender.map((group, groupIndex) => (
        <section
          className="legacy-profile-group"
          key={`${unit.isc || "unit"}-${groupIndex}`}
        >
          {(() => {
            const headerSummary = (group as any).summary as
              | {
                  orders?: ProfileOption["orders"];
                  swc?: string;
                  points?: string;
                  level?: number;
                }
              | undefined;
            return (group.profiles || []).map((profile, profileIndex) => (
              <div
                className="legacy-profile-sheet"
                key={`${unit.isc || "unit"}-${groupIndex}-${profileIndex}`}
              >
                {(() => {
                  const baseCategory =
                    mapCategory(group.category || 10) ||
                    (typeof group.category === "string"
                      ? group.category
                      : "Trooper");
                  const categoryText =
                    String(baseCategory).toLowerCase() === "character" &&
                    Boolean((unit as any)?.captain)
                      ? `${baseCategory} (Captain)`
                      : String(baseCategory);
                  const troopType = String(
                    mapType(unit.resume?.type || profile.type || ""),
                  );

                  const headerClasses = [
                    "legacy-profile-sheet__header",
                    headerSummary || (unit as any).resume?.logo
                      ? "has-summary"
                      : "",
                    collapsible ? "is-collapsible" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  const HeaderEl = collapsible ? "button" : "div";
                  const headerProps = collapsible
                    ? {
                        type: "button" as const,
                        onClick: onToggle,
                        "aria-expanded": expanded,
                      }
                    : {};

                  return (
                    <HeaderEl
                      className={headerClasses}
                      {...(headerProps as any)}
                    >
                      {((unit as any).resume?.logo || headerSummary) && (
                        <div className="legacy-profile-head-leading">
                          {(unit as any).resume?.logo && (
                            <img
                              className="legacy-profile-head-logo"
                              src={(unit as any).resume.logo}
                              alt=""
                              aria-hidden="true"
                            />
                          )}
                          {headerSummary && (
                            <div
                              className="legacy-profile-head-orders"
                              aria-label="Orders"
                            >
                              {renderOrderIcons(headerSummary.orders)}
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <span className="legacy-profile-category">
                          {categoryText}
                        </span>
                        <h4>{String(profile.name || unit.isc || "Profile")}</h4>
                      </div>
                      <div className="legacy-profile-head-meta">
                        <div className="legacy-profile-head-chips">
                          {headerSummary?.level !== undefined && (
                            <span className="legacy-profile-chip legacy-profile-chip--level">
                              <small>LVL</small>
                              <b>{headerSummary.level}</b>
                            </span>
                          )}
                          {headerSummary && (
                            <>
                              <span className="legacy-profile-chip legacy-profile-chip--swc">
                                <small>SWC</small>
                                <b>{headerSummary.swc ?? "-"}</b>
                              </span>
                              <span className="legacy-profile-chip">
                                <small>PTS</small>
                                <b>{headerSummary.points ?? "-"}</b>
                              </span>
                            </>
                          )}
                          <span className="legacy-profile-chip legacy-profile-chip--type">
                            <small>Type</small>
                            <b>{troopType}</b>
                          </span>
                          {extraHeadChips}
                        </div>
                        {collapsible && (
                          <span
                            className="legacy-profile-chevron"
                            aria-hidden="true"
                          >
                            {expanded ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </HeaderEl>
                  );
                })()}
                {(!collapsible || expanded) && (
                  <>
                    <ProfileStats
                      profile={profile}
                      showAva={showAva}
                      npcDataAttrs={npcDataAttrs}
                    />
                    <div className="legacy-profile-details">
                      <ProfileItemLine
                        label="Skills"
                        list={profile.skills}
                        metaKey="skills"
                      />
                      <ProfileItemLine
                        label="Weapons"
                        list={profile.weapons}
                        metaKey="weapons"
                      />
                      <ProfileItemLine
                        label="Equipment"
                        list={profile.equip || profile.equips}
                        metaKey="equips"
                      />
                      <ProfileItemLine
                        label="Peripherals"
                        list={profile.peripheral || profile.peripherals}
                        metaKey="peripheral"
                      />
                    </div>
                  </>
                )}
              </div>
            ));
          })()}
          {(!collapsible || expanded) && (group.options || []).length > 0 && (
            <>
              <div
                className={`legacy-option-header${hideOptionSwcPts ? " legacy-option-header--action" : ""}`}
              >
                <span aria-hidden="true" />
                <span>Name</span>
                {hideOptionSwcPts ? <span>Action</span> : <span>SWC</span>}
                {!hideOptionSwcPts && <span>PTS</span>}
              </div>
              {(group.options || []).map((option, optionIndex) => (
                <ProfileOptionRow
                  key={`${unit.isc || "unit"}-${groupIndex}-${optionIndex}`}
                  option={option}
                  hideSwcPts={hideOptionSwcPts}
                  actionLabel={optionActionLabel}
                  onClick={
                    optionClick ? () => optionClick(group, option) : undefined
                  }
                />
              ))}
            </>
          )}
        </section>
      ))}
      {(!collapsible || expanded) && weaponProfileGroups.length > 0 && (
        <details className="legacy-weapon-profiles">
          <summary>
            Weapon Profiles
            <small>{weaponProfileGroups.length}</small>
          </summary>
          <div className="legacy-weapon-profiles__list">
            {weaponProfileGroups.map((weaponGroup) => (
              <article
                key={weaponGroup.key}
                className="legacy-weapon-profile-card"
              >
                <h5>{weaponGroup.name}</h5>
                <div className="legacy-weapon-profile-table-wrap">
                  <table className="legacy-weapon-profile-table">
                    <thead>
                      <tr>
                        <th>Mode</th>
                        <th>PS</th>
                        <th>B</th>
                        <th>Ammo</th>
                        <th>SR:Attrib</th>
                        <th>SR: No.</th>
                        <th>Range</th>
                        <th>Traits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weaponGroup.rows.map((row, rowIndex) => {
                        const rangeMods = getWeaponRangeMods(row.distance);
                        return (
                          <tr
                            key={`${weaponGroup.key}-${row.mode}-${rowIndex}`}
                          >
                            <td className="legacy-weapon-mode-cell">
                              {row.mode}
                            </td>
                            <td>{row.damage}</td>
                            <td>{row.burst}</td>
                            <td>{row.ammunition}</td>
                            <td>{row.saving}</td>
                            <td>{row.savingNum}</td>
                            <td className="legacy-weapon-range-grid-cell">
                              <div className="legacy-weapon-range-grid">
                                {rangeLabels.map((label, index) => (
                                  <span
                                    key={`${weaponGroup.key}-${rowIndex}-${label}`}
                                    className={`legacy-weapon-range-mod ${getRangeModClass(rangeMods[index] || "")}`.trim()}
                                  >
                                    <small>{label}</small>
                                    <b>{rangeMods[index] || "-"}</b>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="legacy-weapon-traits-cell">
                              {row.properties.length
                                ? row.properties.join(", ")
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        </details>
      )}
      {(!collapsible || expanded) && showTts && (
        <TtsCopyPanel
          ttsText={generateTrooperTtsText(unit, groupsToRender)}
          isc={unit.isc}
          actions={ttsActions}
        />
      )}
      {(!collapsible || expanded) && children}
    </div>
  );
}

function renderOrderIcons(orders: ProfileOption["orders"]): React.ReactNode {
  if (!orders?.length) return "R";
  const sortedOrders = [...orders].sort((a, b) => a.list - b.list);
  const metadataOrders = (infinityMetadata.orders || []) as Array<{
    type?: string;
    logo?: string;
  }>;
  const icons = sortedOrders.flatMap((order) => {
    const normalizedType = String(order.type || "").toUpperCase();
    const orderMeta = metadataOrders.find(
      (item) => String(item.type || "").toUpperCase() === normalizedType,
    );
    const orderLogo = orderMeta?.logo || ORDER_ICON_BY_TYPE[normalizedType];
    if (!orderLogo)
      return Array.from(
        { length: order.total || 1 },
        () => normalizedType[0] || "R",
      );
    return Array.from({ length: order.total || 1 }, (_, index) => (
      <img
        key={`${normalizedType}-${index}`}
        src={orderLogo}
        alt={normalizedType}
      />
    ));
  });

  return icons;
}

function normalizeByName(listKey: string, name: string): MetadataItem {
  const normalized = String(name || "")
    .trim()
    .toLowerCase();
  const entries = (infinityMetadata[listKey] || []) as MetadataItem[];
  const found = entries.find(
    (item) =>
      String(item.name || "")
        .trim()
        .toLowerCase() === normalized,
  );
  if (found) return { id: found.id, name: found.name };
  return { id: `npc-${listKey}-${normalized || "unknown"}`, name };
}

function mapNpcListToMetadata(
  listKey: string,
  list: string[] = [],
): MetadataItem[] {
  return list.filter(Boolean).map((name) => normalizeByName(listKey, name));
}

function mapNpcToUnit(profile: NpcProfile): {
  isc: string;
  resume: { type?: string | number; logo?: string };
  profileGroups: ProfileGroup[];
  category: string;
  name: string;
  profileName: string;
  move: string | number[];
  cc: number;
  bs: number;
  ph: number;
  wip: number;
  arm: number;
  bts: number;
  w: number;
  s: string | number;
  skills: MetadataItem[];
  weapons: MetadataItem[];
  equip: MetadataItem[];
  orders: Array<{ type: string; list: number; total: number }>;
  swc: string;
  points: string;
} {
  const displayName = profile.subtitle
    ? `${profile.name}, ${profile.subtitle}`
    : profile.name;

  const mappedSkills = mapNpcListToMetadata("skills", profile.baseSkills || []);
  const mappedWeapons = mapNpcListToMetadata("weapons", profile.weapons || []);
  const mappedEquipment = mapNpcListToMetadata(
    "equips",
    profile.equipment || [],
  );

  return {
    isc: profile.name,
    name: displayName,
    profileName: displayName,
    category: profile.category,
    resume: { type: profile.troopClass, logo: profile.logo },
    profileGroups: [],
    move: profile.attributes.mov,
    cc: profile.attributes.cc,
    bs: profile.attributes.bs,
    ph: profile.attributes.ph,
    wip: profile.attributes.wip,
    arm: profile.attributes.arm,
    bts: profile.attributes.bts,
    w: profile.attributes.vita,
    s: profile.silhouette,
    skills: mappedSkills,
    weapons: mappedWeapons,
    equip: mappedEquipment,
    orders: profile.orders ?? [{ type: "REGULAR", list: 1, total: 1 }],
    swc: "-",
    points: "-",
  };
}

export function NpcInfinityProfileCard({
  profile,
  interactive = false,
  showTts = false,
}: {
  profile: NpcProfile;
  interactive?: boolean;
  showTts?: boolean;
}) {
  const unit = mapNpcToUnit(profile);
  const profileAttrs =
    interactive && profile
      ? {
          "data-npc-profile": profile.id,
          "data-npc-profile-json": JSON.stringify(profile),
        }
      : {};

  return (
    <article
      className="npc-profile-card npc-profile-card--infinity"
      {...profileAttrs}
    >
      <UnitProfileDisplay
        unit={unit}
        profileGroups={unit.profileGroups}
        npcDataAttrs
      />
      <span data-npc-skills-plain style={{ display: "none" }} />
      {showTts && (
        <section className="npc-tts-panel">
          <div className="npc-tts-bar">
            <div className="npc-tts-actions">
              <button type="button" data-copy-tts="name">
                Copy Name
              </button>
              <button type="button" data-copy-tts="profile">
                Copy Profile
              </button>
            </div>
            <p data-copy-status aria-live="polite"></p>
          </div>
          <details className="npc-tts-details">
            <summary>Show formatted text</summary>
            <pre data-npc-tts-preview></pre>
          </details>
        </section>
      )}
    </article>
  );
}

const renderValue = (value: string | string[], separator = ", ") =>
  Array.isArray(value) ? value.join(separator) : value;

export default function UnifiedProfileCard({
  profile,
  name = profile?.name ?? "",
  category = profile?.category ?? "Profile",
  subtitle = profile?.subtitle,
  tags = [
    ...(profile?.contracts ?? []),
    ...(profile?.troopClass ? [profile.troopClass] : []),
  ],
  interactive = false,
  showTts = false,
  stats,
  details,
}: StaticProfileCardProps) {
  const profileStats =
    stats ??
    (profile
      ? [
          { label: "MOV", value: profile.attributes?.mov ?? "-", key: "mov" },
          { label: "CC", value: profile.attributes?.cc ?? "-", key: "cc" },
          { label: "BS", value: profile.attributes?.bs ?? "-", key: "bs" },
          { label: "PH", value: profile.attributes?.ph ?? "-", key: "ph" },
          { label: "WIP", value: profile.attributes?.wip ?? "-", key: "wip" },
          { label: "ARM", value: profile.attributes?.arm ?? "-", key: "arm" },
          { label: "BTS", value: profile.attributes?.bts ?? "-", key: "bts" },
          { label: "W", value: profile.attributes?.vita ?? "-", key: "vita" },
          { label: "S", value: profile.silhouette ?? "-" },
        ]
      : []);

  const profileDetails =
    details ??
    (profile
      ? [
          {
            title: "Skills",
            value: profile.baseSkills ?? [],
            attr: "data-npc-skills",
          },
          { title: "Weapons", value: profile.weapons ?? [] },
          ...(profile.priority?.length
            ? [{ title: "Priority", value: profile.priority }]
            : []),
          ...(profile.traits?.length
            ? [{ title: "Traits", value: profile.traits }]
            : []),
          ...(profile.spawn
            ? [{ title: "Spawn", value: profile.spawn, wide: true }]
            : []),
          ...(profile.description
            ? [{ title: "Description", value: profile.description, wide: true }]
            : []),
          ...(profile.notes
            ? [{ title: "Notes", value: profile.notes, wide: true }]
            : []),
        ]
      : []);

  const profileAttrs =
    interactive && profile
      ? {
          "data-npc-profile": profile.id,
          "data-npc-profile-json": JSON.stringify(profile),
        }
      : {};

  return (
    <article className="npc-profile-card" {...profileAttrs}>
      <header>
        <div>
          <span>{category}</span>
          <h3>{name}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {tags.length > 0 && (
          <div className="npc-tags">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </header>

      <dl
        className="npc-stat-grid"
        style={{ "--stat-count": profileStats.length } as React.CSSProperties}
      >
        {profileStats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd {...(stat.key ? { "data-npc-stat": stat.key } : {})}>
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {profileDetails.length > 0 && (
        <div className="npc-detail-grid">
          {profileDetails.map((detail) => (
            <section
              className={detail.wide ? "wide" : undefined}
              key={detail.title}
            >
              <h4>{detail.title}</h4>
              {detail.list && Array.isArray(detail.value) ? (
                <ul>
                  {detail.value.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p {...(detail.attr ? { [detail.attr]: "" } : {})}>
                  {renderValue(
                    detail.value,
                    detail.title === "Priority" ? " > " : ", ",
                  )}
                </p>
              )}
            </section>
          ))}
        </div>
      )}

      {showTts && (
        <section className="npc-tts-panel">
          <div className="npc-tts-bar">
            <div className="npc-tts-actions">
              <button type="button" data-copy-tts="name">
                Copy Name
              </button>
              <button type="button" data-copy-tts="profile">
                Copy Profile
              </button>
            </div>
            <p data-copy-status aria-live="polite"></p>
          </div>
          <details className="npc-tts-details">
            <summary>Show formatted text</summary>
            <pre data-npc-tts-preview></pre>
          </details>
        </section>
      )}
    </article>
  );
}

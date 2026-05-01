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
}: {
  label: string;
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <p className="legacy-detail-line">
      <strong>{label}</strong>
      <span>{children}</span>
    </p>
  );
}

function ProfileItemLine({
  label,
  list,
  metaKey,
}: {
  label: string;
  list?: MetadataItem[];
  metaKey: string;
}) {
  if (!list?.length) return null;
  return (
    <ProfileDetailLine label={label}>
      <MetadataItemList list={list} metaKey={metaKey} />
    </ProfileDetailLine>
  );
}

export function ProfileStats({
  profile,
  showAva,
}: {
  profile: Profile;
  showAva?: boolean;
}) {
  const stats = showAva ? [...STAT_KEYS, "ava" as const] : STAT_KEYS;
  return (
    <div className="legacy-unit-stats">
      {stats.map((stat) => (
        <div key={stat}>
          <span>{stat === "move" ? "MOV" : stat.toUpperCase()}</span>
          <strong>{renderStat(profile[stat])}</strong>
        </div>
      ))}
    </div>
  );
}

export function ProfileOptionRow({
  option,
  onClick,
}: {
  option: ProfileOption;
  onClick?: () => void;
}) {
  const disabled = Boolean(option.disabled);
  return (
    <button
      className="legacy-option-row"
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <span className="legacy-option-orders">
        {renderOrderIcons(option.orders)}
      </span>
      <span className="legacy-option-body">
        <strong>{String(option.name || "Profile")}</strong>
        <ProfileItemLine label="Skills" list={option.skills} metaKey="skills" />
        <ProfileItemLine
          label="Weapons"
          list={option.weapons}
          metaKey="weapons"
        />
        <ProfileItemLine
          label="Equipment"
          list={option.equip || option.equips}
          metaKey="equips"
        />
        <ProfileItemLine
          label="Peripherals"
          list={option.peripheral || option.peripherals}
          metaKey="peripheral"
        />
      </span>
      <span className="legacy-option-costs">
        <b>{String(option.swc ?? "-")}</b>
        <b>{String(option.points ?? "-")}</b>
      </span>
    </button>
  );
}

export function UnitProfileDisplay({
  unit,
  profileGroups,
  showAva = false,
  optionClick,
  children,
}: {
  unit: { isc?: string; resume?: { type?: string | number } | null };
  profileGroups: ProfileGroup[];
  showAva?: boolean;
  optionClick?: (group: ProfileGroup, option: ProfileOption) => void;
  children?: React.ReactNode;
}) {
  if (!profileGroups?.length) return null;

  return (
    <div className="legacy-profile-stack">
      {profileGroups.map((group, groupIndex) => (
        <section
          className="legacy-profile-group"
          key={`${unit.isc || "unit"}-${groupIndex}`}
        >
          <div className="legacy-profile-category">
            {mapCategory(group.category || 10) || "Trooper"}
          </div>
          {(group.profiles || []).map((profile, profileIndex) => (
            <div
              className="legacy-profile-sheet"
              key={`${unit.isc || "unit"}-${groupIndex}-${profileIndex}`}
            >
              <div className="legacy-profile-sheet__header">
                <h4>{String(profile.name || unit.isc || "Profile")}</h4>
                <span>{mapType(unit.resume?.type || profile.type || "")}</span>
              </div>
              <ProfileStats profile={profile} showAva={showAva} />
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
            </div>
          ))}
          <div className="legacy-option-header">
            <span>Name</span>
            <span>SWC</span>
            <span>PTS</span>
          </div>
          {(group.options || []).map((option, optionIndex) => (
            <ProfileOptionRow
              key={`${unit.isc || "unit"}-${groupIndex}-${optionIndex}`}
              option={option}
              onClick={
                optionClick ? () => optionClick(group, option) : undefined
              }
            />
          ))}
        </section>
      ))}
      {children}
    </div>
  );
}

function renderOrderIcons(orders: ProfileOption["orders"]): React.ReactNode {
  if (!orders?.length) return "R";
  const sortedOrders = [...orders].sort((a, b) => a.list - b.list);
  const icons = sortedOrders.flatMap((order) => {
    const orderMeta = (
      (infinityMetadata.orders || []) as Array<{ type: string; logo?: string }>
    ).find((item) => item.type === order.type);
    if (!orderMeta?.logo)
      return Array.from(
        { length: order.total || 1 },
        () => order.type?.[0] || "R",
      );
    return Array.from({ length: order.total || 1 }, (_, index) => (
      <img
        key={`${order.type}-${index}`}
        src={orderMeta.logo}
        alt={order.type}
      />
    ));
  });

  return icons;
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

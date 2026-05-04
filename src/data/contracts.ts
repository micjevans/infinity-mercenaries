export type ContractOption = {
  slug: string;
  title: string;
};

export const CONTRACT_OPTIONS: ContractOption[] = [
  { slug: "battle-royale", title: "Battle Royale" },
  { slug: "containment", title: "Containment" },
  { slug: "control-room", title: "Control Room" },
  { slug: "escape-with-the-shuttle", title: "Escape with the Shuttle" },
  { slug: "escort", title: "Escort" },
  { slug: "gladiatoria", title: "Gladiatoria" },
  { slug: "holo-blink", title: "Holo Blink" },
  { slug: "monster-hunt", title: "Monster Hunt" },
  { slug: "power-puzzle", title: "Power Puzzle" },
  { slug: "retrieve-and-extract", title: "Retrieve and Extract" },
  { slug: "secure-the-data", title: "Secure the Data" },
  { slug: "the-heist", title: "The Heist" },
  { slug: "the-mole", title: "The Mole" },
  { slug: "titanomachy", title: "Titanomachy" },
];

const CONTRACT_BY_SLUG = new Map(
  CONTRACT_OPTIONS.map((option) => [option.slug, option]),
);
const CONTRACT_BY_TITLE = new Map(
  CONTRACT_OPTIONS.map((option) => [option.title.toLowerCase(), option]),
);

function slugifyMission(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function contractSlugFromValue(value?: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (CONTRACT_BY_SLUG.has(raw)) return raw;

  const byTitle = CONTRACT_BY_TITLE.get(raw.toLowerCase());
  if (byTitle) return byTitle.slug;

  const slug = slugifyMission(raw);
  return CONTRACT_BY_SLUG.has(slug) ? slug : slug;
}

export function contractTitleFromValue(value?: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const bySlug = CONTRACT_BY_SLUG.get(raw);
  if (bySlug) return bySlug.title;

  const byTitle = CONTRACT_BY_TITLE.get(raw.toLowerCase());
  if (byTitle) return byTitle.title;

  const slug = contractSlugFromValue(raw);
  const byNormalizedSlug = CONTRACT_BY_SLUG.get(slug);
  if (byNormalizedSlug) return byNormalizedSlug.title;

  return raw;
}

export function contractHrefFromValue(value?: string): string | null {
  const slug = contractSlugFromValue(value);
  if (!slug) return null;
  return `/contracts/embed/${slug}/`;
}

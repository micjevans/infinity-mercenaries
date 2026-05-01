import metadata from "../../data/infinity/factions/metadata.json";
import type { FactionData, FactionMetadata, MetadataItem } from "./types";

export const infinityMetadata = metadata as Record<string, any> & {
  factions: FactionMetadata[];
};

const factionModules = import.meta.glob([
  "../../data/infinity/factions/*.json",
  "!../../data/infinity/factions/metadata*.json"
]);

export const factionList = infinityMetadata.factions;

export function findFactionBySlug(slug: string): FactionMetadata | undefined {
  return factionList.find((faction) => faction.slug === slug);
}

export async function loadFactionData(slug: string): Promise<FactionData | null> {
  const loader = factionModules[`../../data/infinity/factions/${slug}.json`];
  if (!loader) return null;
  return ((await loader()) as { default: FactionData }).default;
}

export async function loadFactionDataSet(slugs: string[]): Promise<FactionData[]> {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];
  const loaded = await Promise.all(uniqueSlugs.map((slug) => loadFactionData(slug)));
  return loaded.filter((data): data is FactionData => Boolean(data));
}

export function convertCmToInches(cm: number): number {
  return Math.round(cm / 2.54);
}

export function renderStat(stat: unknown): string | number {
  if (Array.isArray(stat)) {
    const converted = stat.map((value) => convertCmToInches(Number(value)));
    return converted.length > 1 ? `${converted[0]}-${converted[1]}` : converted[0] ?? "-";
  }

  if (typeof stat === "number") return stat === 255 ? "T" : stat;
  if (stat !== undefined && stat !== null && stat !== "") return String(stat);
  return "-";
}

export function mapItemData(item: MetadataItem | null | undefined): MetadataItem[] {
  if (!item?.key || item.id === undefined) return [];
  const entries = (infinityMetadata[item.key] || []) as MetadataItem[];

  return entries
    .filter((entry) => entry.id === item.id && (item.type ? entry.type === item.type : true))
    .map((entry) => ({ ...entry, ...item }));
}

export function getExtra(extraId: string | number): MetadataItem | string | number {
  const found = ((infinityMetadata.extras || []) as MetadataItem[]).find((extra) => extra.id === extraId);
  return found ?? extraId;
}

export function mapType(typeId: string | number): string | number {
  const found = ((infinityMetadata.type || []) as MetadataItem[]).find((type) => type.id === typeId);
  return found?.name ?? typeId;
}

export function mapCategory(categoryId: string | number): string | number | null {
  const found = ((infinityMetadata.category || []) as MetadataItem[]).find((category) => category.id === categoryId);
  return found?.name ?? null;
}

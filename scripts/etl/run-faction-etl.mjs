#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { validateFactionDirectory } from "./validate-faction-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ARMY_BASE_URL = "https://infinityuniverse.com/army/infinity";
const FACTION_DATA_API = "https://api.corvusbelli.com/army/units/en";
const ADDITIONS_PATH = path.join(__dirname, "additions.json");

async function writeJson(filePath, data) {
  const body = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, body, "utf8");
}

function mergeAdditions(metadataJson, additions) {
  for (const key of Object.keys(additions)) {
    if (!metadataJson[key]) {
      metadataJson[key] = additions[key];
    } else {
      metadataJson[key] = metadataJson[key].map((item) => ({
        ...item,
        ...additions[key].find((a) => a.id === item.id),
      }));
    }
  }
}

async function runScraper(outputDir, dryRun) {
  // Dynamic import so the script still loads even if playwright isn't installed yet
  const { chromium } = await import("playwright");

  await fs.mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // --- Load metadata by intercepting the /metadata network response ---
  console.log("Loading army builder and intercepting metadata...");
  const [metadataResponse] = await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/metadata") && resp.status() === 200,
      { timeout: 15000 },
    ),
    page.goto(ARMY_BASE_URL, { waitUntil: "networkidle" }),
  ]);

  // Dismiss cookie banner if present
  try {
    await page.waitForSelector(
      "xpath=//html/body/div[2]/div/div/div/div/div[2]/div[2]/button[3]",
      { timeout: 3000 },
    );
    await page.click(
      "xpath=//html/body/div[2]/div/div/div/div/div[2]/div[2]/button[3]",
    );
  } catch {
    // no cookie banner, continue
  }

  let metadataJson;
  try {
    metadataJson = await metadataResponse.json();
  } catch (err) {
    await browser.close();
    throw new Error(`Failed to parse metadata JSON: ${err.message}`);
  }

  const factions = metadataJson?.factions ?? [];
  if (!Array.isArray(factions) || factions.length === 0) {
    await browser.close();
    throw new Error("No factions found in metadata response.");
  }

  console.log(`Found ${factions.length} factions.`);

  // Accumulate extras from faction filter data into metadata (mirrors original scraper)
  const additionsMaps = [
    { id: "extras", map: new Map() },
    { id: "category", map: new Map() },
    { id: "type", map: new Map() },
    { id: "peripheral", map: new Map() },
  ];

  let saved = 0;
  let skipped = 0;

  for (const faction of factions) {
    const { id, slug } = faction;
    if (!id || !slug) {
      console.log(`  Skipping faction (missing id/slug):`, faction);
      skipped += 1;
      continue;
    }

    console.log(`  Processing: ${slug} (id: ${id})`);

    if (dryRun) {
      console.log(
        `  [dry-run] would fetch ${FACTION_DATA_API}/${id} -> ${slug}.json`,
      );
      skipped += 1;
      continue;
    }

    let factionData = null;
    try {
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url() === `${FACTION_DATA_API}/${id}` && resp.status() === 200,
          { timeout: 10000 },
        ),
        page.goto(`${ARMY_BASE_URL}/${slug}/`, { waitUntil: "networkidle" }),
      ]);
      factionData = await response.json();
    } catch (err) {
      console.warn(
        `  No valid response for ${slug} (id: ${id}): ${err.message}`,
      );
      skipped += 1;
      continue;
    }

    // Accumulate filter extras into metadata
    if (factionData?.filters) {
      for (const entry of additionsMaps) {
        const items = factionData.filters[entry.id];
        if (Array.isArray(items)) {
          for (const item of items) {
            if (!entry.map.has(item.id)) entry.map.set(item.id, item);
          }
        }
      }
    }

    await writeJson(path.join(outputDir, `${slug}.json`), factionData);
    saved += 1;
  }

  // Merge accumulated filter data back into metadata
  for (const entry of additionsMaps) {
    metadataJson[entry.id] = Array.from(entry.map.values());
  }

  // Merge static additions.json supplement
  try {
    const additions = JSON.parse(await fs.readFile(ADDITIONS_PATH, "utf8"));
    mergeAdditions(metadataJson, additions);
    console.log("Merged additions.json into metadata.");
  } catch (err) {
    console.warn(`Could not load additions.json: ${err.message}`);
  }

  if (!dryRun) {
    await writeJson(path.join(outputDir, "metadata.json"), metadataJson);
    console.log("Saved metadata.json.");
  } else {
    console.log("[dry-run] would save metadata.json.");
  }

  await browser.close();
  return { saved, skipped };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const outputDir = path.resolve("src/data/infinity/factions");

  console.log(`ETL starting (dryRun=${dryRun}, output=${outputDir})`);

  const { saved, skipped } = await runScraper(outputDir, dryRun);
  console.log(`\nETL complete: ${saved} saved, ${skipped} skipped.`);

  if (dryRun) {
    console.log("Skipped post-ETL validation in dry-run mode.");
    return;
  }

  const validation = await validateFactionDirectory(outputDir);
  if (!validation.ok) {
    console.error("Validation failed after ETL sync:");
    for (const issue of validation.issues) {
      console.error(`  - ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Validation passed (${validation.summary.validatedFactionCount}/${validation.summary.factionCount} factions).`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

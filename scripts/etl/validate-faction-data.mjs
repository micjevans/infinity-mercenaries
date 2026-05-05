#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assert(condition, message, issues) {
  if (!condition) issues.push(message);
}

function validateMetadataShape(metadata, issues) {
  assert(isObject(metadata), "metadata.json must be a JSON object", issues);
  if (!isObject(metadata)) return [];

  const factions = metadata.factions;
  assert(
    Array.isArray(factions),
    "metadata.json must include factions[]",
    issues,
  );
  if (!Array.isArray(factions)) return [];

  const normalizedFactions = [];
  factions.forEach((faction, index) => {
    const prefix = `metadata.factions[${index}]`;
    assert(isObject(faction), `${prefix} must be an object`, issues);
    if (!isObject(faction)) return;

    assert(
      typeof faction.id === "number",
      `${prefix}.id must be a number`,
      issues,
    );
    assert(
      typeof faction.parent === "number",
      `${prefix}.parent must be a number`,
      issues,
    );
    assert(
      typeof faction.name === "string",
      `${prefix}.name must be a string`,
      issues,
    );
    assert(
      typeof faction.slug === "string",
      `${prefix}.slug must be a string`,
      issues,
    );

    if (typeof faction.slug === "string") {
      normalizedFactions.push({
        slug: faction.slug,
        id: faction.id,
      });
    }
  });

  return normalizedFactions;
}

function validateFactionShape(slug, data, issues) {
  const prefix = `${slug}.json`;
  assert(isObject(data), `${prefix} must be a JSON object`, issues);
  if (!isObject(data)) return;

  if ("units" in data) {
    assert(
      Array.isArray(data.units),
      `${prefix}.units must be an array when present`,
      issues,
    );
  }

  if ("resume" in data) {
    assert(
      Array.isArray(data.resume),
      `${prefix}.resume must be an array when present`,
      issues,
    );
  }

  if ("specops" in data) {
    assert(
      isObject(data.specops),
      `${prefix}.specops must be an object when present`,
      issues,
    );
  }

  if (Array.isArray(data.units)) {
    data.units.forEach((unit, unitIndex) => {
      const unitPrefix = `${prefix}.units[${unitIndex}]`;
      assert(isObject(unit), `${unitPrefix} must be an object`, issues);
      if (!isObject(unit)) return;

      assert(unit.id !== undefined, `${unitPrefix}.id is required`, issues);
      assert(
        typeof unit.slug === "string",
        `${unitPrefix}.slug must be a string`,
        issues,
      );
      assert(
        typeof unit.isc === "string",
        `${unitPrefix}.isc must be a string`,
        issues,
      );

      const profileGroups = unit.profileGroups;
      assert(
        Array.isArray(profileGroups),
        `${unitPrefix}.profileGroups must be an array`,
        issues,
      );
      if (!Array.isArray(profileGroups)) return;

      profileGroups.forEach((group, groupIndex) => {
        const groupPrefix = `${unitPrefix}.profileGroups[${groupIndex}]`;
        assert(isObject(group), `${groupPrefix} must be an object`, issues);
        if (!isObject(group)) return;

        assert(
          Array.isArray(group.profiles),
          `${groupPrefix}.profiles must be an array`,
          issues,
        );
        assert(
          Array.isArray(group.options),
          `${groupPrefix}.options must be an array`,
          issues,
        );
      });
    });
  }
}

export async function validateFactionDirectory(factionsDir) {
  const issues = [];
  const metadataPath = path.join(factionsDir, "metadata.json");

  let metadata;
  try {
    metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
  } catch (error) {
    return {
      ok: false,
      issues: [`Failed to read metadata.json: ${error.message}`],
      summary: { factionCount: 0, validatedFactionCount: 0 },
    };
  }

  const factions = validateMetadataShape(metadata, issues);
  const metadataFactions = Array.isArray(metadata.factions)
    ? metadata.factions
    : [];
  const parentIds = new Set(metadataFactions.map((faction) => faction.parent));

  let validatedFactionCount = 0;
  for (const faction of factions) {
    const slug = faction.slug;
    const factionPath = path.join(factionsDir, `${slug}.json`);
    let raw;
    try {
      raw = await fs.readFile(factionPath, "utf8");
    } catch (error) {
      const isUmbrellaFaction = parentIds.has(faction.id);
      if (isUmbrellaFaction) {
        continue;
      }
      issues.push(`Missing faction file for slug \"${slug}\": ${factionPath}`);
      continue;
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (error) {
      issues.push(`${slug}.json is not valid JSON: ${error.message}`);
      continue;
    }

    validatedFactionCount += 1;
    validateFactionShape(slug, data, issues);
  }

  return {
    ok: issues.length === 0,
    issues,
    summary: {
      factionCount: factions.length,
      validatedFactionCount,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const factionsDir = path.resolve(
    args["factions-dir"] || "src/data/infinity/factions",
  );

  const result = await validateFactionDirectory(factionsDir);

  if (!result.ok) {
    console.error("Faction data validation failed:");
    for (const issue of result.issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Faction data validation passed (${result.summary.validatedFactionCount}/${result.summary.factionCount} factions).`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

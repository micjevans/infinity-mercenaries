// scraper.js
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

// Create a Map to accumulate unique extras across factions
let additionsMap = [
  { id: "extras", map: new Map() },
  { id: "category", map: new Map() },
  { id: "type", map: new Map() },
  { id: "peripheral", map: new Map() },
];

(async () => {
  // 1. Launch browser (headed mode so we can see it)
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 2. Parallel wait for metadata response + page goto
  const [metadataResponse] = await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes("/metadata") && resp.status() === 200,
      { timeout: 10000 }
    ),
    page.goto("https://infinityuniverse.com/army/infinity", {
      waitUntil: "networkidle",
    }),
  ]);

  // 2a. Click the "Accept All Cookies" button (if needed)
  try {
    await page.waitForSelector(
      "xpath=//html/body/div[2]/div/div/div/div/div[2]/div[2]/button[3]",
      { timeout: 3000 }
    );
    await page.click(
      "xpath=//html/body/div[2]/div/div/div/div/div[2]/div[2]/button[3]"
    );
  } catch (err) {
    console.warn("Cookie accept button not found or timed out. Continuing...");
  }

  // 3. Parse the metadata JSON to get the factions
  let metadataJson;
  try {
    metadataJson = await metadataResponse.json();
  } catch (err) {
    console.error("Failed to parse metadata as JSON:", err);
    await browser.close();
    process.exit(1);
  }

  const factions = metadataJson?.factions || [];
  if (!Array.isArray(factions) || factions.length === 0) {
    console.error("No factions found in the metadata response.");
    await browser.close();
    process.exit(1);
  }

  console.log(`Found ${factions.length} factions. Processing...`);

  // 3a. Save the entire metadata to "metadata.js" as a JS module
  //     (If you want it as JSON, just do metadata.json. But you asked for .js)
  try {
    const metadataJsPath = path.join(
      __dirname,
      "..",
      "frontend",
      "src",
      "data",
      "factions",
      "metadata.json"
    );
    const metadataContent = `export default ${JSON.stringify(
      metadataJson,
      null,
      2
    )};\n`;
    fs.writeFileSync(metadataJsPath, metadataContent, "utf-8");
    console.log(`Saved metadata to ${metadataJsPath}`);
  } catch (err) {
    console.error("Error writing metadata.js:", err);
  }

  // 4. Loop through each faction
  for (const faction of factions) {
    const { id, slug } = faction;
    if (!id || !slug) {
      console.log('Skipping faction due to missing "id" or "slug":', faction);
      continue;
    }

    console.log(`\nProcessing faction: ${slug} (id: ${id})`);

    // 5. Use Promise.all again so we catch the faction's request in parallel with the navigation
    let factionRes;
    try {
      const factionUrl = `https://infinityuniverse.com/army/infinity/${slug}/`;
      const [response] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url() === `https://api.corvusbelli.com/army/units/en/${id}` &&
            resp.status() === 200,
          { timeout: 5000 }
        ),
        page.goto(factionUrl, { waitUntil: "networkidle" }),
      ]);
      factionRes = response;
    } catch (err) {
      console.log(`No valid response found for faction ${slug} (id: ${id}).`);
      continue;
    }

    // 6. Parse the faction data
    let factionData = null;
    try {
      factionData = await factionRes.json();
    } catch (err) {
      console.log(`Error parsing JSON for faction ${slug}:`, err);
      continue;
    }

    // After successfully parsing factionData:
    if (factionData && factionData.filters) {
      additionsMap = additionsMap.map((addition) => {
        const { id } = addition;
        if (factionData.filters[id] && Array.isArray(factionData.filters[id])) {
          factionData.filters[id].forEach((item) => {
            if (!addition.map.has(item.id)) {
              addition.map.set(item.id, item);
            }
          });
        }
        return addition;
      });
    }

    // 7. If we have factionData, save it to a file named after the slug
    if (factionData) {
      const fileName = `${slug}.json`;
      try {
        const factionFilePath = path.join(
          __dirname,
          "..",
          "frontend",
          "src",
          "data",
          "factions",
          fileName
        );
        fs.writeFileSync(
          factionFilePath,
          JSON.stringify(factionData, null, 2),
          "utf-8"
        );
        console.log(`Saved response to ${factionFilePath}`);
      } catch (err) {
        console.error(`Error writing file ${fileName}:`, err);
      }
    } else {
      console.log(`No faction data found for ${slug} (id: ${id}).`);
    }
  }

  // After processing all factions and accumulating extras...
  additionsMap.forEach((addition) => {
    const combinedAdditions = Array.from(addition.map.values());
    metadataJson[addition.id] = combinedAdditions;
  });

  // Merge additions.json into metadataJson
  const additionsPath = path.resolve(__dirname, "additions.json");
  if (fs.existsSync(additionsPath)) {
    try {
      const additions = JSON.parse(fs.readFileSync(additionsPath, "utf8"));
      Object.keys(additions).forEach((key) => {
        // if the key is not in metadataJson, add it
        if (!metadataJson[key]) {
          metadataJson[key] = additions[key];
        }
        // otherwise add the additions to the existing key
        else {
          metadataJson[key] = metadataJson[key].map((item) => ({
            ...item,
            ...additions[key].find((i) => i.id === item.id), // Merge properties
          }));
        }
      });
      console.log("Merged additions.json into metadataJson");
    } catch (err) {
      console.error("Error reading or parsing additions.json:", err);
    }
  } else {
    console.log("additions.json not found at", additionsPath);
  }

  // Instead of exporting the metadata, save it as a plain JSON object.
  // Also, save to the correct path: data/factions/metadata.json
  const metadataPath = path.resolve(
    __dirname,
    "../frontend/src/data/factions/metadata.json"
  );
  try {
    fs.writeFileSync(
      metadataPath,
      JSON.stringify(metadataJson, null, 2),
      "utf8"
    );
    console.log(
      `metadata.json updated with combined extras at ${metadataPath}`
    );
  } catch (err) {
    console.error("Error writing updated metadata.json:", err);
  }

  // 8. Close the browser
  await browser.close();
  console.log("\nDone!");
})();

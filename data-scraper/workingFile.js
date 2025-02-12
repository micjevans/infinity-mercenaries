const fs = require("fs");
const path = require("path");

const jsonPath = path.join(
  __dirname,
  "../frontend/src/data/factions/metadata.json"
);

fs.readFile(jsonPath, "utf8", (err, jsonString) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  try {
    const workingJsonPath = "workingFile.json";

    const metadata = JSON.parse(jsonString);

    const workingJson = {
      equips: metadata.equips.map((equip) => ({
        id: equip.id,
        abbr: equip.name,
        cr: 0,
        swc: 0,
        slot: "accessory",
      })),
    };

    const workingContent = `${JSON.stringify(workingJson, null, 2)};\n`;

    fs.writeFileSync(workingJsonPath, workingContent, "utf-8");
  } catch (err) {
    console.error("Error parsing JSON:", err);
  }
});

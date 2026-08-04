// Uploads the "Fotografije" folder delivery (one subfolder per place, real
// team photography) to Sanity, REPLACING any existing photos on the matched
// offer — confirmed with the site owner, since these are meant to supersede
// the earlier Wikipedia/research-doc-sourced images. Combines the automated
// fuzzy match (scripts/data/fotografije-match-report.json) with manual
// resolutions for folders the matcher got wrong, couldn't resolve, or that
// are genuinely ambiguous (Serbian abbreviations, near-duplicate offers).
//
// Usage: node --env-file=.env scripts/import-fotografije-folders.mjs

import { readdir, readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = "/Users/dejanzvekic/Documents/1#SmarTour/Fotografije";
const REPORT_PATH = path.join(__dirname, "data", "fotografije-match-report.json");
const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

// Folders the automated matcher got wrong, missed entirely (Serbian
// abbreviations/synonyms it doesn't know: "PMF" = Faculty of Natural
// Sciences and Mathematics, "NS" = Novi Sad, etc.), or that are genuinely
// ambiguous between offers — resolved by hand, one at a time, this session.
// A folder mapped to two offer ids means two near-duplicate offers exist in
// Sanity for the same real place; both get the photos rather than guessing
// which is "canonical" (that cleanup is a separate, non-photo decision).
const MANUAL_RESOLUTIONS = {
  "Odžaci vila Ertl": ["offer-2746"], // Rope Factory "Ertl" (auto-matcher wrongly picked Vila Prezident)
  "Cementara Beočin": ["offer-2752"], // Beočin Cement Plant
  "Katakombe": ["offer-3013"], // Adventure Catacombs – Petrovaradin Fortress
  "Kulenijada Erdevik": ["offer-2449"], // Kulen festival
  "Most u Titelu": ["offer-2764"], // Railway Bridge over the Tisa
  "Most u Tomaševcu": ["offer-2767"], // Railway Bridge over the Tamiš
  "Zmajeve dečije": ["offer-2383"], // Zmaj Children Games
  "Ruta Osijek-Sombor folder": ["offer-2785"], // "Pannonian Route of Peace" Osijek–Sombor
  "Reformatorska NS": ["offer-2524"], // Reformed Christian Church (Novi Sad)
  "Šećerana Crvenka": ["offer-2749"], // Sugar Factory
  "Tisa cvetanje": ["offer-2428"], // Tisa Flower Festival Senta
  "Vršački breg": ["offer-2776"], // Vršac Mountains
  "Biciklizam Temišvar-Zrenjanin": ["offer-2791"], // Cycling route Timișoara–Zrenjanin
  "Ludoško jezero": ["offer-2803"], // Special Nature Reserve Ludaš Lake
  "Palićko jezero": ["offer-2800"], // Lake Palić
  "Palićko i Ludoško jezero": ["offer-2581"], // Palić Nature Park and Lake Ludaš
  "NS Sinagoga": ["offer-2527"], // Novi Sad Synagogue
  "Sinagoga": ["offer-2488"], // Subotica Synagogue (NS Sinagoga folder covers Novi Sad separately)
  "Beočin": ["offer-2494"], // Beočin Monastery (Cementara Beočin folder covers the cement plant separately)
  "Šišatovac": ["offer-2497"], // Šišatovac Monastery (not the unrelated Chichateau Winery)
  "Matica srpska": ["offer-2557"], // Matica Srpska and the Library of Matica Srpska
  "Kovilj": ["offer-2482"], // Kovilj Monastery (the nature reserve is covered by the "...rit" folders)
  "Koviljsko Petrovaradinski rit": ["offer-2566"], // Special Nature Reserve Koviljsko-Petrovaradinski Rit
  "2-Koviljsko petrovaradinski rit": ["offer-2566"], // same target, second photo batch
  "Carska bara": ["offer-2578"], // Special Nature Reserve Carska Bara
  "2.deo Carska bara": ["offer-2578"], // same target, second photo batch
  "Zasavica": ["offer-2572"], // Special Nature Reserve Zasavica
  "Deliblatska peščara": ["offer-2575"], // Special Nature Reserve Deliblato Sands
  "Deliblatska peščara 2": ["offer-2575"], // same target, second photo batch
  // Near-duplicate offer pairs — same real place, two separate Sanity docs.
  // Uploading to both rather than guessing which is canonical.
  "Fruška gora": ["offer-2563", "offer-2773"], // "National Park Fruška gora" vs "...Gora"
  "Kreativni distrikt NS": ["offer-2728", "offer-3052"], // Creative District (2 listings)
  "Kreativ district NS": ["offer-2728", "offer-3052"],
  "Muzej savremene umetnosti NS": ["offer-2590", "offer-3004"], // Museum of Contemporary Art (2 listings)
  "Muzej savremene um.2": ["offer-2590", "offer-3004"],
  "O-Obedska bara": ["offer-2569", "offer-2806"], // Special Nature Reserve Obedska Bara/bara (2 listings)
  "Obedska bara": ["offer-2569", "offer-2806"],
  "Svilara": ["offer-2731", "offer-3049"], // Cultural Station Svilara (2 listings)
  "Svilara 2": ["offer-2731", "offer-3049"],
  // No corresponding offer, or too generic (a whole city) to attach to one
  // specific listing — intentionally left unresolved.
  "Novi Sad": null,
  "Subotica": null,
  "Vršac": null,
  "Šebešfok kanal": null,
};

const { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN } = process.env;
if (!SANITY_API_TOKEN) {
  console.error(
    "Missing SANITY_API_TOKEN.\nCopy .env.example to .env, fill in a write-enabled token, then run:\n" +
      "  node --env-file=.env scripts/import-fotografije-folders.mjs",
  );
  process.exit(1);
}

const client = createClient({
  projectId: SANITY_PROJECT_ID ?? "yrilioxt",
  dataset: SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: SANITY_API_TOKEN,
  useCdn: false,
});

function sortFiles(files) {
  return [...files].sort((a, b) => {
    const na = parseInt((a.match(/(\d+)(?=\.[^.]+$)/) || [])[1] ?? "0", 10);
    const nb = parseInt((b.match(/(\d+)(?=\.[^.]+$)/) || [])[1] ?? "0", 10);
    return na - nb;
  });
}

async function main() {
  const report = JSON.parse(await readFile(REPORT_PATH, "utf8"));

  // byOffer: offerId -> Set of {folder, file} — one offer can be the target
  // of more than one folder (near-duplicate offers, or a "2" supplementary
  // batch folder).
  const byOffer = new Map();
  function addFolder(folder, files, offerIds) {
    for (const offerId of offerIds) {
      if (!byOffer.has(offerId)) byOffer.set(offerId, []);
      for (const file of files) byOffer.get(offerId).push({ folder, file });
    }
  }

  const resolvedFolders = new Set(Object.keys(MANUAL_RESOLUTIONS));
  for (const m of report.matches) {
    if (resolvedFolders.has(m.folder)) continue; // manual override takes priority
    addFolder(m.folder, m.files, [m.offerId]);
  }
  for (const [folder, offerIds] of Object.entries(MANUAL_RESOLUTIONS)) {
    if (!offerIds) continue; // intentionally unresolved
    const dir = path.join(ROOT, folder);
    const files = (await readdir(dir, { withFileTypes: true }))
      .filter((e) => e.isFile())
      .map((e) => e.name.normalize("NFC"))
      .filter((n) => IMAGE_EXT.test(n));
    addFolder(folder, files, offerIds);
  }

  console.log(`Offers to update: ${byOffer.size}`);

  let offersUpdated = 0;
  let filesUploaded = 0;
  let filesFailed = 0;

  for (const [offerId, items] of byOffer) {
    const offer = await client.fetch(`*[_id == $id][0]{_id, "photoCount": count(photos)}`, { id: offerId });
    if (!offer) {
      console.log(`SKIP (offer not found): ${offerId}`);
      continue;
    }

    const sorted = sortFiles(items.map((i) => i.file)).map((file) => items.find((i) => i.file === file));
    const photoEntries = [];
    for (const { folder, file } of sorted) {
      const filePath = path.join(ROOT, folder, file);
      try {
        const asset = await client.assets.upload("image", createReadStream(filePath), { filename: file });
        photoEntries.push({
          _type: "image",
          _key: asset._id.replace(/[^a-zA-Z0-9]/g, "").slice(-24),
          asset: { _type: "reference", _ref: asset._id },
        });
        console.log(`  uploaded: ${folder}/${file}`);
        filesUploaded++;
      } catch (err) {
        console.error(`  FAILED: ${folder}/${file} (${err.message})`);
        filesFailed++;
      }
    }

    if (photoEntries.length === 0) continue;

    // Replace mode: clear whatever photos exist (from the earlier
    // Wikipedia/research-doc pass), then set the new ones.
    await client.patch(offerId).set({ photos: photoEntries }).commit();
    console.log(`OK: ${offerId} (was ${offer.photoCount} photo(s)) -> ${photoEntries.length} new photo(s)`);
    offersUpdated++;
  }

  console.log("\n=== DONE ===");
  console.log("offers updated:", offersUpdated);
  console.log("files uploaded:", filesUploaded);
  console.log("files failed:", filesFailed);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

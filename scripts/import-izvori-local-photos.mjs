// Uploads photos that were embedded directly in the team's "Izvori.docx"
// research doc (exported as a zipped web page, which bundles every embedded
// image as a real file — see IMAGES_DIR) to their matching offer's `photos`
// gallery. Only touches offers that currently have zero photos. Safe to
// re-run — skips any offer that already has photos.
//
// The candidates file pairs each offer with local image filenames (parsed
// from the exported HTML's <img> tags, associated to the nearest preceding
// "Title EN:" block — see the one-off parsing done in-session, not
// reproduced here since it depended on the specific docx export).
//
// Usage: node --env-file=.env scripts/import-izvori-local-photos.mjs

import { readFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CANDIDATES_PATH = path.join(__dirname, "data", "izvori-photo-candidates-local.json");
const IMAGES_DIR = "/private/tmp/claude-501/-Users-dejanzvekic-Documents-Claude-Code-First-Project/5cec9621-be79-4f2b-aa79-cfbf873c50df/scratchpad/izvori-export/images";

const { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN } = process.env;
if (!SANITY_API_TOKEN) {
  console.error(
    "Missing SANITY_API_TOKEN.\nCopy .env.example to .env, fill in a write-enabled token, then run:\n" +
      "  node --env-file=.env scripts/import-izvori-local-photos.mjs",
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

async function main() {
  const candidates = JSON.parse(await readFile(CANDIDATES_PATH, "utf8"));
  console.log(`Offers to attempt: ${candidates.length}`);

  let offersUpdated = 0;
  let offersSkippedHadPhotos = 0;
  let filesUploaded = 0;
  let filesFailed = 0;

  for (const c of candidates) {
    const offer = await client.fetch(`*[_id == $id][0]{_id, "photoCount": count(photos)}`, { id: c.matchedOfferId });
    if (!offer) {
      console.log(`SKIP (offer not found): ${c.matchedOfferId}`);
      continue;
    }
    if (offer.photoCount > 0) {
      console.log(`SKIP (already has ${offer.photoCount} photo(s)): ${c.matchedOfferId} — "${c.title}"`);
      offersSkippedHadPhotos++;
      continue;
    }

    const photoEntries = [];
    for (const img of c.images) {
      const filePath = path.join(IMAGES_DIR, img.file);
      if (!existsSync(filePath)) {
        console.error(`  NOT FOUND ON DISK: ${img.file}`);
        filesFailed++;
        continue;
      }
      try {
        const asset = await client.assets.upload("image", createReadStream(filePath), { filename: img.file });
        photoEntries.push({
          _type: "image",
          _key: asset._id.replace(/[^a-zA-Z0-9]/g, "").slice(-24),
          asset: { _type: "reference", _ref: asset._id },
        });
        console.log(`  uploaded: ${img.file}`);
        filesUploaded++;
      } catch (err) {
        console.error(`  UPLOAD FAILED: ${img.file} (${err.message})`);
        filesFailed++;
      }
    }

    if (photoEntries.length === 0) continue;

    await client.patch(c.matchedOfferId).setIfMissing({ photos: [] }).append("photos", photoEntries).commit();
    console.log(`OK: ${c.matchedOfferId} — "${c.title}" (${photoEntries.length}/${c.images.length} photo(s))`);
    offersUpdated++;
  }

  console.log("\n=== DONE ===");
  console.log("offers updated:", offersUpdated);
  console.log("offers skipped (already had photos):", offersSkippedHadPhotos);
  console.log("files uploaded:", filesUploaded);
  console.log("files failed:", filesFailed);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Uploads the Hungarian partner's DKMT photo set to the matching offers.
// The partner shipped an authoritative filename -> database-ID mapping
// (DKMT_kepegyeztetes_HU_EN_SRB.xlsx), exported to scripts/data/dkmt-photo-map.json
// by a one-off Python step, so no fuzzy matching is needed here.
//
// Photos are read from DKMT_PHOTO_DIR — web-sized copies (long edge 2560px,
// JPEG q85) of the originals, since the originals total ~8.8 GB. Skips any
// offer that already has photos, so it is safe to re-run.
//
// Usage: DKMT_PHOTO_DIR=/path/to/resized node --env-file=.env scripts/import-dkmt-photos.mjs [--limit N]

import { readFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAP_PATH = path.join(__dirname, "data", "dkmt-photo-map.json");
const PHOTO_DIR = process.env.DKMT_PHOTO_DIR;
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const UPLOAD_TIMEOUT_MS = 120_000;
const UPLOAD_ATTEMPTS = 3;

const { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN } = process.env;
if (!SANITY_API_TOKEN || !PHOTO_DIR) {
  console.error("Need SANITY_API_TOKEN (in .env) and DKMT_PHOTO_DIR (folder with the resized photos).");
  process.exit(1);
}

const client = createClient({
  projectId: SANITY_PROJECT_ID ?? "yrilioxt",
  dataset: SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: SANITY_API_TOKEN,
  useCdn: false,
});

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function uploadWithRetry(file, filePath) {
  let lastErr;
  for (let attempt = 1; attempt <= UPLOAD_ATTEMPTS; attempt++) {
    try {
      return await withTimeout(
        client.assets.upload("image", createReadStream(filePath), { filename: file }),
        UPLOAD_TIMEOUT_MS,
      );
    } catch (err) {
      lastErr = err;
      console.error(`  retry ${attempt}/${UPLOAD_ATTEMPTS} for ${file}: ${err.message}`);
    }
  }
  throw lastErr;
}

async function main() {
  const { offers } = JSON.parse(await readFile(MAP_PATH, "utf8"));
  const ids = Object.keys(offers);
  console.log(`Offers in map: ${ids.length}, photos: ${Object.values(offers).flat().length}`);

  const existing = await client.fetch(`*[_id in $ids]{_id, "photoCount": count(photos)}`, { ids });
  const hasPhotos = new Set(existing.filter((o) => o.photoCount > 0).map((o) => o._id));
  const present = new Set(existing.map((o) => o._id));

  let updated = 0;
  let skipped = 0;
  let missingOffer = 0;
  let uploaded = 0;
  let failed = 0;

  for (const id of ids) {
    if (updated >= LIMIT) break;
    if (!present.has(id)) {
      console.log(`SKIP (offer not found): ${id}`);
      missingOffer++;
      continue;
    }
    if (hasPhotos.has(id)) {
      skipped++;
      continue;
    }

    const entries = [];
    for (const file of offers[id]) {
      const filePath = path.join(PHOTO_DIR, file);
      if (!existsSync(filePath)) {
        console.error(`  NOT FOUND: ${file}`);
        failed++;
        continue;
      }
      try {
        const asset = await uploadWithRetry(file, filePath);
        entries.push({
          _type: "image",
          _key: asset._id.replace(/[^a-zA-Z0-9]/g, "").slice(-24),
          asset: { _type: "reference", _ref: asset._id },
        });
        uploaded++;
      } catch (err) {
        console.error(`  FAILED: ${file} (${err.message})`);
        failed++;
      }
    }

    if (!entries.length) continue;
    await client.patch(id).setIfMissing({ photos: [] }).append("photos", entries).commit();
    updated++;
    console.log(`OK ${updated}: ${id} (${entries.length}/${offers[id].length})`);
  }

  console.log("\n=== DONE ===");
  console.log("offers updated:", updated);
  console.log("offers skipped (already had photos):", skipped);
  console.log("offers not found:", missingOffer);
  console.log("files uploaded:", uploaded);
  console.log("files failed:", failed);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

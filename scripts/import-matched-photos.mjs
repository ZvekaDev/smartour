// Uploads local photo files to Sanity and attaches them to their matching
// offer's `photos` gallery, based on scripts/data/photo-match-report.json
// (produced by scripts/match-unmatched-photos.mjs) plus a handful of manual
// resolutions for filename groups the matcher correctly flagged as
// ambiguous (confirmed with the site owner).
//
// Skips any offer that already has photos, so it's safe to re-run.
//
// Usage: node --env-file=.env scripts/import-matched-photos.mjs

import { readFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.join(__dirname, "data", "photo-match-report.json");
const ROOT = "/Users/dejanzvekic/Documents/1#SmarTour/Mapping_Natasa/FOTOGRAFIJE";
const UNMATCHED_DIR = path.join(ROOT, "Unmatched");

// Manual resolutions for groups scripts/match-unmatched-photos.mjs flagged as
// ambiguous (multiple same-brand hotels / near-identical wellness-center
// names) — confirmed with the site owner rather than guessed.
const MANUAL_RESOLUTIONS = [
  { base: "HOGO Wellness i Spa", offerId: "offer-new-hotel-hogo" },
  { base: "Hotel Prezident", offerId: "offer-new-hotel-prezident" },
  { base: "Premier Prezident Hotel – Velnes i Spa Sremski Karlovci", offerId: "offer-new-premier-prezident-hotel" },
  { base: "Prezident Wellness & Spa Centar Novi Sad", offerId: "offer-new-prezident-hotel" },
  { base: "Prezident Wellness & Spa Centar Palić", offerId: "offer-new-hotel-prezident" },
];

const { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN } = process.env;
if (!SANITY_API_TOKEN) {
  console.error(
    "Missing SANITY_API_TOKEN.\nCopy .env.example to .env, fill in a write-enabled token, then run:\n" +
      "  node --env-file=.env scripts/import-matched-photos.mjs",
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

function resolveFilePath(filename) {
  const inRoot = path.join(ROOT, filename);
  if (existsSync(inRoot)) return inRoot;
  const inUnmatched = path.join(UNMATCHED_DIR, filename);
  if (existsSync(inUnmatched)) return inUnmatched;
  return null;
}

function sortFiles(files) {
  return [...files].sort((a, b) => {
    const na = parseInt((a.match(/(\d+)(?=\.[^.]+$)/) || [])[1] ?? "0", 10);
    const nb = parseInt((b.match(/(\d+)(?=\.[^.]+$)/) || [])[1] ?? "0", 10);
    return na - nb;
  });
}

async function main() {
  const report = JSON.parse(await readFile(REPORT_PATH, "utf8"));

  // Group all files per offer (a single offer can be the target of more than
  // one filename group, e.g. "Fruške terme" + "Hotel Fruške terme").
  const byOffer = new Map(); // offerId -> { offerTitle, files: Set<string> }
  for (const m of report.matches) {
    if (!byOffer.has(m.offerId)) byOffer.set(m.offerId, { offerTitle: m.offerTitle, files: new Set() });
    for (const f of m.files) byOffer.get(m.offerId).files.add(f);
  }
  for (const r of MANUAL_RESOLUTIONS) {
    const group = report.ambiguous.find((a) => a.base === r.base);
    if (!group) {
      console.warn(`WARN: manual resolution base "${r.base}" not found in ambiguous list (already resolved differently?)`);
      continue;
    }
    if (!byOffer.has(r.offerId)) byOffer.set(r.offerId, { offerTitle: null, files: new Set() });
    for (const f of group.files) byOffer.get(r.offerId).files.add(f);
  }

  console.log(`Offers to update: ${byOffer.size}`);

  let uploaded = 0;
  let skippedHadPhotos = 0;
  let failed = 0;
  let notFoundOnDisk = 0;

  for (const [offerId, { offerTitle, files }] of byOffer) {
    const offer = await client.fetch(`*[_id == $id][0]{_id, "photoCount": count(photos)}`, { id: offerId });
    if (!offer) {
      console.log(`SKIP (offer not found): ${offerId}`);
      continue;
    }
    if (offer.photoCount > 0) {
      console.log(`SKIP (already has ${offer.photoCount} photo(s)): ${offerId} — "${offerTitle}"`);
      skippedHadPhotos++;
      continue;
    }

    const sortedFiles = sortFiles([...files]);
    const photoEntries = [];
    for (const file of sortedFiles) {
      const filePath = resolveFilePath(file);
      if (!filePath) {
        console.error(`  NOT FOUND ON DISK: ${file}`);
        notFoundOnDisk++;
        continue;
      }
      try {
        const asset = await client.assets.upload("image", createReadStream(filePath), { filename: file });
        photoEntries.push({
          _type: "image",
          _key: asset._id.replace(/[^a-zA-Z0-9]/g, "").slice(-24),
          asset: { _type: "reference", _ref: asset._id },
        });
        console.log(`  uploaded: ${file}`);
      } catch (err) {
        console.error(`  FAILED to upload ${file}:`, err.message);
        failed++;
      }
    }

    if (photoEntries.length === 0) continue;

    await client.patch(offerId).setIfMissing({ photos: [] }).append("photos", photoEntries).commit();
    console.log(`OK: ${offerId} — "${offerTitle}" (${photoEntries.length} photo(s))`);
    uploaded++;
  }

  console.log("\n=== DONE ===");
  console.log("offers updated:", uploaded);
  console.log("offers skipped (already had photos):", skippedHadPhotos);
  console.log("files not found on disk:", notFoundOnDisk);
  console.log("individual file upload failures:", failed);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

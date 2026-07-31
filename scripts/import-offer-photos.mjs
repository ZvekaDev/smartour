// One-off import: uploads local photo files to Sanity and attaches them to
// their matching offer's `photos` gallery, based on a precomputed match
// report (see /tmp/match_report_v2.json, produced by a filename<->offer-title
// matching pass run in-session — not reproducible standalone, kept here only
// as the applied-import record).
//
// Skips any offer that already has photos, so it's safe to re-run without
// duplicating existing galleries.
//
// Usage: node --env-file=.env scripts/import-offer-photos.mjs

import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";

const FOLDER = "/Users/dejanzvekic/Documents/1#SmarTour/Mapping_Natasa/FOTOGRAFIJE";
const MATCH_REPORT = "/tmp/match_report_v2.json";

const projectId = process.env.SANITY_PROJECT_ID ?? "yrilioxt";
const dataset = process.env.SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_TOKEN;

if (!token) {
  console.error("SANITY_API_TOKEN is required (write-scoped). Run with: node --env-file=.env scripts/import-offer-photos.mjs");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2024-01-01", token, useCdn: false });

const report = JSON.parse(fs.readFileSync(MATCH_REPORT, "utf8"));

// Order files within a group by their trailing numeric index (if present), so
// "X 1.jpg", "X 2.jpg", "X 3.jpg" upload in a sane order.
function sortFiles(files) {
  return [...files].sort((a, b) => {
    const na = parseInt((a.match(/(\d+)(?=\.[^.]+$)/) || [])[1] ?? "0", 10);
    const nb = parseInt((b.match(/(\d+)(?=\.[^.]+$)/) || [])[1] ?? "0", 10);
    return na - nb;
  });
}

let uploaded = 0;
let skippedHadPhotos = 0;
let failed = 0;

for (const group of report.perfectUnambiguous) {
  const offer = await client.fetch(`*[_id == $id][0]{_id, "photoCount": count(photos)}`, { id: group.offerId });
  if (!offer) {
    console.log(`SKIP (offer not found): ${group.offerId}`);
    continue;
  }
  if (offer.photoCount > 0) {
    console.log(`SKIP (already has ${offer.photoCount} photo(s)): ${group.offerId} — "${group.matchedTitle}"`);
    skippedHadPhotos++;
    continue;
  }

  const files = sortFiles(group.files);
  const photoEntries = [];
  for (const file of files) {
    const filePath = path.join(FOLDER, file);
    try {
      const asset = await client.assets.upload("image", fs.createReadStream(filePath), { filename: file });
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

  await client
    .patch(group.offerId)
    .setIfMissing({ photos: [] })
    .append("photos", photoEntries)
    .commit();

  console.log(`OK: ${group.offerId} — "${group.matchedTitle}" (${photoEntries.length} photo(s))`);
  uploaded++;
}

console.log("\n=== DONE ===");
console.log("offers updated:", uploaded);
console.log("offers skipped (already had photos):", skippedHadPhotos);
console.log("individual file upload failures:", failed);

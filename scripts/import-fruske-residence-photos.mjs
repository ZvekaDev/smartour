// One-off fix: a later team photo delivery ("TO SEND/FOTOGRAFIJE") was
// almost entirely duplicates of the earlier delivery (612 of 618 files
// matched by filename), but included 3 genuinely new photos for "Fruške
// Residence" — the one offer from the new-offers batch that had no photo
// match at all. Skips if the offer already has photos, so safe to re-run.
//
// Usage: node --env-file=.env scripts/import-fruske-residence-photos.mjs

import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";

const FOLDER = "/Users/dejanzvekic/Documents/1#SmarTour/TO SEND/FOTOGRAFIJE";
const OFFER_ID = "offer-new-fruske-residence";
const FILES = ["Fruške Residence 1.jpg", "Fruške Residence 2.jpg", "Fruške Residence 3.jpg"];

const projectId = process.env.SANITY_PROJECT_ID ?? "yrilioxt";
const dataset = process.env.SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_TOKEN;
if (!token) {
  console.error("SANITY_API_TOKEN is required (write-scoped). Run with: node --env-file=.env scripts/import-fruske-residence-photos.mjs");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2024-01-01", token, useCdn: false });

const offer = await client.fetch(`*[_id == $id][0]{_id, "photoCount": count(photos)}`, { id: OFFER_ID });
if (!offer) {
  console.log(`SKIP (offer not found): ${OFFER_ID}`);
  process.exit(0);
}
if (offer.photoCount > 0) {
  console.log(`SKIP (already has ${offer.photoCount} photo(s)): ${OFFER_ID}`);
  process.exit(0);
}

const photoEntries = [];
for (const file of FILES) {
  const asset = await client.assets.upload("image", fs.createReadStream(path.join(FOLDER, file)), { filename: file });
  photoEntries.push({
    _type: "image",
    _key: asset._id.replace(/[^a-zA-Z0-9]/g, "").slice(-24),
    asset: { _type: "reference", _ref: asset._id },
  });
  console.log(`  uploaded: ${file}`);
}

await client.patch(OFFER_ID).setIfMissing({ photos: [] }).append("photos", photoEntries).commit();
console.log(`OK: ${OFFER_ID} (${photoEntries.length} photo(s))`);

// One-off fix, applied once (see CLAUDE.md's note on the offer-pair review):
// while comparing 5 pairs of offers that looked like accidental duplicates
// (same landmark, two Sanity docs from separate import passes), the pairs
// turned out to be intentionally distinct — each landmark gets a separate
// offer per tourism category (e.g. Fruška Gora as "educational and research"
// vs. "active and sports"). But the review surfaced two real bugs, fixed
// here:
//
// 1. Six offers had a photo asset listed twice in their `photos` array
//    (offer-2569, offer-2806, offer-2728, offer-3052, offer-2731,
//    offer-3049) — an artifact of the fuzzy title-matching photo-import
//    script matching the same photo set to both docs in a pair.
// 2. Two offers (offer-2728 "Creative District", offer-2590 "MSUV") had
//    geocoded coordinates ~12km southwest of their real Novi Sad location.
//    Fixed by copying the coordinates from their same-address sibling offer
//    (offer-3052, offer-3004 respectively), which geocoded correctly.
//
// Kept as a record of the applied fix, not meant to run standalone again —
// re-running is harmless (dedupe is idempotent, coordinate patch just
// re-sets the same value) but the underlying data no longer has the bug.
//
// Usage: node --env-file=.env scripts/fix-fruske-svilara-msuv-duplicates.mjs

import { createClient } from "@sanity/client";

const { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN } = process.env;
if (!SANITY_API_TOKEN) {
  console.error(
    "Missing SANITY_API_TOKEN.\nCopy .env.example to .env, fill in a write-enabled token, then run:\n" +
      "  node --env-file=.env scripts/fix-fruske-svilara-msuv-duplicates.mjs",
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

const PHOTO_DEDUPE_IDS = [
  "offer-2569",
  "offer-2806",
  "offer-2728",
  "offer-3052",
  "offer-2731",
  "offer-3049",
];

const COORD_FIXES = [
  // offer-2728 (Creative District, industrial-heritage) -> copy from
  // offer-3052, same address "Bulevar despota Stefana 5"
  { id: "offer-2728", location: { _type: "geopoint", lat: 45.2628, lng: 19.8245 } },
  // offer-2590 (MSUV, educational) -> copy from offer-3004, same address
  // "Dunavska 37"
  { id: "offer-2590", location: { _type: "geopoint", lat: 45.2596, lng: 19.8437 } },
];

function dedupePhotos(photos) {
  const seen = new Set();
  const deduped = [];
  for (const photo of photos) {
    const ref = photo?.asset?._ref;
    if (ref && seen.has(ref)) continue;
    if (ref) seen.add(ref);
    deduped.push(photo);
  }
  return deduped;
}

for (const id of PHOTO_DEDUPE_IDS) {
  const doc = await client.getDocument(id);
  if (!doc) {
    console.error(`  SKIP ${id}: not found`);
    continue;
  }
  const before = doc.photos?.length ?? 0;
  const deduped = dedupePhotos(doc.photos ?? []);
  if (deduped.length === before) {
    console.log(`  ${id}: no duplicates found (${before} photos), skipping`);
    continue;
  }
  await client.patch(id).set({ photos: deduped }).commit();
  console.log(`  ${id}: photos ${before} -> ${deduped.length}`);
}

for (const { id, location } of COORD_FIXES) {
  const doc = await client.getDocument(id);
  if (!doc) {
    console.error(`  SKIP ${id}: not found`);
    continue;
  }
  console.log(`  ${id}: location ${JSON.stringify(doc.location)} -> ${JSON.stringify(location)}`);
  await client.patch(id).set({ location }).commit();
}

console.log("Done.");

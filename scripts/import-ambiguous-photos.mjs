import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";

const FOLDER = "/Users/dejanzvekic/Documents/1#SmarTour/Mapping_Natasa/FOTOGRAFIJE";

const projectId = process.env.SANITY_PROJECT_ID ?? "yrilioxt";
const dataset = process.env.SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_TOKEN;
if (!token) {
  console.error("SANITY_API_TOKEN required");
  process.exit(1);
}
const client = createClient({ projectId, dataset, apiVersion: "2024-01-01", token, useCdn: false });

const resolutions = [
  { offerId: "offer-3157", label: "Majkin salaš", files: ["Majkin salaš 1.jpg", "Majkin salaš 2.jpg", "Majkin salaš 3.jpg"] },
  { offerId: "offer-2635", label: "Salaš 137", files: ["Salaš 137 1.png", "Salaš 137 2.png", "Salaš 137 3.png"] },
  {
    offerId: "offer-3202",
    label: "Salaš 137 Accomodation",
    files: ["Salaš 137 Accomodation  1.png", "Salaš 137 Accomodation 2.jpg", "Salaš 137 Accomodation 3.jpg"],
  },
];

for (const r of resolutions) {
  const offer = await client.fetch(`*[_id == $id][0]{_id, "photoCount": count(photos)}`, { id: r.offerId });
  if (!offer) {
    console.log(`SKIP (not found): ${r.offerId}`);
    continue;
  }
  if (offer.photoCount > 0) {
    console.log(`SKIP (already has ${offer.photoCount} photo(s)): ${r.offerId} — "${r.label}"`);
    continue;
  }
  const photoEntries = [];
  for (const file of r.files) {
    const filePath = path.join(FOLDER, file);
    if (!fs.existsSync(filePath)) {
      console.error(`  MISSING FILE: ${file}`);
      continue;
    }
    const asset = await client.assets.upload("image", fs.createReadStream(filePath), { filename: file });
    photoEntries.push({
      _type: "image",
      _key: asset._id.replace(/[^a-zA-Z0-9]/g, "").slice(-24),
      asset: { _type: "reference", _ref: asset._id },
    });
    console.log(`  uploaded: ${file}`);
  }
  if (photoEntries.length === 0) continue;
  await client.patch(r.offerId).setIfMissing({ photos: [] }).append("photos", photoEntries).commit();
  console.log(`OK: ${r.offerId} — "${r.label}" (${photoEntries.length} photo(s))`);
}

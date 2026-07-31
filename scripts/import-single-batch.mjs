import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";

const FOLDER = "/Users/dejanzvekic/Documents/1#SmarTour/Mapping_Natasa/FOTOGRAFIJE";
const projectId = process.env.SANITY_PROJECT_ID ?? "yrilioxt";
const dataset = process.env.SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_TOKEN;
const client = createClient({ projectId, dataset, apiVersion: "2024-01-01", token, useCdn: false });

const resolutions = [
  { offerId: "offer-3082", label: "Akva park Palić -> Aqua Park Palić", files: ["Akva park Palić 1.jpg", "Akva park Palić 2.jpg", "Akva park Palić 3.jpg"] },
];

for (const r of resolutions) {
  const offer = await client.fetch(`*[_id == $id][0]{_id, "photoCount": count(photos)}`, { id: r.offerId });
  if (!offer || offer.photoCount > 0) {
    console.log(`SKIP: ${r.offerId}`);
    continue;
  }
  const photoEntries = [];
  for (const file of r.files) {
    const filePath = path.join(FOLDER, file);
    const asset = await client.assets.upload("image", fs.createReadStream(filePath), { filename: file });
    photoEntries.push({
      _type: "image",
      _key: asset._id.replace(/[^a-zA-Z0-9]/g, "").slice(-24),
      asset: { _type: "reference", _ref: asset._id },
    });
    console.log(`  uploaded: ${file}`);
  }
  await client.patch(r.offerId).setIfMissing({ photos: [] }).append("photos", photoEntries).commit();
  console.log(`OK: ${r.offerId} — "${r.label}" (${photoEntries.length} photo(s))`);
}

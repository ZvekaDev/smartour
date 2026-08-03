// Writes the "new offers" batch (scripts/data/new-offers-parsed.json, produced
// by scripts/parse-new-offers.mjs) into Sanity: any new town docs first, then
// the offer docs themselves. Safe to re-run — every document uses a
// deterministic _id and createOrReplace, so reruns update in place.
//
// Usage: node --env-file=.env scripts/import-new-offers.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";
import { slugify } from "./lib/normalize.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.join(__dirname, "data", "new-offers-parsed.json");
const LOCALES = ["en", "sr", "hu"];

const { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN } = process.env;
if (!SANITY_API_TOKEN) {
  console.error(
    "Missing SANITY_API_TOKEN.\nCopy .env.example to .env, fill in a write-enabled token, then run:\n" +
      "  node --env-file=.env scripts/import-new-offers.mjs",
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

function localeObject(record) {
  return { en: record.en, sr: record.sr, hu: record.hu };
}
function slugField(value) {
  return { _type: "slug", current: value };
}
function ref(id) {
  return { _type: "reference", _ref: id };
}

async function writeAll(label, docs, batchSize = 50) {
  let written = 0;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    const tx = client.transaction();
    for (const doc of batch) tx.createOrReplace(doc);
    await tx.commit();
    written += batch.length;
    process.stdout.write(`\r${label}: ${written}/${docs.length}`);
  }
  console.log("");
}

/** Generates a unique per-locale slug for a title, avoiding collisions with
 * both already-published offers and other offers in this same batch. */
function makeUniqueSlug(locale, title, usedSlugs) {
  const base = slugify(title) || "offer";
  let candidate = base;
  let n = 2;
  while (usedSlugs.get(locale).has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  usedSlugs.get(locale).add(candidate);
  return candidate;
}

async function main() {
  const report = JSON.parse(await readFile(REPORT_PATH, "utf8"));
  console.log(`Loaded report: ${report.offers.length} offers, ${report.newCounties.length} new counties, ${report.newTowns.length} new towns`);
  console.log(`Source: ${report.sourceFile}`);

  // --- New counties (none in this batch, but handle for completeness) -----
  if (report.newCounties.length) {
    const counties = report.newCounties.map((c) => ({
      _id: `county-${c.slug}`,
      _type: "county",
      names: { en: c.name, sr: c.name, hu: c.name },
      slug: slugField(c.slug),
      country: ref(`country-${c.countrySlug}`),
    }));
    await writeAll("New counties", counties);
  }

  // --- New towns ------------------------------------------------------------
  if (report.newTowns.length) {
    const towns = report.newTowns.map((t) => ({
      _id: `town-${t.slug}`,
      _type: "town",
      names: { en: t.name, sr: t.name, hu: t.name },
      slug: slugField(t.slug),
      county: ref(`county-${t.countySlug}`),
    }));
    await writeAll("New towns", towns);
  }

  // --- Offers -----------------------------------------------------------
  const existingSlugs = await client.fetch(
    `*[_type=="offer"]{"en": slugs.en.current, "sr": slugs.sr.current, "hu": slugs.hu.current}`,
  );
  const usedSlugs = new Map(LOCALES.map((l) => [l, new Set(existingSlugs.map((o) => o[l]).filter(Boolean))]));

  const offers = report.offers.map((o) => ({
    _id: o.id,
    _type: "offer",
    title: localeObject(o.title),
    slugs: {
      en: slugField(makeUniqueSlug("en", o.title.en, usedSlugs)),
      sr: slugField(makeUniqueSlug("sr", o.title.sr, usedSlugs)),
      hu: slugField(makeUniqueSlug("hu", o.title.hu, usedSlugs)),
    },
    description: localeObject(o.description),
    category: ref(`category-${o.category}`),
    photos: [],
    videos: [],
    country: ref(`country-${o.countrySlug}`),
    county: o.countySlug ? ref(`county-${o.countySlug}`) : undefined,
    town: o.townSlug ? ref(`town-${o.townSlug}`) : undefined,
    address: o.address ?? undefined,
    zip: o.zip ?? undefined,
    location: o.lat != null && o.lng != null ? { _type: "geopoint", lat: o.lat, lng: o.lng } : undefined,
    phone: o.phone ?? undefined,
    email: o.email ?? undefined,
    website: o.website ?? undefined,
    facebook: o.facebook ?? undefined,
    instagram: o.instagram ?? undefined,
    tiktok: o.tiktok ?? undefined,
  }));
  await writeAll("Offers", offers);

  console.log("\nImport complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

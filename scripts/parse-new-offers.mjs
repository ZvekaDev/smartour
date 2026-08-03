// Dry-run parser for the "new offers" batch import. Reads the source CSV,
// normalizes every field, resolves category/county/town against the live
// Sanity taxonomy (so new counties/towns reuse existing slugs instead of
// duplicating them), and writes a JSON report for review before anything is
// written to Sanity. Run `node scripts/import-new-offers.mjs` afterwards to
// actually write the data.
//
// Usage: node --env-file=.env scripts/parse-new-offers.mjs [path-to-csv]

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";
import { parseCsv } from "./lib/csv.mjs";
import {
  slugify,
  normalizeCoord,
  isPlausibleSerbiaCoord,
  cleanCounty,
  cleanAddress,
  cleanZip,
  cleanTownName,
  cleanPhone,
  cleanEmail,
  normalizeLink,
  cleanDescription,
  cleanTitle,
} from "./lib/normalize.mjs";

// Manually-resolved fixes for the handful of rows whose Town cell was
// malformed/ambiguous (combined labels, a region name instead of a town) —
// confirmed with the site owner row-by-row rather than guessed.
const TOWN_OVERRIDES = [
  { match: (t) => t.toLowerCase().includes("geological sites of fru"), town: "Ruma" },
  { match: (t) => t.toLowerCase().includes("roka"), town: "Nosa" },
  { match: (t) => t.toLowerCase().includes("vojvodinašume"), town: "Petrovaradin (Novi Sad)" },
  { match: (t) => t.toLowerCase().includes("icons painted on mushrooms"), town: "Rakovac" },
];
function findTownOverride(titleEn) {
  return TOWN_OVERRIDES.find((o) => o.match(titleEn));
}

// A single confirmed source typo: "Bačka Toplola" -> "Bačka Topola" (the
// real town, already in Sanity under North Bačka).
const TOWN_NAME_ALIASES = new Map([["bačka toplola", "Bačka Topola"]]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSV = "/Users/dejanzvekic/Documents/1#SmarTour/Import Template Smart Tourism - Sheet1.csv";
const OUT_PATH = path.join(__dirname, "data", "new-offers-parsed.json");

const CSV_PATH = process.argv[2] ?? DEFAULT_CSV;

// Column order (after the leading, always-empty index column):
const COLS = {
  category: 1,
  country: 2,
  county: 3,
  town: 4,
  zip: 5,
  address: 6,
  lat: 7,
  lng: 8,
  titleEn: 9,
  descEn: 10,
  titleSr: 11,
  descSr: 12,
  titleHu: 13,
  descHu: 14,
  phone: 15,
  email: 16,
  website: 17,
  facebook: 18,
  instagram: 19,
  tiktok: 20,
};

async function fetchSanityTaxonomy() {
  const { SANITY_PROJECT_ID, SANITY_DATASET } = process.env;
  const client = createClient({
    projectId: SANITY_PROJECT_ID ?? "yrilioxt",
    dataset: SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    useCdn: false,
  });
  const [counties, towns, categories, offerTitles] = await Promise.all([
    client.fetch(`*[_type=="county"]{_id, "name": names.en}`),
    client.fetch(`*[_type=="town"]{_id, "name": names.en, "countyId": county._ref}`),
    client.fetch(`*[_type=="category"]{_id, "name": names.en, "slug": slug.current}`),
    client.fetch(`*[_type=="offer"]{"title": title.en}`),
  ]);
  return { counties, towns, categories, offerTitles: new Set(offerTitles.map((o) => (o.title ?? "").trim().toLowerCase())) };
}

function byLowerName(list) {
  const m = new Map();
  for (const item of list) m.set(item.name.trim().toLowerCase(), item);
  return m;
}

async function main() {
  const csvText = await readFile(CSV_PATH, "utf8");
  const rows = parseCsv(csvText);
  console.log(`Read ${rows.length} raw CSV rows (incl. header) from:\n  ${CSV_PATH}`);

  const dataRows = rows.slice(1); // drop header row
  const { counties, towns, categories, offerTitles } = await fetchSanityTaxonomy();
  const countyByName = byLowerName(counties);
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  const newCounties = new Map(); // slug -> {slug, name}
  const newTowns = new Map(); // slug -> {slug, name, countySlug}
  const offers = [];
  const skipped = [];
  const warnings = [];
  const usedIds = new Map(); // id -> count, to disambiguate legitimate cross-category dupes

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    const rowNum = i + 2; // 1-based, +1 for header
    const categoryRaw = (r[COLS.category] ?? "").trim();
    if (!categoryRaw) {
      skipped.push({ rowNum, reason: "blank category (spacer row)" });
      continue;
    }

    const categorySlug = slugify(categoryRaw);
    const category = categoryBySlug.get(categorySlug);
    if (!category) {
      skipped.push({ rowNum, reason: `unknown category "${categoryRaw}" (slug ${categorySlug})` });
      continue;
    }

    const titleEn = cleanTitle(r[COLS.titleEn]);
    const titleSr = cleanTitle(r[COLS.titleSr]);
    const titleHu = cleanTitle(r[COLS.titleHu]);
    if (!titleEn || !titleSr || !titleHu) {
      skipped.push({ rowNum, reason: "missing a title in one or more locales", titleEn });
      continue;
    }

    if (offerTitles.has(titleEn.toLowerCase())) {
      skipped.push({ rowNum, reason: "already exists in Sanity (exact English title match)", titleEn });
      continue;
    }

    const countryRaw = (r[COLS.country] ?? "").trim() || "Serbia";
    const countrySlug = slugify(countryRaw);

    const countyNameRaw = cleanCounty(r[COLS.county]);

    // Resolve town first, matched by name against ALL existing towns
    // (regardless of county) — the CSV's county column has several confirmed
    // mismatches against already-correct Sanity data (e.g. Senta, Kovačica,
    // Beočin, Sremski Karlovci), so an existing name match wins and supplies
    // its own (already-vetted) county rather than trusting the CSV's county.
    const override = findTownOverride(titleEn);
    let townNameRaw = override ? override.town : cleanTownName(r[COLS.town]);
    if (townNameRaw) {
      const alias = TOWN_NAME_ALIASES.get(townNameRaw.toLowerCase());
      if (alias) townNameRaw = alias;
    }

    let countySlug = null;
    let townSlug = null;
    if (townNameRaw) {
      const existingTown = towns.find((t) => t.name.trim().toLowerCase() === townNameRaw.toLowerCase());
      if (existingTown) {
        townSlug = existingTown._id.replace(/^town-/, "");
        countySlug = existingTown.countyId.replace(/^county-/, "");
      }
    }

    if (!countySlug && countyNameRaw) {
      const existingCounty = countyByName.get(countyNameRaw.toLowerCase());
      if (existingCounty) {
        countySlug = existingCounty._id.replace(/^county-/, "");
      } else {
        countySlug = slugify(`${countrySlug}-${countyNameRaw}`);
        if (!newCounties.has(countySlug)) {
          newCounties.set(countySlug, { slug: countySlug, name: countyNameRaw, countrySlug });
        }
      }
    }

    if (townNameRaw && !townSlug && countySlug) {
      townSlug = slugify(`${countySlug}-${townNameRaw}`);
      if (!newTowns.has(townSlug)) {
        newTowns.set(townSlug, { slug: townSlug, name: townNameRaw, countySlug });
      }
    }

    const lat = normalizeCoord(r[COLS.lat]);
    const lng = normalizeCoord(r[COLS.lng]);
    if (!isPlausibleSerbiaCoord(lat, lng)) {
      warnings.push({ rowNum, titleEn, reason: "coordinates outside Serbia's bounding box", lat, lng });
    }

    let baseId = `offer-new-${slugify(titleEn)}`;
    let id = baseId;
    if (usedIds.has(baseId)) {
      id = `${baseId}-${categorySlug}`;
      if (usedIds.has(id)) id = `${baseId}-${categorySlug}-${usedIds.get(baseId) + 1}`;
    }
    usedIds.set(baseId, (usedIds.get(baseId) ?? 0) + 1);

    offers.push({
      id,
      category: categorySlug,
      countrySlug,
      countySlug,
      townSlug,
      title: { en: titleEn, sr: titleSr, hu: titleHu },
      description: {
        en: cleanDescription(r[COLS.descEn]),
        sr: cleanDescription(r[COLS.descSr]),
        hu: cleanDescription(r[COLS.descHu]),
      },
      address: cleanAddress(r[COLS.address]),
      zip: cleanZip(r[COLS.zip]),
      lat,
      lng,
      phone: cleanPhone(r[COLS.phone]),
      email: cleanEmail(r[COLS.email]),
      website: normalizeLink(r[COLS.website]),
      facebook: normalizeLink(r[COLS.facebook]),
      instagram: normalizeLink(r[COLS.instagram]),
      tiktok: normalizeLink(r[COLS.tiktok]),
    });
  }

  const report = {
    sourceFile: CSV_PATH,
    totalOffers: offers.length,
    skipped,
    warnings,
    newCounties: [...newCounties.values()],
    newTowns: [...newTowns.values()],
    offers,
  };

  await writeFile(OUT_PATH, JSON.stringify(report, null, 2));

  console.log(`\n=== SUMMARY ===`);
  console.log(`Offers parsed: ${offers.length}`);
  console.log(`Rows skipped: ${skipped.length}`);
  skipped.forEach((s) => console.log(`  - row ${s.rowNum}: ${s.reason}`));
  console.log(`Warnings: ${warnings.length}`);
  warnings.forEach((w) => console.log(`  - row ${w.rowNum} "${w.titleEn}": ${w.reason}${w.lat != null ? ` (lat=${w.lat}, lng=${w.lng})` : ""}`));
  console.log(`New counties to create: ${newCounties.size}`, [...newCounties.values()].map((c) => c.name));
  console.log(`New towns to create: ${newTowns.size}`);
  for (const t of newTowns.values()) console.log(`  - ${t.name} (county: ${t.countySlug})`);

  const byCategory = new Map();
  for (const o of offers) byCategory.set(o.category, (byCategory.get(o.category) ?? 0) + 1);
  console.log(`\nBy category:`);
  for (const [cat, n] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(3)}  ${cat}`);

  console.log(`\nWrote full report to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

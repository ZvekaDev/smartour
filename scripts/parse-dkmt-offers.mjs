// Dry-run parser for the Hungarian partner's DKMT tourism database (327
// attractions across Bács-Kiskun and Csongrád-Csanád counties, Hungary).
// Reads scripts/data/dkmt-merged.json (produced by a one-off Python export
// that zips the EN/HU/SR source .xlsx files together by their shared ID —
// not reproduced here since it depended on a USB-drive path outside the
// repo), resolves category/county/town against live Sanity data (creating a
// new "Hungary" country + county/town docs as needed, since every existing
// offer is Serbia-side), and writes a JSON report for review before
// anything is written to Sanity.
//
// Usage: node --env-file=.env scripts/parse-dkmt-offers.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";
import { slugify } from "./lib/normalize.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MERGED_PATH = path.join(__dirname, "data", "dkmt-merged.json");
const OUT_PATH = path.join(__dirname, "data", "dkmt-offers-parsed.json");

const COUNTRY_SLUG = "hungary";
const COUNTRY_NAMES = { en: "Hungary", sr: "Mađarska", hu: "Magyarország" };

// Every town appearing in the source data, assigned to its real Hungarian
// county (this region only spans two: Bács-Kiskun and Csongrád-Csanád).
// The source has no county column, so this was built by hand against known
// Hungarian administrative geography.
const TOWN_COUNTY = {
  "Kecskemét": "bacs-kiskun", "Baja": "bacs-kiskun", "Kiskunhalas": "bacs-kiskun",
  "Kalocsa": "bacs-kiskun", "Kiskőrös": "bacs-kiskun", "Kiskunfélegyháza": "bacs-kiskun",
  "Kiskunmajsa": "bacs-kiskun", "Kunszentmiklós": "bacs-kiskun", "Soltvadkert": "bacs-kiskun",
  "Izsák": "bacs-kiskun", "Hajós": "bacs-kiskun", "Hajós-Pincefalu": "bacs-kiskun",
  "Bácsalmás": "bacs-kiskun", "Kecel": "bacs-kiskun", "Lajosmizse": "bacs-kiskun",
  "Felsőlajos": "bacs-kiskun", "Dunapataj": "bacs-kiskun", "Solt": "bacs-kiskun",
  "Fülöpszállás": "bacs-kiskun", "Fülöpháza": "bacs-kiskun", "Fülöpjakab": "bacs-kiskun",
  "Bugac": "bacs-kiskun", "Császártöltés": "bacs-kiskun", "Csólyospálos": "bacs-kiskun",
  "Dunatetétlen": "bacs-kiskun", "Kunadacs": "bacs-kiskun", "Tiszakécske": "bacs-kiskun",
  "Lakitelek": "bacs-kiskun", "Kerekegyháza": "bacs-kiskun", "Kunpeszér": "bacs-kiskun",
  "Tiszaalpár": "bacs-kiskun", "Bátya": "bacs-kiskun", "Borota": "bacs-kiskun",
  "Dunafalva": "bacs-kiskun", "Vaskút": "bacs-kiskun", "Páhi": "bacs-kiskun",
  "Pálmonostora": "bacs-kiskun", "Ágasegyháza": "bacs-kiskun", "Érsekhalma": "bacs-kiskun",
  "Foktő": "bacs-kiskun",
  "Szeged": "csongrad-csanad", "Hódmezővásárhely": "csongrad-csanad", "Makó": "csongrad-csanad",
  "Szentes": "csongrad-csanad", "Csongrád": "csongrad-csanad", "Mórahalom": "csongrad-csanad",
  "Röszke": "csongrad-csanad", "Szatymaz": "csongrad-csanad", "Ásotthalom": "csongrad-csanad",
  "Mártély": "csongrad-csanad", "Kiszombor": "csongrad-csanad", "Nagymágocs": "csongrad-csanad",
  "Mindszent": "csongrad-csanad", "Ópusztaszer": "csongrad-csanad", "Pusztaszer": "csongrad-csanad",
  "Óföldeák": "csongrad-csanad", "Bordány": "csongrad-csanad",
};
const COUNTY_NAMES = {
  "bacs-kiskun": { en: "Bács-Kiskun County", sr: "Okrug Bač-Kiškun", hu: "Bács-Kiskun vármegye" },
  "csongrad-csanad": { en: "Csongrád-Csanád County", sr: "Okrug Čongrad-Čanad", hu: "Csongrád-Csanád vármegye" },
};
// Not a real town — a few source rows describe a theme/route spanning both
// counties (e.g. "Bács-Kiskun és Csongrád-Csanád vármegyék"); left with no
// town/county rather than forced onto one.
const REGIONAL_TOWN_MARKER = "vármegyék";

const LEVEL2_TO_CATEGORY = {
  "Local Crafts & Intangible Cultural Heritage": "local-crafts-and-intangible-heritage",
  "Active & Sports Tourism": "active-and-sports-tourism",
  "Creative & Experience-based Tourism Offers": "creative-and-experience-based-tourism",
  "Health & Wellness Tourism": "health-and-wellness-tourism",
  "Eco- & Sustainable Tourism Facilities": "eco-and-sustainable-tourism-initiatives",
  "Cross-border Tourism Offer": "cross-border-routes-and-twin-offers",
  "Religious & Spiritual Tourism": "religious-and-spiritual-tourism",
  "Events & Festivals": "events-and-festivals",
  "Digital & Smart Infrastructure": "digital-and-smart-infrastructure",
  "Industrial & Technical Heritage": "industrial-and-technical-heritage",
  "Educational & Research Facilities Relevant to Tourism": "educational-and-research-tourism",
  "Film Tourism": "film-induced-tourism-locations",
};
const RESTAURANT_LEVEL3 = new Set(["restaurant", "bar", "fast food", "patisserie", "delicatessen"]);

/** The source's Level 1/2/3 fields don't cleanly separate dining,
 * accommodation and producer listings into their own category — "Gastronomy"
 * covers both restaurants and farm/winery shops, and "Accommodation" rows
 * carry a Level 2 that's really just a feature tag (e.g. "this hotel also
 * has wellness"), not its category. Mirrors how the equivalent Serbian
 * offers are categorized on the live site today. */
function resolveCategory(r) {
  if (r.lvl1 === "Gastronomy") {
    return RESTAURANT_LEVEL3.has((r.lvl3 ?? "").toLowerCase()) ? "restaurants" : "food-and-wine-producers";
  }
  if (r.lvl1 === "Accommodation") return "accommodations";
  if (r.lvl1 === "Health & Spa Tourism Attractions") return "health-and-wellness-tourism";
  return LEVEL2_TO_CATEGORY[r.lvl2] ?? null;
}

/** Fixes a spreadsheet artifact where two numbers got concatenated into one
 * cell (e.g. "19.9876536.17") — takes the first valid decimal prefix. */
function fixCoord(raw) {
  if (!raw) return null;
  const m = String(raw).match(/^-?\d+\.\d+/);
  return m ? parseFloat(m[0]) : null;
}

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A handful of cells hold two addresses joined with "/" instead of a
 * recognized separator (e.g. "info@x.hu/recepcio@x.hu"). */
function cleanEmail(raw) {
  if (!raw) return null;
  const parts = raw.split("/").map((p) => p.trim()).filter((p) => VALID_EMAIL.test(p));
  return parts.length ? parts.join("; ") : null;
}

/** 20 website cells are a bare domain ("www.x.hu") with no scheme. */
function cleanWebsite(raw) {
  if (!raw) return null;
  return /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
}

async function main() {
  const { SANITY_PROJECT_ID, SANITY_DATASET } = process.env;
  const client = createClient({
    projectId: SANITY_PROJECT_ID ?? "yrilioxt",
    dataset: SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    useCdn: false,
  });

  const records = JSON.parse(await readFile(MERGED_PATH, "utf8"));
  console.log(`Loaded ${records.length} merged DKMT records`);

  const [categories, offerTitlesRaw] = await Promise.all([
    client.fetch(`*[_type=="category"]{"slug": slug.current}`),
    client.fetch(`*[_type=="offer"]{"title": title.en}`),
  ]);
  const categorySlugs = new Set(categories.map((c) => c.slug));
  const offerTitles = new Set(offerTitlesRaw.map((o) => (o.title ?? "").trim().toLowerCase()));

  const newCounties = new Map();
  const newTowns = new Map();
  const offers = [];
  const skipped = [];
  const warnings = [];

  for (const r of records) {
    if (!r.title.en || !r.title.hu || !r.title.sr) {
      skipped.push({ id: r.id, reason: "missing a title in one or more locales" });
      continue;
    }

    const categorySlug = resolveCategory(r);
    if (!categorySlug || !categorySlugs.has(categorySlug)) {
      skipped.push({ id: r.id, reason: `unresolved category (lvl1=${r.lvl1}, lvl2=${r.lvl2}, lvl3=${r.lvl3})` });
      continue;
    }

    let countySlug = null;
    let townSlug = null;
    if (r.town && !r.town.includes(REGIONAL_TOWN_MARKER)) {
      countySlug = TOWN_COUNTY[r.town];
      if (!countySlug) {
        warnings.push({ id: r.id, title: r.title.en, reason: `unknown town "${r.town}" — no county mapping` });
      } else {
        if (!newCounties.has(countySlug)) {
          newCounties.set(countySlug, { slug: countySlug, names: COUNTY_NAMES[countySlug] });
        }
        townSlug = slugify(`${countySlug}-${r.town}`);
        if (!newTowns.has(townSlug)) {
          newTowns.set(townSlug, { slug: townSlug, name: r.town, countySlug });
        }
      }
    }

    const lat = fixCoord(r.lat_raw);
    const lon = fixCoord(r.lon_raw);
    if (lat == null || lon == null) {
      warnings.push({ id: r.id, title: r.title.en, reason: "unparseable coordinates", lat_raw: r.lat_raw, lon_raw: r.lon_raw });
    } else if (!(45.5 <= lat && lat <= 48.7 && 16 <= lon && lon <= 23)) {
      warnings.push({ id: r.id, title: r.title.en, reason: "coordinates outside Hungary bounding box", lat, lon });
    }

    if (offerTitles.has(r.title.en.trim().toLowerCase())) {
      warnings.push({ id: r.id, title: r.title.en, reason: "an existing Sanity offer already has this exact English title" });
    }

    offers.push({
      id: `offer-hu-${r.id.replace(/_/g, "-")}`,
      category: categorySlug,
      countySlug,
      townSlug,
      title: r.title,
      description: r.description,
      address: r.address,
      zip: r.zip,
      lat,
      lon,
      phone: r.phone,
      email: cleanEmail(r.email),
      website: cleanWebsite(r.website),
      facebook: cleanWebsite(r.facebook),
      instagram: cleanWebsite(r.instagram),
    });
  }

  const report = {
    sourceCount: records.length,
    country: { slug: COUNTRY_SLUG, names: COUNTRY_NAMES },
    newCounties: [...newCounties.values()],
    newTowns: [...newTowns.values()],
    offers,
    skipped,
    warnings,
  };
  await writeFile(OUT_PATH, JSON.stringify(report, null, 2));

  console.log(`\n=== SUMMARY ===`);
  console.log(`Offers parsed: ${offers.length}`);
  console.log(`Skipped: ${skipped.length}`);
  skipped.forEach((s) => console.log(`  - ${s.id}: ${s.reason}`));
  console.log(`Warnings: ${warnings.length}`);
  warnings.forEach((w) => console.log(`  - ${w.id} "${w.title ?? ""}": ${w.reason}`));
  console.log(`New counties: ${newCounties.size}`, [...newCounties.keys()]);
  console.log(`New towns: ${newTowns.size}`);

  const byCategory = new Map();
  for (const o of offers) byCategory.set(o.category, (byCategory.get(o.category) ?? 0) + 1);
  console.log(`\nBy category:`);
  for (const [cat, n] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n.toString().padStart(3)}  ${cat}`);
  }

  const noDesc = offers.filter((o) => !o.description.en && !o.description.hu && !o.description.sr);
  console.log(`\nOffers with no description in any language: ${noDesc.length}`);

  console.log(`\nWrote full report to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

// One-off data migration: pulls the full offers dataset out of the reference
// site's own `/api/Deals` JSON endpoint (discovered via network inspection —
// it's the same endpoint the reference site's own pagination/filter UI calls)
// across all three languages, and normalizes it into a single JSON file keyed
// by the source's stable cross-language id (`defaultLangPostId`).
//
// Deliberately does NOT copy any image URLs into the production dataset —
// the reference site's offer images are unlicensed Dreamstime stock previews
// (visibly watermarked). The original `sourceImageUrl` is kept as metadata
// only, in case the user wants to review/license a specific photo later.
//
// Usage: node scripts/migrate-offers.mjs

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "src", "data", "generated");

const BASE_URL = "https://smarttourism.concordsofttest.com";
const LOCALES = ["en", "sr", "hu"];

const HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Referer: `${BASE_URL}/offers`,
};

/** @param {string} locale */
async function fetchDeals(locale) {
  const res = await fetch(`${BASE_URL}/api/Deals`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      language: locale,
      searchTitle: "",
      filters: [],
      sorts: [],
      page: 1,
      pageSize: 2000, // large enough to get everything in one request
    }),
  });
  if (!res.ok) {
    throw new Error(`Deals fetch failed for locale=${locale}: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`Unexpected /api/Deals shape for locale=${locale}`);
  }
  return data;
}

function metaMap(contentMetas) {
  const out = {};
  for (const m of contentMetas ?? []) {
    // The API double-encodes string values as JSON (e.g. `"\"foo\""`); unwrap them.
    let value = m.value;
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        // leave as-is if it wasn't actually JSON-quoted
      }
    }
    out[m.fieldName] = value === "" ? null : value;
  }
  return out;
}

function slugify(input) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics (after NFD decomposition)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Splits an offer's contentCategories into its location chain + deal type. */
function splitCategories(contentCategories) {
  const locations = (contentCategories ?? [])
    .filter((c) => c.categoryType === "location")
    .sort((a, b) => (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0)); // rough parent-first sort
  const dealType = (contentCategories ?? []).find((c) => c.categoryType === "deal_type") ?? null;

  // Location chain is 1-3 deep: country -> county -> town. termId/parentId
  // let us walk it precisely instead of relying on array order.
  const byId = new Map(locations.map((l) => [l.termId, l]));
  const country = locations.find((l) => l.parentId === null) ?? null;
  const county = locations.find((l) => l.parentId === country?.termId) ?? null;
  const town = locations.find((l) => l.parentId === county?.termId) ?? null;

  return { country, county, town, dealType };
}

async function main() {
  console.log("Fetching offers for locales:", LOCALES.join(", "));
  const byLocale = {};
  for (const locale of LOCALES) {
    byLocale[locale] = await fetchDeals(locale);
    console.log(`  ${locale}: ${byLocale[locale].length} items`);
  }

  // Group by the cross-language stable id.
  /** @type {Map<number, Record<string, any>>} */
  const grouped = new Map();
  for (const locale of LOCALES) {
    for (const item of byLocale[locale]) {
      const id = item.post.defaultLangPostId;
      if (!grouped.has(id)) grouped.set(id, {});
      grouped.get(id)[locale] = item;
    }
  }

  const categories = new Map(); // slug -> { slug, names: {en,sr,hu} }
  const countries = new Map();
  const counties = new Map(); // slug -> { slug, countrySlug, names }
  const towns = new Map(); // slug -> { slug, countySlug, names }

  const offers = [];
  const incomplete = [];

  for (const [id, byLang] of grouped) {
    const missing = LOCALES.filter((l) => !byLang[l]);
    if (missing.length > 0) {
      incomplete.push({ id, missing });
      continue;
    }

    const en = splitCategories(byLang.en.contentCategories);
    const sr = splitCategories(byLang.sr.contentCategories);
    const hu = splitCategories(byLang.hu.contentCategories);

    if (!en.dealType || !en.country) {
      incomplete.push({ id, reason: "missing category/country in EN" });
      continue;
    }

    const categorySlug = slugify(en.dealType.value);
    if (!categories.has(categorySlug)) {
      categories.set(categorySlug, {
        slug: categorySlug,
        names: { en: en.dealType.displayName, sr: sr.dealType?.displayName ?? en.dealType.displayName, hu: hu.dealType?.displayName ?? en.dealType.displayName },
      });
    }

    const countrySlug = slugify(en.country.value);
    if (!countries.has(countrySlug)) {
      countries.set(countrySlug, {
        slug: countrySlug,
        names: { en: en.country.displayName, sr: sr.country?.displayName ?? en.country.displayName, hu: hu.country?.displayName ?? en.country.displayName },
      });
    }

    // The reference site's own data has a typo for this county name.
    const SR_NAME_FIXES = { "Centrani Banat": "Centralni Banat" };

    let countySlug = null;
    if (en.county) {
      countySlug = slugify(`${countrySlug}-${en.county.value}`);
      if (!counties.has(countySlug)) {
        const srCountyName = sr.county?.displayName ?? en.county.displayName;
        counties.set(countySlug, {
          slug: countySlug,
          countrySlug,
          names: { en: en.county.displayName, sr: SR_NAME_FIXES[srCountyName] ?? srCountyName, hu: hu.county?.displayName ?? en.county.displayName },
        });
      }
    }

    let townSlug = null;
    if (en.town && countySlug) {
      townSlug = slugify(`${countySlug}-${en.town.value}`);
      if (!towns.has(townSlug)) {
        towns.set(townSlug, {
          slug: townSlug,
          countySlug,
          names: { en: en.town.displayName, sr: sr.town?.displayName ?? en.town.displayName, hu: hu.town?.displayName ?? en.town.displayName },
        });
      }
    }

    const metasEn = metaMap(byLang.en.contentMetas);
    const metasSr = metaMap(byLang.sr.contentMetas);
    const metasHu = metaMap(byLang.hu.contentMetas);

    offers.push({
      id,
      slugs: { en: byLang.en.post.slug, sr: byLang.sr.post.slug, hu: byLang.hu.post.slug },
      category: categorySlug,
      countrySlug,
      countySlug,
      townSlug,
      title: { en: byLang.en.post.title, sr: byLang.sr.post.title, hu: byLang.hu.post.title },
      description: { en: byLang.en.post.content, sr: byLang.sr.post.content, hu: byLang.hu.post.content },
      address: metasEn.address ?? metasSr.address ?? metasHu.address ?? null,
      zip: metasEn.zip_code ?? null,
      lat: metasEn.latitude ? Number(metasEn.latitude) : null,
      lng: metasEn.longitude ? Number(metasEn.longitude) : null,
      phone: metasEn.phone ?? null,
      email: metasEn.email ?? null,
      website: metasEn.website ?? null,
      facebook: metasEn.facebook ?? null,
      instagram: metasEn.instagram ?? null,
      tiktok: metasEn.tiktok ?? null,
      // Reference only — do NOT render in the UI without a licensing check.
      sourceImageUrl: metasEn.image ?? null,
    });
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "offers.json"), JSON.stringify(offers, null, 2));
  await writeFile(
    path.join(OUT_DIR, "taxonomy.json"),
    JSON.stringify(
      {
        categories: [...categories.values()],
        countries: [...countries.values()],
        counties: [...counties.values()],
        towns: [...towns.values()],
      },
      null,
      2,
    ),
  );

  console.log(`\nWrote ${offers.length} offers to src/data/generated/offers.json`);
  console.log(
    `Taxonomy: ${categories.size} categories, ${countries.size} countries, ${counties.size} counties, ${towns.size} towns`,
  );
  if (incomplete.length) {
    console.warn(`\n${incomplete.length} entries skipped (missing a language or category):`);
    console.warn(incomplete.slice(0, 10));
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

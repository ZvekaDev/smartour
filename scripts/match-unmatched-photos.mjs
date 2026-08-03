// Dry-run matcher: finds local photo files (in the "Unmatched" subfolder plus
// any stray unused files in the root photo folder) that fuzzy-match an
// offer's title, for offers that currently have zero photos. Writes a report
// for review — does NOT upload anything. Run
// scripts/import-matched-photos.mjs afterwards to actually upload.
//
// Usage: node --env-file=.env scripts/match-unmatched-photos.mjs

import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = "/Users/dejanzvekic/Documents/1#SmarTour/Mapping_Natasa/FOTOGRAFIJE";
const UNMATCHED_DIR = path.join(ROOT, "Unmatched");
const OUT_PATH = path.join(__dirname, "data", "photo-match-report.json");

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;
const JUNK_NAMES = new Set([".DS_Store"]);

function fold(s) {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const STOP_TOKENS = new Set(["accomodation", "accommodation"]);

function tokens(s) {
  return fold(s)
    .split(" ")
    .filter((t) => t && !STOP_TOKENS.has(t));
}

function baseName(filename) {
  return filename
    .replace(IMAGE_EXT, "")
    .replace(/[\s–-]*\d+\s*$/, "")
    .trim();
}

/** IDF-weighted overlap: common words across many offer titles (e.g. "etno",
 * "selo", "salaš", "winery") count for little, so two different "Etno selo
 * X" places don't falsely score high just by sharing "etno selo". */
// A shared word needs at least this much rarity to count as a genuine
// "anchor" — otherwise offers whose whole title is common words (e.g. a
// city name shared by dozens of offers) look deceptively similar to
// anything mentioning that city, with no real anchor in common.
const ANCHOR_IDF = 1.5;

function scoreTokens(a, b, idf, maxIdf) {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) return { score: 0, hasAnchor: false };
  const weight = (t) => idf.get(t) ?? maxIdf;
  let overlapWeight = 0;
  let hasAnchor = false;
  for (const t of setA) {
    if (setB.has(t)) {
      overlapWeight += weight(t);
      if (weight(t) >= ANCHOR_IDF) hasAnchor = true;
    }
  }
  const smaller = setA.size <= setB.size ? setA : setB;
  let smallerWeight = 0;
  for (const t of smaller) smallerWeight += weight(t);
  return { score: smallerWeight === 0 ? 0 : overlapWeight / smallerWeight, hasAnchor };
}

async function listImageFiles(dir, subdir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name.normalize("NFC"))
    .filter((name) => !JUNK_NAMES.has(name) && IMAGE_EXT.test(name))
    .map((name) => ({ file: name, dir: subdir }));
}

async function main() {
  const { SANITY_PROJECT_ID, SANITY_DATASET } = process.env;
  const client = createClient({
    projectId: SANITY_PROJECT_ID ?? "yrilioxt",
    dataset: SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    useCdn: false,
  });

  const offers = await client.fetch(
    `*[_type=="offer" && count(photos)==0]{_id, title, "cat": category->slug.current}`,
  );
  console.log(`Offers without photos: ${offers.length}`);

  // IDF is computed from ALL offers (not just photo-less ones) so a word
  // that's unique to an offer that already HAS photos (e.g. "Tiganjica") is
  // correctly weighted as rare/distinctive, not defaulted to a middling
  // weight just because it's absent from the smaller candidate pool.
  const allOfferTitles = await client.fetch(`*[_type=="offer"]{title}`);

  const rootFiles = await listImageFiles(ROOT, "");
  const unmatchedFiles = await listImageFiles(UNMATCHED_DIR, "Unmatched");
  const allFiles = [...rootFiles, ...unmatchedFiles];
  console.log(`Candidate photo files: ${allFiles.length} (${rootFiles.length} in root, ${unmatchedFiles.length} in Unmatched/)`);

  // Group files by normalized base name.
  const groups = new Map(); // baseName -> { base, files: [{file,dir}] }
  for (const f of allFiles) {
    const base = baseName(f.file);
    if (!groups.has(base)) groups.set(base, { base, files: [] });
    groups.get(base).files.push(f);
  }
  console.log(`File groups (distinct base names): ${groups.size}`);

  const offerTokenSets = offers.map((o) => ({
    offer: o,
    tokenSets: [tokens(o.title.en ?? ""), tokens(o.title.sr ?? ""), tokens(o.title.hu ?? "")],
  }));

  // Document frequency across every offer's title tokens, pooled across all
  // three locales (the whole dataset, not just candidates without photos) —
  // filenames mix Serbian ("Etno", "selo") and English ("Ethno") words, so
  // computing frequency from EN titles alone made "etno" look falsely rare
  // (most titles say "Ethno"). Counting each offer once per token across
  // en+sr+hu fixes that, and a word unique to one offer (even one that
  // already has photos) still counts heavily.
  const df = new Map();
  for (const t of allOfferTitles) {
    const allTokens = new Set([
      ...tokens(t.title?.en ?? ""),
      ...tokens(t.title?.sr ?? ""),
      ...tokens(t.title?.hu ?? ""),
    ]);
    for (const tok of allTokens) df.set(tok, (df.get(tok) ?? 0) + 1);
  }
  const idf = new Map([...df.entries()].map(([t, count]) => [t, Math.log((allOfferTitles.length + 1) / count)]));
  const maxIdf = Math.max(...idf.values());

  const matches = []; // strong, single best candidate
  const ambiguous = []; // multiple close candidates
  const noMatch = [];

  for (const group of groups.values()) {
    const groupTokens = tokens(group.base);
    if (groupTokens.length === 0) continue;
    const foldedBase = fold(group.base);

    const scored = offerTokenSets
      .map(({ offer, tokenSets }) => {
        const results = tokenSets.map((ts) => scoreTokens(groupTokens, ts, idf, maxIdf));
        const best = results.reduce((a, b) => (b.score > a.score ? b : a));
        const isExactTitle = [offer.title.en, offer.title.sr, offer.title.hu].some((t) => fold(t ?? "") === foldedBase);
        return { offer, score: best.score, hasAnchor: best.hasAnchor, isExactTitle };
      })
      .filter((s) => s.score >= 0.6 && s.hasAnchor)
      .sort((a, b) => b.score - a.score);

    // A bag-of-words score alone can't tell "Hotel Prezident" (Palić) apart
    // from "Prezident Hotel" (Novi Sad) — same tokens, different order,
    // different physical hotels. When multiple candidates tie at the top
    // score, only resolve automatically if exactly one has the group's base
    // name as its literal title; otherwise it's genuinely ambiguous.
    const exactAtTop = scored.filter((s) => s.isExactTitle && s.score === scored[0]?.score);

    if (scored.length === 0) {
      noMatch.push(group);
    } else if (exactAtTop.length === 1) {
      matches.push({ base: group.base, files: group.files.map((f) => f.file), offerId: exactAtTop[0].offer._id, offerTitle: exactAtTop[0].offer.title.en, score: exactAtTop[0].score });
    } else if (scored.length === 1 || scored[0].score - scored[1].score >= 0.25) {
      matches.push({ base: group.base, files: group.files.map((f) => f.file), offerId: scored[0].offer._id, offerTitle: scored[0].offer.title.en, score: scored[0].score });
    } else {
      ambiguous.push({
        base: group.base,
        files: group.files.map((f) => f.file),
        candidates: scored.slice(0, 4).map((s) => ({ offerId: s.offer._id, title: s.offer.title.en, score: s.score })),
      });
    }
  }

  const report = { matches, ambiguous, noMatch: noMatch.map((g) => ({ base: g.base, files: g.files.map((f) => f.file) })) };
  await writeFile(OUT_PATH, JSON.stringify(report, null, 2));

  console.log(`\n=== SUMMARY ===`);
  console.log(`Strong matches: ${matches.length}`);
  console.log(`Ambiguous (need review): ${ambiguous.length}`);
  ambiguous.forEach((a) => console.log(`  - "${a.base}" (${a.files.length} files) -> ${a.candidates.map((c) => `${c.title} (${c.score.toFixed(2)})`).join(" | ")}`));
  console.log(`No match: ${noMatch.length}`);
  noMatch.forEach((g) => console.log(`  - "${g.base}" (${g.files.length} files)`));
  console.log(`\nWrote report to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

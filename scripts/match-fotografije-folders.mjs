// Dry-run matcher for the "Fotografije" folder delivery: one subfolder per
// place (Serbian names, often abbreviated), each holding a few photos.
// Matches each folder to an offer by fuzzy title overlap (same IDF-weighted
// approach as match-unmatched-photos.mjs), checked against ALL offers (not
// just photo-less ones) so we can see which folders are for places that
// already have photos from an earlier, lower-quality source. Writes a report
// for review — does NOT upload anything.
//
// Usage: node --env-file=.env scripts/match-fotografije-folders.mjs

import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = "/Users/dejanzvekic/Documents/1#SmarTour/Fotografije";
const OUT_PATH = path.join(__dirname, "data", "fotografije-match-report.json");

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

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
function tokens(s) {
  return fold(s).split(" ").filter(Boolean);
}

const ANCHOR_IDF = 1.5;
function scoreTokens(a, b, idf, maxIdf) {
  const setA = new Set(a);
  const setB = new Set(b);
  if (!setA.size || !setB.size) return { score: 0, hasAnchor: false };
  const w = (t) => idf.get(t) ?? maxIdf;
  let overlap = 0;
  let hasAnchor = false;
  for (const t of setA) {
    if (setB.has(t)) {
      overlap += w(t);
      if (w(t) >= ANCHOR_IDF) hasAnchor = true;
    }
  }
  const smaller = setA.size <= setB.size ? setA : setB;
  let sw = 0;
  for (const t of smaller) sw += w(t);
  return { score: sw === 0 ? 0 : overlap / sw, hasAnchor };
}

async function main() {
  const { SANITY_PROJECT_ID, SANITY_DATASET } = process.env;
  const client = createClient({
    projectId: SANITY_PROJECT_ID ?? "yrilioxt",
    dataset: SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    useCdn: false,
  });

  const offers = await client.fetch(`*[_type=="offer"]{_id, title, "photoCount": count(photos)}`);
  console.log(`Offers in Sanity: ${offers.length}`);

  const df = new Map();
  for (const o of offers) {
    const allT = new Set([...tokens(o.title.en ?? ""), ...tokens(o.title.sr ?? ""), ...tokens(o.title.hu ?? "")]);
    for (const t of allT) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const idf = new Map([...df.entries()].map(([t, c]) => [t, Math.log((offers.length + 1) / c)]));
  const maxIdf = Math.max(...idf.values());

  const entries = await readdir(ROOT, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name.normalize("NFC"));
  console.log(`Folders: ${folders.length}`);

  const matches = [];
  const ambiguous = [];
  const noMatch = [];

  for (const folder of folders) {
    const dir = path.join(ROOT, folder);
    const files = (await readdir(dir, { withFileTypes: true }))
      .filter((e) => e.isFile())
      .map((e) => e.name.normalize("NFC"))
      .filter((n) => IMAGE_EXT.test(n));
    if (!files.length) continue;

    const gt = tokens(folder);
    const foldedFolder = fold(folder);
    const scored = offers
      .map((o) => {
        const results = [tokens(o.title.en ?? ""), tokens(o.title.sr ?? ""), tokens(o.title.hu ?? "")].map((ts) =>
          scoreTokens(gt, ts, idf, maxIdf),
        );
        const best = results.reduce((a, b) => (b.score > a.score ? b : a));
        const isExactTitle = [o.title.en, o.title.sr, o.title.hu].some((t) => fold(t ?? "") === foldedFolder);
        return { o, score: best.score, hasAnchor: best.hasAnchor, isExactTitle };
      })
      .filter((s) => s.score >= 0.55 && s.hasAnchor)
      .sort((a, b) => b.score - a.score);

    const exactAtTop = scored.filter((s) => s.isExactTitle && s.score === scored[0]?.score);

    if (scored.length === 0) {
      noMatch.push({ folder, files });
    } else if (exactAtTop.length === 1) {
      matches.push({ folder, files, offerId: exactAtTop[0].o._id, offerTitle: exactAtTop[0].o.title.en, photoCount: exactAtTop[0].o.photoCount, score: exactAtTop[0].score });
    } else if (scored.length === 1 || scored[0].score - scored[1].score >= 0.2) {
      matches.push({ folder, files, offerId: scored[0].o._id, offerTitle: scored[0].o.title.en, photoCount: scored[0].o.photoCount, score: scored[0].score });
    } else {
      ambiguous.push({
        folder,
        files,
        candidates: scored.slice(0, 4).map((s) => ({ offerId: s.o._id, title: s.o.title.en, photoCount: s.o.photoCount, score: s.score })),
      });
    }
  }

  const report = { matches, ambiguous, noMatch };
  await writeFile(OUT_PATH, JSON.stringify(report, null, 2));

  const withZero = matches.filter((m) => m.photoCount === 0);
  const withExisting = matches.filter((m) => m.photoCount > 0);

  console.log(`\n=== SUMMARY ===`);
  console.log(`Strong matches: ${matches.length}`);
  console.log(`  -> target offer has ZERO photos: ${withZero.length}`);
  console.log(`  -> target offer ALREADY has photos: ${withExisting.length}`);
  console.log(`Ambiguous: ${ambiguous.length}`);
  ambiguous.forEach((a) => console.log(`  - "${a.folder}" -> ${a.candidates.map((c) => `${c.title} (${c.score.toFixed(2)}, photos:${c.photoCount})`).join(" | ")}`));
  console.log(`No match: ${noMatch.length}`);
  noMatch.forEach((g) => console.log(`  - "${g.folder}" (${g.files.length} files)`));

  console.log(`\n--- Folders whose target ALREADY has photos ---`);
  withExisting.forEach((m) => console.log(`  - "${m.folder}" -> ${m.offerId} "${m.offerTitle}" (currently ${m.photoCount} photo(s))`));

  console.log(`\nWrote report to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

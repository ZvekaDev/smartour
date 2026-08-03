// Downloads candidate photos referenced in a team-supplied research doc
// ("Izvori.docx" — exported to plain text, then parsed to pair each offer
// title with the image URLs that appeared near it) and attaches them to the
// matching offer's `photos` gallery. Only touches offers that currently have
// zero photos. Safe to re-run — skips any offer that already has photos.
//
// Usage: node --env-file=.env scripts/import-izvori-photos.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CANDIDATES_PATH = path.join(__dirname, "data", "izvori-photo-candidates.json");
const FETCH_TIMEOUT_MS = 15000;

const { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN } = process.env;
if (!SANITY_API_TOKEN) {
  console.error(
    "Missing SANITY_API_TOKEN.\nCopy .env.example to .env, fill in a write-enabled token, then run:\n" +
      "  node --env-file=.env scripts/import-izvori-photos.mjs",
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

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** A Wikipedia URL like "https://sr.wikipedia.org/wiki/X#/media/Датотека:Y.jpg"
 * or ".../wiki/File:Y.jpg" is a file-description HTML page, not a direct
 * image — resolve it via the MediaWiki API to the actual image URL. Each
 * language wiki uses its own localized "File:" namespace name (Cyrillic
 * "Датотека:" on sr.wikipedia.org, "Datoteka:" on sh.wikipedia.org, etc.),
 * so this doesn't hardcode "File:" — it just takes whatever title segment
 * follows "#/media/" (or the whole /wiki/ path) and lets that wiki's own API
 * resolve its own namespace alias. */
async function resolveWikipediaFileUrl(url) {
  const m = url.match(/^https?:\/\/([a-z-]+)\.wikipedia\.org\/wiki\/([^?]+)/i);
  if (!m) return null;
  const [, lang, rawPath] = m;
  const mediaMatch = rawPath.match(/#\/media\/(.+)$/);
  const titlePart = mediaMatch ? mediaMatch[1] : rawPath;
  let decoded;
  try {
    decoded = decodeURIComponent(titlePart);
  } catch {
    return null;
  }
  if (!/\.(jpe?g|png|gif|svg|webp)$/i.test(decoded)) return null;

  const apiUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(decoded)}&prop=imageinfo&iiprop=url&format=json`;
  try {
    const res = await fetch(apiUrl, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages ?? {};
    for (const page of Object.values(pages)) {
      const directUrl = page?.imageinfo?.[0]?.url;
      if (directUrl) return directUrl;
    }
  } catch {
    // fall through
  }
  return null;
}

async function fetchOnce(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": UA } });
    if (!res.ok) return { error: `HTTP ${res.status}`, retryable: res.status === 429 };
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return { error: `not an image (content-type: ${contentType})` };
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 2000) return { error: `suspiciously small (${buffer.length} bytes)` };
    return { buffer, contentType };
  } catch (err) {
    return { error: err.name === "AbortError" ? "timeout" : err.message, retryable: true };
  } finally {
    clearTimeout(timeout);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchImage(originalUrl) {
  // Wikimedia rate-limits aggressively when hit repeatedly in a tight loop
  // (both the API and upload.wikimedia.org) — a fixed pause before every
  // Wikimedia request keeps this comfortably under that limit.
  if (/wikipedia\.org|wikimedia\.org/i.test(originalUrl)) await sleep(3000);

  const resolved = await resolveWikipediaFileUrl(originalUrl);
  const url = resolved ?? originalUrl;

  let result = await fetchOnce(url);
  for (let attempt = 0; result.error && result.retryable && attempt < 3; attempt++) {
    await sleep(8000 * (attempt + 1));
    result = await fetchOnce(url);
  }
  return result;
}

async function main() {
  const candidates = JSON.parse(await readFile(CANDIDATES_PATH, "utf8"));
  console.log(`Offers to attempt: ${candidates.length}`);

  let offersUpdated = 0;
  let offersSkippedHadPhotos = 0;
  let offersWithNoSuccessfulDownload = 0;
  let filesUploaded = 0;
  let filesFailed = 0;

  for (const c of candidates) {
    const offer = await client.fetch(`*[_id == $id][0]{_id, "photoCount": count(photos)}`, { id: c.matchedOfferId });
    if (!offer) {
      console.log(`SKIP (offer not found): ${c.matchedOfferId}`);
      continue;
    }
    if (offer.photoCount > 0) {
      console.log(`SKIP (already has ${offer.photoCount} photo(s)): ${c.matchedOfferId} — "${c.title}"`);
      offersSkippedHadPhotos++;
      continue;
    }

    const photoEntries = [];
    for (const url of c.images) {
      const result = await fetchImage(url);
      if (result.error) {
        console.error(`  FAILED: ${url} (${result.error})`);
        filesFailed++;
        continue;
      }
      try {
        const filename = decodeURIComponent(url.split("/").pop().split("?")[0]) || "photo.jpg";
        const asset = await client.assets.upload("image", result.buffer, { filename, contentType: result.contentType });
        photoEntries.push({
          _type: "image",
          _key: asset._id.replace(/[^a-zA-Z0-9]/g, "").slice(-24),
          asset: { _type: "reference", _ref: asset._id },
        });
        console.log(`  uploaded: ${url}`);
        filesUploaded++;
      } catch (err) {
        console.error(`  UPLOAD FAILED: ${url} (${err.message})`);
        filesFailed++;
      }
    }

    if (photoEntries.length === 0) {
      console.log(`NO PHOTOS: ${c.matchedOfferId} — "${c.title}" (all ${c.images.length} candidate(s) failed)`);
      offersWithNoSuccessfulDownload++;
      continue;
    }

    await client.patch(c.matchedOfferId).setIfMissing({ photos: [] }).append("photos", photoEntries).commit();
    console.log(`OK: ${c.matchedOfferId} — "${c.title}" (${photoEntries.length}/${c.images.length} photo(s))`);
    offersUpdated++;
  }

  console.log("\n=== DONE ===");
  console.log("offers updated:", offersUpdated);
  console.log("offers skipped (already had photos):", offersSkippedHadPhotos);
  console.log("offers with zero successful downloads:", offersWithNoSuccessfulDownload);
  console.log("files uploaded:", filesUploaded);
  console.log("files failed:", filesFailed);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

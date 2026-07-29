// One-off migration of the Transport page's real, hand-written content
// (Rail/Bus/Border-crossing/Tourism-org sections with live links) from the
// reference site, across its 3 localized URLs. This page is static
// server-rendered HTML (no JSON API like /api/Deals), so we parse it with
// cheerio using the exact markup structure observed on the live site.
//
// Usage: node scripts/migrate-transport.mjs

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "src", "data", "generated");

const BASE_URL = "https://smarttourism.concordsofttest.com";

// Discovered by following /Home/ChangeLanguage redirects for each locale;
// the site translates the path segment itself, not just query params.
const LOCALIZED_PATHS = {
  en: "/transport/",
  sr: "/sr/prevoz",
  hu: "/hu/kozlekedes",
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function fetchHtml(pathname) {
  const res = await fetch(`${BASE_URL}${pathname}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Transport fetch failed for ${pathname}: HTTP ${res.status}`);
  return res.text();
}

function parseTransportPage(html) {
  const $ = cheerio.load(html);

  const hero = {
    title: $(".transport-hero-title").text().trim(),
    subtitle: $(".transport-hero-subtitle").text().trim(),
  };

  const quickCards = $(".transport-quick-card")
    .map((_, el) => {
      const $el = $(el);
      return {
        icon: $el.find(".transport-quick-icon i").attr("class") ?? "",
        anchor: $el.attr("href") ?? "",
        title: $el.find(".transport-quick-title").text().trim(),
        text: $el.find(".transport-quick-text").text().trim(),
      };
    })
    .get();

  const blocks = $(".transport-block")
    .map((_, el) => {
      const $el = $(el);
      const links = $el
        .find(".transport-link-card")
        .map((_, linkEl) => {
          const $link = $(linkEl);
          const $a = $link.find(".transport-link-card-header a");
          return {
            icon: $link.find(".transport-link-card-header i").attr("class") ?? "",
            href: $a.attr("href") ?? "",
            text: $a.text().trim(),
            description: $link.find(".transport-link-card-text").text().trim(),
          };
        })
        .get();

      return {
        id: $el.attr("id") ?? "",
        icon: $el.find(".transport-block-icon i").attr("class") ?? "",
        title: $el.find(".transport-block-title").text().trim(),
        subtitle: $el.find(".transport-block-subtitle").text().trim(),
        links,
      };
    })
    .get();

  const cta = {
    title: $(".transport-cta-title").text().trim(),
    text: $(".transport-cta-text").text().trim(),
    primaryText: $(".transport-cta-primary").clone().children().remove().end().text().trim(),
    secondaryText: $(".transport-cta-secondary").text().trim(),
  };

  return { hero, quickCards, blocks, cta };
}

async function main() {
  const out = {};
  for (const [locale, pathname] of Object.entries(LOCALIZED_PATHS)) {
    console.log(`Fetching transport page (${locale}) from ${pathname}...`);
    const html = await fetchHtml(pathname);
    out[locale] = parseTransportPage(html);
    console.log(`  -> ${out[locale].blocks.length} sections, ${out[locale].blocks.reduce((n, b) => n + b.links.length, 0)} links`);
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "transport.json"), JSON.stringify(out, null, 2));
  console.log("\nWrote src/data/generated/transport.json");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

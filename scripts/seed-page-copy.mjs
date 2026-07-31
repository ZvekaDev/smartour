// One-off: seeds siteSettings.homeCopy/offersCopy/blogsCopy/contactCopy/footerCopy
// with the CURRENT i18n/ui.ts strings, so Studio starts populated with real
// content instead of blank fields. Safe to re-run (uses .set(), idempotent).
//
// Usage: node --env-file=.env scripts/seed-page-copy.mjs

import { createClient } from "@sanity/client";
import { ui, locales } from "../src/i18n/ui.ts";

const projectId = process.env.SANITY_PROJECT_ID ?? "yrilioxt";
const dataset = process.env.SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_TOKEN;
const client = createClient({ projectId, dataset, apiVersion: "2024-01-01", token, useCdn: false });

function L(key) {
  return Object.fromEntries(locales.map((locale) => [locale, ui[locale][key]]));
}

const patch = {
  homeCopy: {
    heroTagline: L("home.hero.tagline"),
    heroTitle: L("home.hero.title"),
    heroSubtitle: L("home.hero.subtitle"),
    offersHeading: L("home.offers.heading"),
    storiesHeading: L("home.stories.heading"),
    joinHeading: L("home.join.heading"),
    joinText: L("home.join.text"),
  },
  offersCopy: {
    heroTitle: L("offers.heroTitle"),
    heroSubtitle: L("offers.heroSubtitle"),
  },
  blogsCopy: {
    heroTitle: L("blog.heroTitle"),
    heroSubtitle: L("blog.heroSubtitle"),
    featuredHeading: L("blog.featured"),
    allPostsHeading: L("blog.allPosts"),
  },
  contactCopy: {
    heroTitle: L("contact.heroTitle"),
    heroSubtitle: L("contact.heroSubtitle"),
    emailCardTitle: L("contact.emailUs"),
    emailCardText: L("contact.emailUsText"),
    callCardTitle: L("contact.callUs"),
    callCardText: L("contact.callUsText"),
    visitCardTitle: L("contact.visitUs"),
    visitCardText: L("contact.visitUsText"),
    formHeading: L("contact.formHeading"),
    formText: L("contact.formText"),
  },
  footerCopy: {
    tagline: L("footer.tagline"),
    quote: L("footer.quote"),
    disclaimer: L("footer.disclaimer"),
  },
};

await client.patch("siteSettings").set(patch).commit();
console.log("OK: seeded homeCopy/offersCopy/blogsCopy/contactCopy/footerCopy on siteSettings");

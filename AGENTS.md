# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SMARTour: a trilingual (EN/SR/HU) tourism site for the SMARTour EU Interreg IPA
Hungary–Serbia cross-border project, built with Astro to replace an existing WordPress
site (`https://smarttourism.concordsofttest.com`). That WordPress site is a **read-only
reference only** — never write to it, never modify it. It's used purely to match visual
design (header/footer/nav) and, during initial migration, as a data source via its own
JSON API.

## Commands

```
npm run dev        # dev server at localhost:4321
npm run build       # production build to ./dist/
npm run preview     # preview the production build locally
npm run astro ...   # Astro CLI (e.g. `npm run astro check`)
```

When starting the dev server for a background task, use `astro dev --background`, then
manage it with `astro dev stop`, `astro dev status`, and `astro dev logs`.

There is no lint or test script configured in `package.json` — don't invoke `npm run lint`
or `npm test`.

## Tech stack

- **Astro** (static output), **Tailwind CSS v4** (tokens in `src/styles/global.css`)
- i18n: `defaultLocale: 'en'`, `locales: ['en', 'sr', 'hu']`, `prefixDefaultLocale: false`
  (EN unprefixed at `/`, SR/HU prefixed at `/sr/`, `/hu/`)
- **Leaflet + OpenStreetMap** for maps (no API key needed)
- No unlicensed third-party photography — the reference WordPress site's offer images are
  unlicensed Dreamstime stock and were never carried over. Offer/blog photos are real,
  licensed photos uploaded via the CMS (see below); an offer/post with none falls back to a
  CSS gradient + emoji. Page hero background images (Home/Offers/Blogs/Contact/About
  Us/Transport) are currently royalty-free Unsplash placeholders seeded via
  `scripts/import-hero-images.mjs`, swappable for real photography anytime via Studio.

## Architecture: shared-component pattern

Page logic lives in `src/pagesShared/*.astro` (locale-agnostic — reads locale via
`getLangFromUrl(Astro.url)`). Route files under `src/pages/`, `src/pages/sr/`,
`src/pages/hu/` are thin one-liners that import and render the matching shared component.
When adding a new page, add the shared component once, then three near-identical route
files (one per locale).

i18n helpers live in `src/i18n/utils.ts` (`useTranslations`, `localizePath`, `formatDate`,
`getLocalizedAlternate`) and the string dictionary is in `src/i18n/ui.ts`.

## Data layer: Sanity CMS

All content (offers, taxonomy, blog posts, About Us, Transport, site settings) lives in
**Sanity** (project `yrilioxt`, dataset `production`, public/read-without-token). The
Studio is at `studio/` (a separate npm project — `cd studio && npm run dev`, serves on
`localhost:3333`) with schema in `studio/schemaTypes/`. `aboutUs`, `transportPage` and
`siteSettings` are singleton documents (fixed `_id`, one instance only — see
`singletonTypes` in `studio/schemaTypes/index.ts` and the custom desk `structure` in
`studio/sanity.config.ts`).

Astro reads via `src/lib/sanity.ts` (the `@sanity/client` instance + `urlForImage`) from
these modules, each using a **top-level await** to fetch once per build/dev-server process
and then export plain, already-resolved data — so every consumer still does a normal
synchronous `import { offers, taxonomy } from "../lib/offers"` exactly as before the CMS
migration, with no async changes needed at call sites:
- `src/lib/offers.ts` — offers + taxonomy (categories/countries/counties/towns)
- `src/data/aboutUs.ts`, `src/data/partners.ts`, `src/data/blog/posts.ts`, `src/lib/transport.ts`

Because of that top-level-await pattern, **editing content requires either a Studio edit +
dev server restart, or a rebuild** — the dev server does not hot-reload on remote Sanity
changes (only on local file changes), so restart `npm run dev` after editing content in
Studio to see it.

The Sanity client explicitly sets `useCdn: false` (see `src/lib/sanity.ts`) — the site fetches
each document once per build, not per visitor, so there's no volume reason to use Sanity's
CDN, and the CDN's eventual-consistency lag was intermittently causing webhook-triggered
builds (which can start within ~10s of a Studio publish) to bake in stale content. Reading
from the primary API removes that race entirely.

Offers have a combined photo/video **carousel + fullscreen lightbox** gallery
(`src/components/OfferGallery.astro` + `src/scripts/offerGallery.client.ts`): a main frame
with prev/next arrows, a scrollable thumbnail strip, and a lightbox with keyboard/swipe
navigation and click/wheel zoom + drag-to-pan on photos. Backed by `offer.photos` (array of
images) and `offer.videos` (array, each entry either a YouTube/Vimeo embed link or an
uploaded file — `toEmbedUrl` in the gallery component turns a watch link into an
iframe-embeddable one, and YouTube thumbnails are auto-derived from the video ID).
`OfferCard.astro` falls back to the emoji/gradient placeholder when an offer has no photos.

**CMS-managed page hero images**: `aboutUs.heroImage` and `transportPage.heroImage` live
directly on those singletons; Home/Offers/Blogs/Contact don't have their own Sanity document,
so their hero images live in `siteSettings.pageHeroes.{home,offers,blogs,contact}`. Every
hero render falls back to a plain gradient (`src/components/Hero.astro`'s `imageUrl` prop,
or the inline hero markup on Home/Transport) when no image is set.

**CMS-managed marketing copy**: `siteSettings.homeCopy` / `offersCopy` / `blogsCopy` /
`contactCopy` / `footerCopy` hold headings, taglines, and CTA/legal text for the pages
without their own document (About Us/Transport text was already 100% CMS-driven via their
own singleton fields). This was deliberately scoped to content an editor would actually want
to tweak — small UI chrome (button labels, form field labels, filter labels, aria-labels)
stays in `src/i18n/ui.ts` since it's interface, not content, and rarely changes. Every field
falls back to the matching `src/i18n/ui.ts` key when empty
(`homeCopy?.heroTitle?.[locale] || t("home.hero.title")` pattern), so nothing breaks if a
Studio field is left blank.

`.env` (git-ignored, see `.env.example`) holds `SANITY_PROJECT_ID`, `SANITY_DATASET`, and
`SANITY_API_TOKEN` (write-scoped, needed for the one-off scripts below — reads don't need it
since the dataset is public).

One-off scripts in `scripts/` (all idempotent/safe to re-run; run with
`node --env-file=.env scripts/<name>.mjs`):
- `migrate-to-sanity.mjs` (plus `migrate-offers.mjs`, `migrate-transport.mjs`) — seeded Sanity
  from the old static JSON (`src/data/generated/*.json`, now unused by the app but kept as
  historical migration input) and `categoriesExtra.ts`. Every document uses a deterministic
  `_id` and `createOrReplace`.
- `import-offer-photos.mjs`, `import-single-batch.mjs`, `import-ambiguous-photos.mjs` — bulk-
  attached local photo files to their matching offer by filename↔title matching (fuzzy token
  containment + Serbian-diacritics folding, since filenames are often typed without accents);
  skip any offer that already has photos, so safe to re-run. Kept as a record of the applied
  import, not meant to run standalone (they reference a local photo folder outside the repo).
- `import-hero-images.mjs` — seeded the royalty-free Unsplash hero placeholders.
- `seed-page-copy.mjs` — seeded `siteSettings.*Copy` fields from the current `ui.ts` strings
  so Studio started populated instead of blank.

## Deployment

- **Site**: `smartours.netlify.app` (Netlify project `smartours`), deploying from this repo's
  `main` branch. Two things trigger a rebuild: a `git push` to `main`, and a Sanity webhook
  ("Netlify rebuild" in Sanity → API → Webhooks) that POSTs to a Netlify build hook on every
  publish (filtered to `!(_id in path("drafts.**"))` so it only fires on actual publishes, not
  every autosaved keystroke). If a build ever seems to have run but not picked up a change,
  manually re-trigger from Netlify → Deploys → Trigger deploy — see the `useCdn: false` note
  above for why this shouldn't be needed anymore.
- **Studio**: hosted at `smartour-cms.sanity.studio` (`sanity deploy` from `studio/`, appId
  pinned in `studio/sanity.cli.ts`) in addition to the local `cd studio && npm run dev` flow.
  Access is per-account via Sanity project membership (sanity.io/manage → Members), not a
  shared password.

## Known gotchas

- **`getStaticPaths()` constants must be declared inside the function body**, not at module
  scope in the frontmatter — Astro's isolated function extraction during build doesn't
  reliably capture module-scope `const`s referenced only inside `getStaticPaths`. This caused
  a real "X is not defined" build failure once; keep constants like `PAGE_SIZE` inside the
  function.
- Serbian dates: use `formatDate()` from `src/i18n/utils.ts`, not `toLocaleDateString('sr', ...)`
  directly — plain `'sr'` renders Cyrillic, but the rest of the SR UI is Latin script. The
  helper forces `sr-Latn`.
- **Offers have a distinct slug per locale** (`offer.slugs.{en,sr,hu}`, since titles differ per
  language), so the language switcher can't just swap the `/en`/`/sr`/`/hu` prefix on the
  current path like every other page does. `Layout`/`Header`/`LanguageSwitcher` accept an
  optional `alternates: Partial<Record<Locale, string>>` prop that overrides the default
  prefix-swap; `OfferDetailPage.astro` is the only page that needs to pass it (via
  `offerHref(offer, locale)` per locale). Any future page whose URL differs per locale (not
  just the prefix) needs the same treatment, or the switcher will 404.
- macOS reports filenames in **NFD Unicode** (accented chars as base+combining-mark, e.g. "š"
  as "s" + a separate combining caron) while Sanity/JS string literals are typically **NFC**
  (precomposed). Any code comparing a filename to a CMS string must `.normalize("NFC")` both
  sides first, or accented matches silently fail. Bit the offer-photo-matching scripts once.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

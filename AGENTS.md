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
- No third-party photography anywhere — the reference site's offer images are unlicensed
  Dreamstime stock. Placeholders are CSS gradients + emoji until real, licensed photos/videos
  are added via the CMS (see below).

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

Offers support a photo gallery (`offer.photos`, array of images) and a video gallery
(`offer.videos`, each entry either a YouTube/Vimeo embed link or an uploaded file) — see
`OfferDetailPage.astro` for the rendering (including the `toEmbedUrl` helper that turns a
YouTube/Vimeo watch link into an iframe-embeddable one) and `OfferCard.astro` for the
thumbnail fallback (first photo if present, else the emoji/gradient placeholder).

`.env` (git-ignored, see `.env.example`) holds `SANITY_PROJECT_ID`, `SANITY_DATASET`, and
`SANITY_API_TOKEN` (write-scoped, only needed for the migration script below — reads don't
need it since the dataset is public).

`scripts/migrate-to-sanity.mjs` is the one-off script that seeded Sanity from the old static
JSON (`src/data/generated/*.json`, now unused by the app but kept as historical migration
input) and `categoriesExtra.ts` (also migration-only now). It's idempotent — every document
uses a deterministic `_id` and `createOrReplace`, so it's safe to re-run:
`node --env-file=.env scripts/migrate-to-sanity.mjs`.

## Known gotchas

- **`getStaticPaths()` constants must be declared inside the function body**, not at module
  scope in the frontmatter — Astro's isolated function extraction during build doesn't
  reliably capture module-scope `const`s referenced only inside `getStaticPaths`. This caused
  a real "X is not defined" build failure once; keep constants like `PAGE_SIZE` inside the
  function.
- Serbian dates: use `formatDate()` from `src/i18n/utils.ts`, not `toLocaleDateString('sr', ...)`
  directly — plain `'sr'` renders Cyrillic, but the rest of the SR UI is Latin script. The
  helper forces `sr-Latn`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

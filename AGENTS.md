# SMARTour

A trilingual (EN/SR/HU) tourism site for the SMARTour EU Interreg IPA Hungary–Serbia
cross-border project, built with Astro to replace an existing WordPress site
(`https://smarttourism.concordsofttest.com`). That WordPress site is a **read-only
reference only** — never write to it, never modify it. It's used purely to match visual
design (header/footer/nav) and, during initial migration, as a data source via its own
JSON API.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

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

## Data layer

Currently static JSON under `src/data/generated/` (offers, taxonomy, transport), generated
by one-off scripts in `scripts/` that scraped the reference site's `/api/Deals` endpoint.
**This is being migrated to Sanity CMS** — once that's live, `src/lib/offers.ts` and friends
will fetch from Sanity instead of importing the static JSON. Do not hand-edit the generated
JSON files; treat them as migration output only.

Offers will support a photo gallery (multiple images) and a video gallery (multiple entries,
each either a YouTube/Vimeo embed link or an uploaded file) once the Sanity schema lands.

## Known gotchas

- **`getStaticPaths()` constants must be declared inside the function body**, not at module
  scope in the frontmatter — Astro's isolated function extraction during build doesn't
  reliably capture module-scope `const`s referenced only inside `getStaticPaths`. This caused
  a real "X is not defined" build failure once; keep constants like `PAGE_SIZE` inside the
  function.
- Serbian dates: use `formatDate()` from `src/i18n/utils.ts`, not `toLocaleDateString('sr', ...)`
  directly — plain `'sr'` renders Cyrillic, but the rest of the SR UI is Latin script. The
  helper forces `sr-Latn`.
- `categoriesExtra.ts` holds hand-translated categories that have zero live offers; it's
  merged into taxonomy at read-time in `src/lib/offers.ts` so re-running the migration script
  doesn't clobber them.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

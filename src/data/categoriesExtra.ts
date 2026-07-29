import type { Locale } from "../i18n/ui";

/**
 * Categories from the original 18-category spec that have zero live offers
 * yet (confirmed against both the pasted dataset and the reference site's
 * live API). Kept separate from the generated taxonomy so re-running the
 * migration script never overwrites these hand-authored translations —
 * merged in at read time by src/lib/offers.ts.
 */
export const extraCategories: { slug: string; names: Record<Locale, string> }[] = [
  {
    slug: "digital-and-smart-infrastructure",
    names: {
      en: "Digital and smart infrastructure",
      sr: "Digitalna i pametna infrastruktura",
      hu: "Digitális és okos infrastruktúra",
    },
  },
  {
    slug: "accessible-tourism-infrastructure",
    names: {
      en: "Accessible tourism infrastructure",
      sr: "Pristupačna turistička infrastruktura",
      hu: "Akadálymentes turisztikai infrastruktúra",
    },
  },
  {
    slug: "local-crafts-and-intangible-heritage",
    names: {
      en: "Local crafts and intangible heritage",
      sr: "Lokalni zanati i nematerijalno nasleđe",
      hu: "Helyi kézművesség és szellemi örökség",
    },
  },
  {
    slug: "cross-border-routes-and-twin-offers",
    names: {
      en: "Cross-border routes and twin offers",
      sr: "Prekogranične rute i partnerske ponude",
      hu: "Határon átnyúló útvonalak és testvér-ajánlatok",
    },
  },
  {
    slug: "film-induced-tourism-locations",
    names: {
      en: "Film-induced tourism locations",
      sr: "Lokacije filmskog turizma",
      hu: "Filmturisztikai helyszínek",
    },
  },
  {
    slug: "accommodations",
    names: { en: "Accommodations", sr: "Smeštaj", hu: "Szállás" },
  },
];

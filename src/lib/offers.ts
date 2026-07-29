import offersData from "../data/generated/offers.json";
import taxonomyData from "../data/generated/taxonomy.json";
import { extraCategories } from "../data/categoriesExtra";
import type { Locale } from "../i18n/ui";

export interface Offer {
  id: number;
  slugs: Record<Locale, string>;
  category: string;
  countrySlug: string;
  countySlug: string | null;
  townSlug: string | null;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  address: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  sourceImageUrl: string | null;
}

interface TaxonomyEntry {
  slug: string;
  names: Record<Locale, string>;
}

interface Taxonomy {
  categories: TaxonomyEntry[];
  countries: TaxonomyEntry[];
  counties: (TaxonomyEntry & { countrySlug: string })[];
  towns: (TaxonomyEntry & { countySlug: string })[];
}

export const offers = offersData as Offer[];
export const taxonomy: Taxonomy = {
  ...(taxonomyData as Taxonomy),
  // Merge in categories from the original spec that have no live offers yet,
  // so the filter UI can show them (with an empty state) rather than hiding
  // them entirely.
  categories: [...(taxonomyData as Taxonomy).categories, ...extraCategories],
};

export function offerHref(offer: Offer, locale: Locale): string {
  const base = locale === "en" ? "/offers" : `/${locale}/offers`;
  return `${base}/${offer.slugs[locale]}`;
}

export function findOfferBySlug(locale: Locale, slug: string): Offer | undefined {
  return offers.find((o) => o.slugs[locale] === slug);
}

export function categoryName(slug: string, locale: Locale): string {
  return taxonomy.categories.find((c) => c.slug === slug)?.names[locale] ?? slug;
}

export function countyName(slug: string | null, locale: Locale): string {
  if (!slug) return "";
  return taxonomy.counties.find((c) => c.slug === slug)?.names[locale] ?? slug;
}

export function townName(slug: string | null, locale: Locale): string {
  if (!slug) return "";
  return taxonomy.towns.find((t) => t.slug === slug)?.names[locale] ?? slug;
}

export function countryName(slug: string, locale: Locale): string {
  return taxonomy.countries.find((c) => c.slug === slug)?.names[locale] ?? slug;
}

export interface OfferSummary {
  id: number;
  slug: string;
  title: string;
  category: string;
  countrySlug: string;
  countySlug: string | null;
  townSlug: string | null;
  county: string;
  town: string;
  href: string;
}

/**
 * A lightweight, locale-specific index used to drive the client-side filter
 * engine on the Offers page. Deliberately excludes descriptions/contact
 * fields (~1.5MB across all locales in the full dataset) — those stay in
 * the statically-generated detail pages, which is also better for SEO than
 * shipping everything into one client bundle.
 */
export function offerSummaries(locale: Locale): OfferSummary[] {
  return offers.map((o) => ({
    id: o.id,
    slug: o.slugs[locale],
    title: o.title[locale],
    category: o.category,
    countrySlug: o.countrySlug,
    countySlug: o.countySlug,
    townSlug: o.townSlug,
    county: countyName(o.countySlug, locale),
    town: townName(o.townSlug, locale),
    href: offerHref(o, locale),
  }));
}

/** Category slug -> Bootstrap-style icon key, used to pick a placeholder graphic. */
export const categoryIcon: Record<string, string> = {
  "events-and-festivals": "🎉",
  "religious-and-spiritual-tourism": "⛪",
  "educational-and-research-tourism": "🎓",
  restaurants: "🍽️",
  "industrial-and-technical-heritage": "🏭",
  "active-and-sports-tourism": "🚴",
  "food-and-wine-producers": "🍷",
  "creative-and-experience-based-tourism": "🎨",
  "health-and-wellness-tourism": "💆",
  "eco-and-sustainable-tourism-initiatives": "🌿",
  "tourism-information-infrastructure": "ℹ️",
  "smart-mobility-and-green-transport": "🚲",
  // Categories with no live entries yet, kept so the taxonomy/UI stays ready for them.
  "digital-and-smart-infrastructure": "📡",
  "accessible-tourism-infrastructure": "♿",
  "local-crafts-and-intangible-heritage": "🧵",
  "cross-border-routes-and-twin-offers": "🌉",
  "film-induced-tourism-locations": "🎬",
  accommodations: "🛏️",
};

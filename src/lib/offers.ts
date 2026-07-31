import { sanityClient, urlForImage } from "./sanity";
import type { Locale } from "../i18n/ui";
import type { Image } from "sanity";

export interface OfferVideo {
  type: "embed" | "file";
  url: string;
  caption: string | null;
}

export interface Offer {
  id: string;
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
  photos: (Image & { alt?: string })[];
  videos: OfferVideo[];
}

interface TaxonomyEntry {
  slug: string;
  names: Record<Locale, string>;
}

interface CategoryEntry extends TaxonomyEntry {
  icon: string | null;
}

interface Taxonomy {
  categories: CategoryEntry[];
  countries: TaxonomyEntry[];
  counties: (TaxonomyEntry & { countrySlug: string })[];
  towns: (TaxonomyEntry & { countySlug: string })[];
}

const OFFERS_QUERY = /* groq */ `
*[_type == "offer"] | order(title.en asc) {
  "id": _id,
  "slugs": {"en": slugs.en.current, "sr": slugs.sr.current, "hu": slugs.hu.current},
  "category": category->slug.current,
  "countrySlug": country->slug.current,
  "countySlug": county->slug.current,
  "townSlug": town->slug.current,
  title,
  description,
  address,
  zip,
  "lat": location.lat,
  "lng": location.lng,
  phone, email, website, facebook, instagram, tiktok,
  photos[]{..., alt},
  videos[]{
    _type,
    url,
    caption,
    "fileUrl": file.asset->url
  }
}`;

const CATEGORIES_QUERY = /* groq */ `*[_type == "category"] | order(names.en asc) {
  "slug": slug.current, names, icon
}`;
const COUNTRIES_QUERY = /* groq */ `*[_type == "country"] { "slug": slug.current, names }`;
const COUNTIES_QUERY = /* groq */ `*[_type == "county"] {
  "slug": slug.current, names, "countrySlug": country->slug.current
}`;
const TOWNS_QUERY = /* groq */ `*[_type == "town"] {
  "slug": slug.current, names, "countySlug": county->slug.current
}`;

async function loadData(): Promise<{ offers: Offer[]; taxonomy: Taxonomy }> {
  const [offersRaw, categories, countries, counties, towns] = await Promise.all([
    sanityClient.fetch(OFFERS_QUERY),
    sanityClient.fetch(CATEGORIES_QUERY),
    sanityClient.fetch(COUNTRIES_QUERY),
    sanityClient.fetch(COUNTIES_QUERY),
    sanityClient.fetch(TOWNS_QUERY),
  ]);

  const offers: Offer[] = offersRaw.map((o: any) => ({
    ...o,
    photos: o.photos ?? [],
    videos: (o.videos ?? []).map((v: any) => ({
      type: v._type === "videoEmbed" ? "embed" : "file",
      url: v._type === "videoEmbed" ? v.url : v.fileUrl,
      caption: v.caption ?? null,
    })),
  }));

  return { offers, taxonomy: { categories, countries, counties, towns } };
}

// Top-level await: resolved once per build (this module is a singleton across
// the whole `astro build`/`astro dev` process), so every page importing
// `offers`/`taxonomy` below reuses the same already-fetched data — no
// per-page network round trips.
const { offers, taxonomy: taxonomyData } = await loadData();

export { offers };
export const taxonomy: Taxonomy = taxonomyData;

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
  id: string;
  slug: string;
  title: string;
  category: string;
  countrySlug: string;
  countySlug: string | null;
  townSlug: string | null;
  county: string;
  town: string;
  href: string;
  thumbnail: string | null;
}

/**
 * A lightweight, locale-specific index used to drive the client-side filter
 * engine on the Offers page. Deliberately excludes descriptions/contact
 * fields — those stay in the statically-generated detail pages, which is
 * also better for SEO than shipping everything into one client bundle.
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
    thumbnail: o.photos[0] ? urlForImage(o.photos[0]).width(480).height(360).fit("crop").url() : null,
  }));
}

/** Category slug -> emoji, sourced from the category document in Sanity. */
export const categoryIcon: Record<string, string> = Object.fromEntries(
  taxonomy.categories.map((c) => [c.slug, c.icon ?? "📍"]),
);

export { urlForImage };

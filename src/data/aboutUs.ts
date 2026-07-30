import { sanityClient } from "../lib/sanity";
import type { Locale } from "../i18n/ui";

type L = Record<Locale, string>;

const ABOUT_US_QUERY = /* groq */ `*[_type == "aboutUs" && _id == "aboutUs"][0]`;

/**
 * Content for the About Us page, fetched from the Sanity `aboutUs` singleton
 * document. Resolved once via top-level await (see src/lib/offers.ts for why
 * that's safe/cheap), so this behaves like a plain constant to every
 * consumer, same as before the CMS migration.
 */
export const aboutUs: {
  heroTitle: L;
  heroSubtitle: L;
  whoWeAreTagline: L;
  whoWeAreHeading: L;
  whoWeAreParagraphs: Record<Locale, string[]>;
  stats: { number: string; label: L }[];
  missionTagline: L;
  missionParagraph: L;
  visionTagline: L;
  visionParagraph: L;
  offerHeading: L;
  offerSubheading: L;
  offerCards: { icon: string; title: L; text: L }[];
  storyTagline: L;
  storyHeading: L;
  storyParagraph: L;
  ctaHeading: L;
  ctaText: L;
} = await sanityClient.fetch(ABOUT_US_QUERY);

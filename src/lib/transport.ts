import { sanityClient } from "./sanity";
import type { Locale } from "../i18n/ui";

interface TransportLocaleData {
  hero: { title: string; subtitle: string };
  quickCards: { icon: string; anchor: string; title: string; text: string }[];
  blocks: {
    id: string;
    icon: string;
    title: string;
    subtitle: string;
    links: { icon: string; href: string; text: string; description: string }[];
  }[];
  cta: { title: string; text: string; primaryText: string; secondaryText: string };
}

const TRANSPORT_QUERY = /* groq */ `*[_type == "transportPage" && _id == "transportPage"][0]`;

const doc: {
  heroTitle: Record<Locale, string>;
  heroSubtitle: Record<Locale, string>;
  quickCards: { icon: string; anchor: string; title: Record<Locale, string>; text: Record<Locale, string> }[];
  blocks: {
    anchorId: string;
    icon: string;
    title: Record<Locale, string>;
    subtitle: Record<Locale, string>;
    links: {
      icon: string;
      href: string;
      text: Record<Locale, string>;
      description: Record<Locale, string>;
    }[];
  }[];
  ctaTitle: Record<Locale, string>;
  ctaText: Record<Locale, string>;
  ctaPrimaryText: Record<Locale, string>;
  ctaSecondaryText: Record<Locale, string>;
} = await sanityClient.fetch(TRANSPORT_QUERY);

function forLocale(locale: Locale): TransportLocaleData {
  return {
    hero: { title: doc.heroTitle[locale], subtitle: doc.heroSubtitle[locale] },
    quickCards: doc.quickCards.map((c) => ({
      icon: c.icon,
      anchor: c.anchor,
      title: c.title[locale],
      text: c.text[locale],
    })),
    blocks: doc.blocks.map((b) => ({
      id: b.anchorId,
      icon: b.icon,
      title: b.title[locale],
      subtitle: b.subtitle[locale],
      links: b.links.map((l) => ({
        icon: l.icon,
        href: l.href,
        text: l.text[locale],
        description: l.description[locale],
      })),
    })),
    cta: {
      title: doc.ctaTitle[locale],
      text: doc.ctaText[locale],
      primaryText: doc.ctaPrimaryText[locale],
      secondaryText: doc.ctaSecondaryText[locale],
    },
  };
}

/** Same shape as the old generated transport.json: keyed by locale. */
const transportData: Record<Locale, TransportLocaleData> = {
  en: forLocale("en"),
  sr: forLocale("sr"),
  hu: forLocale("hu"),
};

export default transportData;

import { sanityClient } from "../lib/sanity";
import type { Locale } from "../i18n/ui";
import type { Image } from "sanity";

type L = Record<Locale, string>;

const SITE_SETTINGS_QUERY = /* groq */ `*[_type == "siteSettings" && _id == "siteSettings"][0]`;

const siteSettingsDoc: {
  siteContact: { email: string; phone: string; location: L };
  socialLinks: { label: string; href: string }[];
  partners: { name: L; email: string }[];
  pageHeroes: { home: Image | null; offers: Image | null; blogs: Image | null; contact: Image | null } | null;
  homeCopy: {
    heroTagline: L;
    heroTitle: L;
    heroSubtitle: L;
    offersHeading: L;
    storiesHeading: L;
    joinHeading: L;
    joinText: L;
  } | null;
  offersCopy: { heroTitle: L; heroSubtitle: L } | null;
  blogsCopy: { heroTitle: L; heroSubtitle: L; featuredHeading: L; allPostsHeading: L } | null;
  contactCopy: {
    heroTitle: L;
    heroSubtitle: L;
    emailCardTitle: L;
    emailCardText: L;
    callCardTitle: L;
    callCardText: L;
    visitCardTitle: L;
    visitCardText: L;
    formHeading: L;
    formText: L;
  } | null;
  footerCopy: { tagline: L; quote: L; disclaimer: L } | null;
} = await sanityClient.fetch(SITE_SETTINGS_QUERY);

/** Programme partner organisations shown in the footer's "Contact Us" column. */
export const partners = siteSettingsDoc.partners;

export const siteContact = siteSettingsDoc.siteContact;

export const socialLinks = siteSettingsDoc.socialLinks;

/** Hero background images for pages without their own Sanity document. */
export const pageHeroes = siteSettingsDoc.pageHeroes ?? { home: null, offers: null, blogs: null, contact: null };

/** Marketing copy (headings/taglines/CTAs) for pages without their own Sanity document.
 * Each field may be undefined if not yet filled in Studio — callers should fall back to
 * the i18n dictionary in that case. */
export const homeCopy = siteSettingsDoc.homeCopy;
export const offersCopy = siteSettingsDoc.offersCopy;
export const blogsCopy = siteSettingsDoc.blogsCopy;
export const contactCopy = siteSettingsDoc.contactCopy;
export const footerCopy = siteSettingsDoc.footerCopy;

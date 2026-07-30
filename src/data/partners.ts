import { sanityClient } from "../lib/sanity";
import type { Locale } from "../i18n/ui";

const SITE_SETTINGS_QUERY = /* groq */ `*[_type == "siteSettings" && _id == "siteSettings"][0]`;

const siteSettingsDoc: {
  siteContact: { email: string; phone: string; location: Record<Locale, string> };
  socialLinks: { label: string; href: string }[];
  partners: { name: Record<Locale, string>; email: string }[];
} = await sanityClient.fetch(SITE_SETTINGS_QUERY);

/** Programme partner organisations shown in the footer's "Contact Us" column. */
export const partners = siteSettingsDoc.partners;

export const siteContact = siteSettingsDoc.siteContact;

export const socialLinks = siteSettingsDoc.socialLinks;

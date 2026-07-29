import { ui, defaultLocale, locales, type Locale, type UiKey } from "./ui";

/** Reads the active locale out of an Astro request URL. */
export function getLangFromUrl(url: URL): Locale {
  const [, maybeLocale] = url.pathname.split("/");
  if (locales.includes(maybeLocale as Locale)) {
    return maybeLocale as Locale;
  }
  return defaultLocale;
}

/** Returns a t(key, vars?) translator bound to the given locale, falling back
 * to English. `vars` values replace `{token}` placeholders in the string. */
export function useTranslations(locale: Locale) {
  return function t(key: UiKey, vars?: Record<string, string | number>): string {
    let str = ui[locale]?.[key] ?? ui[defaultLocale][key] ?? key;
    if (vars) {
      for (const [token, value] of Object.entries(vars)) {
        str = str.replace(`{${token}}`, String(value));
      }
    }
    return str;
  };
}

/**
 * Builds an href for `path` (e.g. "/offers") in the given locale.
 * The default locale is unprefixed; others get a `/xx` prefix, matching
 * astro.config.mjs's `prefixDefaultLocale: false` setting.
 */
export function localizePath(path: string, locale: Locale): string {
  const cleanPath = path === "/" ? "" : path;
  return locale === defaultLocale ? `${cleanPath}` || "/" : `/${locale}${cleanPath}`;
}

/** BCP-47 tags used for date/number formatting — `sr-Latn` keeps Serbian
 * dates in Latin script, matching the rest of the site's SR content (JS's
 * default `sr` tag formats dates in Cyrillic, which would look inconsistent
 * next to Latin-script body copy). */
const INTL_LOCALES: Record<Locale, string> = {
  en: "en-GB",
  sr: "sr-Latn",
  hu: "hu",
};

export function formatDate(dateInput: string | Date, locale: Locale): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString(INTL_LOCALES[locale], { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Given the current URL and a target locale, returns the equivalent path in
 * that locale so the language switcher stays on the same page.
 */
export function getLocalizedAlternate(url: URL, targetLocale: Locale): string {
  const currentLocale = getLangFromUrl(url);
  let pathWithoutLocale = url.pathname;
  if (currentLocale !== defaultLocale) {
    pathWithoutLocale = pathWithoutLocale.replace(`/${currentLocale}`, "") || "/";
  }
  return localizePath(pathWithoutLocale, targetLocale) + url.search;
}

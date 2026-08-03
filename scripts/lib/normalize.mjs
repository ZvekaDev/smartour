// Normalization helpers for the "new offers" CSV import. Isolated from the
// parse/import scripts so both the dry-run parser and the Sanity writer can
// share identical logic.

export function slugify(input) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics (after NFD decomposition)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Fixes the source's corrupted coordinate formats:
 *  - plain decimal ("45.2517") -> used as-is
 *  - degree/compass suffix ("45.2398537° N", "44.521499N") -> suffix stripped
 *  - comma-corrupted integers ("4,521,702,375" or bare "2041538") -> a
 *    spreadsheet artifact that dropped the decimal point; Vojvodina lat/lng
 *    are always a 2-digit integer part, so the point is reinserted after the
 *    first 2 digits once thousands-commas are stripped.
 */
export function normalizeCoord(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/\s*°\s*[NSEW]?\s*$/i, "").replace(/\s*[NSEW]\s*$/i, "");
  s = s.trim();
  if (!s) return null;
  const negative = s.startsWith("-");
  if (negative) s = s.slice(1);

  let n;
  if (s.includes(".")) {
    n = parseFloat(s.replace(/,/g, ""));
  } else {
    const digits = s.replace(/,/g, "");
    if (!digits) return null;
    const withDot = digits.length > 2 ? `${digits.slice(0, 2)}.${digits.slice(2)}` : digits;
    n = parseFloat(withDot);
  }
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** Serbia's rough bounding box, used only to flag suspicious values for review. */
export function isPlausibleSerbiaCoord(lat, lng) {
  if (lat == null || lng == null) return true; // nothing to check
  return lat >= 41 && lat <= 47 && lng >= 17 && lng <= 23;
}

export function cleanCounty(raw) {
  if (!raw) return null;
  const first = raw.split(/\n/)[0].trim();
  return first || null;
}

/** Strips a leaked "Latitude: ...\nLongitude: ..." block the source
 * sometimes appended to the Address cell, and inserts a missing space
 * between a letter and a directly-following digit (paste artifact, e.g.
 * "Lopudska7" -> "Lopudska 7"). */
export function cleanAddress(raw) {
  if (!raw) return null;
  let s = raw.replace(/\r\n/g, "\n");
  s = s.split(/\n?\s*Latitude\s*:/i)[0];
  s = s.replace(/\s*\n\s*/g, ", ").trim();
  s = s.replace(/,\s*,/g, ",").replace(/,\s*$/, "").trim();
  s = s.replace(/([a-zA-ZÀ-ſ])(\d)/g, "$1 $2");
  return s || null;
}

export function cleanZip(raw) {
  if (!raw) return null;
  const s = raw.replace(/[​‌‍﻿]/g, "").trim();
  return s || null;
}

/** Strips zero-width-space contamination from county/town names (source
 * paste artifact, e.g. "Sombor​"). */
export function cleanTownName(raw) {
  if (!raw) return null;
  const s = raw.replace(/[​‌‍﻿]/g, "").trim();
  return s || null;
}

export function cleanPhone(raw) {
  if (!raw) return null;
  const parts = raw
    .split(/[\r\n]+/)
    .map((p) => p.trim().replace(/^=+/, "").trim()) // strip a leading "=" (spreadsheet trick to block auto-formatting)
    .filter(Boolean);
  return parts.length ? parts.join("; ") : null;
}

const EMAIL_PROVIDER_FIX = /^(.+?)(gmail|yahoo|hotmail|outlook)\.(com|rs)$/i;
const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Handles cells with more than one address (";"-joined, sometimes with no
 * space), and drops any address missing a TLD (e.g. "name@yahoo" — a
 * truncation, not something to guess ".com" vs ".rs" for) rather than
 * emitting a broken email. */
export function cleanEmail(raw) {
  if (!raw) return null;
  const junk = new Set(["/", "-", "—", "n/a", "na"]);
  const fixed = raw
    .split(";")
    .map((p) => p.replace(/\s+/g, "").trim())
    .filter(Boolean)
    .filter((p) => !junk.has(p.toLowerCase()))
    .map((p) => {
      if (VALID_EMAIL.test(p)) return p;
      const m = p.match(EMAIL_PROVIDER_FIX);
      return m ? `${m[1]}@${m[2]}.${m[3]}` : null;
    })
    .filter(Boolean);
  return fixed.length ? fixed.join("; ") : null;
}

const JUNK_LINK_VALUES = new Set(["/", "-", "—", "n/a", "na", "none", "nema", "ne postoji"]);
const SENTENCE_RUN = /\p{L}{3,}\s+\p{L}{2,}\s+\p{L}{2,}/u;

/** Normalizes Website/Facebook/Instagram/TikTok cells: extracts a URL from
 * markdown link syntax or embedded prose ("Facebook : https://..."), adds
 * "https://" to a bare domain ("www.foo.com", "facebook.com/bar"), and
 * drops junk values ("/", "N/A", "Ne radi facebook stranica.") rather than
 * guessing at them. */
export function normalizeLink(raw) {
  if (!raw) return null;
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s) return null;

  const md = s.match(/\[([^\]]*)\]\((https?:\/\/[^)]+)\)/);
  if (md) return md[2].trim();

  const embedded = s.match(/https?:\/\/[^\s)]+/);
  if (embedded) return embedded[0].replace(/[),.]+$/, "");

  const lower = s.toLowerCase();
  if (JUNK_LINK_VALUES.has(lower)) return null;
  if (SENTENCE_RUN.test(s)) return null; // looks like prose, not a URL

  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(s)) {
    return `https://${s}`;
  }
  return null;
}

/** Strips the leaked "Title SR: ... Description SR: ..." block some rows
 * appended to another locale's description, and a leading "Description XX:"
 * label some rows were prefixed with. */
export function cleanDescription(raw) {
  if (!raw) return "";
  let s = raw;
  s = s.split(/\s*Title\s+(?:SR|EN|HU)\s*:/)[0];
  s = s.replace(/^\s*Description\s+(?:SR|EN|HU)\s*:\s*/i, "");
  return s.trim();
}

export function cleanTitle(raw) {
  return (raw ?? "").trim();
}

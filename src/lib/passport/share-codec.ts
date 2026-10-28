import {
  normalizeFlightDate,
  type DistanceUnit,
  type PassportFlightInput,
} from "@/registry/blocks/flight-passport/flight-passport-stats";

import { normalizeFooterText } from "./footer-text";
import { DEFAULT_ROUTE_COLOR, normalizeRouteColor } from "./route-colors";

/**
 * Share links carry the whole flight log in the `d` query parameter, so a
 * passport needs no database. Format (v1):
 *
 *   d     = "1" base64url(deflate-raw(BODY))   compressed
 *         | "0" base64url(BODY)                fallback without CompressionStream
 *   BODY  = TOKEN *("," TOKEN)
 *   TOKEN = [YYYYMM | YYYYMMDD] FROM TO        e.g. 202601TPEHND
 *
 * Dates default to month precision so links don't reveal travel days.
 * Decoding is strict: one malformed token invalidates the whole link.
 * Options ride along as `year`, `u=mi`, `c` (route color hex, no "#") and
 * `t` (the owner's text for the passport's bottom line).
 */

export const SHARE_DEFLATE = "1";
export const SHARE_PLAIN = "0";
/** Above this the link still works but gets unwieldy to paste. */
export const SHARE_WARN_LENGTH = 2000;
/** Vercel rejects URLs over 14 KB, and the image URL repeats `d`. */
export const SHARE_MAX_LENGTH = 10000;
export const SHARE_MAX_FLIGHTS = 2000;
export const SHARE_MAX_BODY_BYTES = 64 * 1024;

const SHARE_PARAM_PATTERN = /^[01][A-Za-z0-9_-]+$/;
const TOKEN_PATTERN = /^(\d{8}|\d{6})?([A-Z]{3})([A-Z]{3})$/;

export type PassportShareParams = {
  d: string;
  year?: number;
  unit?: DistanceUnit;
  /** Route color as "#rrggbb"; the default color is left out of links. */
  color?: string;
  /** The owner's text for the passport's bottom line; unset means the default. */
  footer?: string;
};

export function serializeShareBody(
  flights: readonly PassportFlightInput[],
  { exactDates }: { exactDates: boolean },
) {
  return flights
    .map((flight) => {
      const date = flight.date
        ? (exactDates ? flight.date : flight.date.slice(0, 7)).replaceAll(
            "-",
            "",
          )
        : "";
      return `${date}${flight.from}${flight.to}`;
    })
    .join(",");
}

export function parseShareBody(body: string): PassportFlightInput[] | null {
  if (!body) return null;
  const tokens = body.split(",");
  if (tokens.length > SHARE_MAX_FLIGHTS) return null;
  const flights: PassportFlightInput[] = [];
  for (const token of tokens) {
    const match = TOKEN_PATTERN.exec(token);
    if (!match) return null;
    const [, date, from, to] = match;
    if (from === to) return null;
    if (!date) {
      flights.push({ from, to });
      continue;
    }
    const month = `${date.slice(0, 4)}-${date.slice(4, 6)}`;
    // The same rules as a typed log: real dates from 1950 to next year.
    const valid = normalizeFlightDate(
      date.length === 8 ? `${month}-${date.slice(6, 8)}` : month,
    );
    if (!valid) return null;
    flights.push({ from, to, date: valid });
  }
  return flights;
}

/** base64url without padding, converted in chunks to stay under argument limits. */
export function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

export function isShareParam(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= SHARE_MAX_LENGTH &&
    SHARE_PARAM_PATTERN.test(value)
  );
}

type SearchParamValue = string | string[] | null | undefined;

function first(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
}

/** Reads `d`, `year`, `u`, `c` and `t` from page or request search params. */
export function readShareParams(params: {
  d?: SearchParamValue;
  year?: SearchParamValue;
  u?: SearchParamValue;
  c?: SearchParamValue;
  t?: SearchParamValue;
}): {
  d?: string;
  year?: number;
  unit: DistanceUnit;
  color: string;
  footer?: string;
} {
  const d = first(params.d);
  const year = first(params.year);
  return {
    d: isShareParam(d) ? d : undefined,
    year: year && /^\d{4}$/.test(year) ? Number(year) : undefined,
    unit: first(params.u) === "mi" ? "mi" : "km",
    color: normalizeRouteColor(first(params.c)) ?? DEFAULT_ROUTE_COLOR,
    footer: normalizeFooterText(first(params.t)),
  };
}

export function buildShareQuery({
  d,
  year,
  unit,
  color,
  footer,
}: PassportShareParams) {
  const query = new URLSearchParams({ d });
  if (year) query.set("year", String(year));
  if (unit === "mi") query.set("u", "mi");
  const routeColor = normalizeRouteColor(color);
  if (routeColor && routeColor !== DEFAULT_ROUTE_COLOR) {
    query.set("c", routeColor.slice(1));
  }
  const footerText = normalizeFooterText(footer);
  if (footerText) query.set("t", footerText);
  return query.toString();
}

/** Bump to make social apps refetch share images after a redesign. */
export const SHARE_IMAGE_VERSION = "1";

/**
 * "og" is the 1200×630 link preview; "card" is the 1080×1350 passport page
 * people download and post. A card `plate` leaves the routes off the map
 * for the passport video to draw.
 */
export function buildShareImagePath(
  params: PassportShareParams,
  {
    kind = "og",
    download = false,
    plate = false,
  }: { kind?: "og" | "card"; download?: boolean; plate?: boolean } = {},
) {
  const query = new URLSearchParams(buildShareQuery(params));
  query.set("r", SHARE_IMAGE_VERSION);
  if (download) query.set("download", "1");
  if (plate) query.set("plate", "1");
  return `/passport/${kind}?${query.toString()}`;
}

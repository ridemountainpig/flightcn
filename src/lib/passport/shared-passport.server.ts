import { inflateRawSync } from "node:zlib";
import { cache } from "react";

import type { AirportInfo } from "@/registry/flight-airports";
import {
  computePassportStats,
  computeYearInReview,
  formatDistance,
  formatInteger,
  resolveFlights,
  type DistanceUnit,
  type PassportFlightInput,
  type PassportStats,
  type ResolvedFlight,
  type YearInReview,
} from "@/registry/blocks/flight-passport/flight-passport-stats";

import { builtInLookup } from "./airport-lookup";
import { serverAirportLookup } from "./extended-airports.server";
import {
  isShareParam,
  parseShareBody,
  SHARE_DEFLATE,
  SHARE_MAX_BODY_BYTES,
} from "./share-codec";

export type SharedPassport = {
  d: string;
  /** Set only when the link asks for a year that has flights. */
  year?: number;
  unit: DistanceUnit;
  flights: PassportFlightInput[];
  resolved: ResolvedFlight[];
  stats: PassportStats;
  review: YearInReview | null;
  /** Airports resolved outside the built-in database, for the client. */
  extraAirports: Record<string, AirportInfo>;
  title: string;
  description: string;
};

/** Decodes a `d` share parameter; null when it is not a valid passport link. */
export function decodeShareParam(d: string): PassportFlightInput[] | null {
  if (!isShareParam(d)) return null;
  try {
    const bytes = Buffer.from(d.slice(1), "base64url");
    const body =
      d[0] === SHARE_DEFLATE
        ? inflateRawSync(bytes, { maxOutputLength: SHARE_MAX_BODY_BYTES })
        : bytes;
    if (body.length > SHARE_MAX_BODY_BYTES) return null;
    return parseShareBody(body.toString("utf8"));
  } catch {
    return null;
  }
}

function plural(count: number, word: string, pluralWord = `${word}s`) {
  return `${formatInteger(count)} ${count === 1 ? word : pluralWord}`;
}

/**
 * Decodes, resolves and summarizes a shared passport once per request, for
 * both the page metadata and the page itself.
 */
export const loadSharedPassport = cache(
  (
    d: string | undefined,
    year: number | undefined,
    unit: DistanceUnit,
  ): SharedPassport | null => {
    if (!d) return null;
    const flights = decodeShareParam(d);
    if (!flights) return null;
    const { flights: resolved } = resolveFlights(flights, serverAirportLookup);
    if (resolved.length === 0) return null;

    const stats = computePassportStats(resolved);
    const review = year ? computeYearInReview(resolved, year) : null;
    const scope = review?.stats ?? stats;

    const extraAirports: Record<string, AirportInfo> = {};
    for (const flight of resolved) {
      for (const airport of [flight.from, flight.to]) {
        if (!builtInLookup(airport.code)) extraAirports[airport.code] = airport;
      }
    }

    const counts = `${plural(scope.airportVisits.length, "airport")} and ${plural(
      scope.countries.length,
      "country",
      "countries",
    )}`;
    const distance = formatDistance(scope.distanceKm, unit);
    const title = review
      ? `My ${review.year} in flights: ${plural(scope.flights, "flight")}, ${distance}`
      : `My flight passport: ${plural(scope.flights, "flight")}, ${distance}`;
    const since = stats.first?.year ? ` since ${stats.first.year}` : "";
    const description = review
      ? `${plural(scope.flights, "flight")}, ${counts} in ${review.year}. Mapped with flightcn. Make your own flight passport.`
      : `${plural(scope.flights, "flight")} across ${counts}${since}. Mapped with flightcn. Make your own flight passport.`;

    return {
      d,
      year: review ? review.year : undefined,
      unit,
      flights,
      resolved,
      stats,
      review,
      extraAirports,
      title,
      description,
    };
  },
);

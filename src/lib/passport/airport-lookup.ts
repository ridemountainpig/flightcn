import type { AirportInfo } from "@/registry/flight-airports";
import { getAirportInfo } from "@/registry/flight-airports-utils";
import type { AirportLookup } from "@/registry/blocks/flight-passport/flight-passport-stats";

/** The airports bundled with the flightcn registry. */
export const builtInLookup: AirportLookup = getAirportInfo;

/** Tries each lookup in turn and returns the first match. */
export function composeLookup(...lookups: AirportLookup[]): AirportLookup {
  return (code) => {
    for (const lookup of lookups) {
      const airport = lookup(code);
      if (airport) return airport;
    }
    return undefined;
  };
}

export function lookupFromRecord(
  record: Readonly<Record<string, AirportInfo>>,
): AirportLookup {
  return (code) => record[code.toUpperCase()];
}

/** [code, name, city, country, latitude, longitude] */
export type ExtendedAirportEntry = [
  string,
  string,
  string,
  string,
  number,
  number,
];

function entryToAirport([
  code,
  name,
  city,
  country,
  latitude,
  longitude,
]: ExtendedAirportEntry): AirportInfo {
  return { code, name, city, country, latitude, longitude };
}

function lookupFromAirports(list: readonly AirportInfo[]): AirportLookup {
  const byCode = new Map(list.map((airport) => [airport.code, airport]));
  return (code) => byCode.get(code.toUpperCase());
}

export function lookupFromEntries(
  entries: readonly ExtendedAirportEntry[],
): AirportLookup {
  return lookupFromAirports(entries.map(entryToAirport));
}

let extendedAirportsPromise: Promise<AirportInfo[]> | null = null;
let extendedLookupPromise: Promise<AirportLookup> | null = null;

/**
 * Loads the extended airport list (built by
 * scripts/build-airports-extended.mjs) in its own chunk, only when a log
 * uses a code the built-in database lacks or the airport search opens.
 */
export function loadExtendedAirports() {
  extendedAirportsPromise ??= import("@/data/airports-extended.json")
    .then((module) =>
      (module.default as unknown as ExtendedAirportEntry[]).map(entryToAirport),
    )
    .catch((error: unknown) => {
      extendedAirportsPromise = null;
      throw error;
    });
  return extendedAirportsPromise;
}

export function loadExtendedLookup() {
  extendedLookupPromise ??= loadExtendedAirports()
    .then(lookupFromAirports)
    .catch((error: unknown) => {
      extendedLookupPromise = null;
      throw error;
    });
  return extendedLookupPromise;
}

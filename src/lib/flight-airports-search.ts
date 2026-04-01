import { type AirportInfo, type AirportRef } from "@/registry/flight-airports";

export type { AirportInfo, AirportRef };

type IndexedAirport = {
  airport: AirportInfo;
  code: string;
  name: string;
  city: string;
  country: string;
};

const searchIndexCache = new WeakMap<
  readonly AirportInfo[],
  IndexedAirport[]
>();

function getSearchIndex(allAirports: readonly AirportInfo[]): IndexedAirport[] {
  const cached = searchIndexCache.get(allAirports);
  if (cached) return cached;

  const index = allAirports.map((airport) => ({
    airport,
    code: airport.code.toLowerCase(),
    name: airport.name.toLowerCase(),
    city: airport.city.toLowerCase(),
    country: airport.country.toLowerCase(),
  }));

  searchIndexCache.set(allAirports, index);
  return index;
}

/**
 * Search airports by query string. Matches against IATA code, name, city,
 * and country with relevance-based scoring.
 *
 * @param allAirports - The full list of airports to search through
 * @param query - Search query string
 * @param limit - Maximum number of results to return (0 = no limit)
 * @returns Sorted array of matching airports (highest relevance first)
 */
export function searchAirports(
  allAirports: readonly AirportInfo[],
  query: string,
  limit: number = 0,
): AirportInfo[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const scored: Array<{ airport: AirportInfo; score: number }> = [];
  const index = getSearchIndex(allAirports);

  for (const entry of index) {
    let score = 0;
    if (entry.code === normalized) score = 120;
    else if (entry.code.startsWith(normalized)) score = 90;
    else if (entry.city.startsWith(normalized)) score = 70;
    else if (entry.name.startsWith(normalized)) score = 65;
    else if (entry.country.startsWith(normalized)) score = 55;
    else if (entry.name.includes(normalized)) score = 40;
    else if (entry.city.includes(normalized)) score = 35;
    else if (entry.country.includes(normalized)) score = 30;
    else continue;

    scored.push({ airport: entry.airport, score });
  }

  scored.sort((a, b) => b.score - a.score);

  const results = scored.map((entry) => entry.airport);
  return limit > 0 ? results.slice(0, limit) : results;
}

import type { AirportInfo } from "@/registry/flight-airports";

/**
 * Airport search for the flight picker: matches codes, cities, airport
 * names and countries, ignoring case, accents and punctuation ("sao" finds
 * São Paulo, "xian" finds Xi'an).
 */

/**
 * Cities people search for whose main airport the data lists under the
 * town it actually sits in, like Taoyuan for Taipei.
 */
const CITY_ALIASES: Record<string, string> = {
  TPE: "Taipei",
  NRT: "Tokyo",
  NGO: "Nagoya",
  OKA: "Okinawa",
  DPS: "Bali",
  EWR: "New York",
  LTN: "London",
  OGG: "Maui",
};

export type AirportSearchEntry = {
  airport: AirportInfo;
  /** Built-in airports are the bigger ones, so they rank first on a tie. */
  builtIn: boolean;
  /** Folded search text, each with a leading space for word matches. */
  city: string;
  alias: string;
  name: string;
  country: string;
};

/** Letters NFD doesn't split into a base letter, as people type them. */
const PLAIN_LETTERS: Record<string, string> = {
  ł: "l",
  ø: "o",
  ı: "i",
  ß: "ss",
  æ: "ae",
  œ: "oe",
  ð: "d",
  þ: "th",
  đ: "d",
};

function fold(text: string) {
  return ` ${text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[łøıßæœðþđ]/g, (letter) => PLAIN_LETTERS[letter])
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()}`;
}

export function indexAirports(
  list: Iterable<AirportInfo>,
  builtIn: boolean,
): AirportSearchEntry[] {
  return [...list].map((airport) => ({
    airport,
    builtIn,
    city: fold(airport.city),
    alias: fold(CITY_ALIASES[airport.code] ?? ""),
    name: fold(airport.name),
    country: fold(airport.country),
  }));
}

/** Lower is better; Infinity means no match. `query` is folded. */
function rank(entry: AirportSearchEntry, query: string, code: string) {
  const cities = [entry.city, entry.alias];
  if (entry.airport.code === code) return 0;
  // "bali" finds Bali before Balikpapan, "london" London before East London.
  if (cities.some((city) => city === query)) return 1;
  if (cities.some((city) => city.startsWith(`${query} `))) return 2;
  if (cities.some((city) => city.startsWith(query))) return 3;
  if (code.length >= 2 && entry.airport.code.startsWith(code)) return 4;
  if (cities.some((city) => city.includes(query))) return 5;
  if (entry.name.includes(query)) return 6;
  if (entry.country.startsWith(query)) return 7;
  return Infinity;
}

export function searchAirports(
  entries: readonly AirportSearchEntry[],
  rawQuery: string,
  limit = 8,
): AirportInfo[] {
  const query = fold(rawQuery);
  if (!query.trim()) return [];
  const code = rawQuery.trim().toUpperCase();
  const matches: { entry: AirportSearchEntry; score: number }[] = [];
  for (const entry of entries) {
    const score = rank(entry, query, code);
    if (score !== Infinity) matches.push({ entry, score });
  }
  matches.sort(
    (a, b) =>
      a.score - b.score ||
      Number(b.entry.builtIn) - Number(a.entry.builtIn) ||
      a.entry.airport.code.localeCompare(b.entry.airport.code, "en"),
  );
  return matches.slice(0, limit).map(({ entry }) => entry.airport);
}

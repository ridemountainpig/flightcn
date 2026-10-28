import type { AirportInfo } from "@/components/ui/flight";

/**
 * Pure flight-log parsing and statistics for the flight passport block.
 * Nothing here touches the map or the DOM, so the same functions run in the
 * browser and on the server (for share images). The airport lookup is passed
 * in, which lets callers extend coverage beyond the built-in database.
 */

/** One flight as entered: IATA codes plus an optional date. */
export type PassportFlightInput = {
  from: string;
  to: string;
  /** "YYYY-MM" or "YYYY-MM-DD". */
  date?: string;
};

/** Resolves an IATA code to airport details, or undefined when unknown. */
export type AirportLookup = (code: string) => AirportInfo | undefined;

export type DistanceUnit = "km" | "mi";

export type FlightLogIssue = { line: number; text: string; message: string };

export type ParsedFlightLog = {
  flights: (PassportFlightInput & { line: number })[];
  issues: FlightLogIssue[];
  /** True when the log had more flights than `maxFlights`. */
  truncated: boolean;
};

export type ResolvedFlight = {
  from: AirportInfo;
  to: AirportInfo;
  date?: string;
  year?: number;
  /** 1–12. */
  month?: number;
  distanceKm: number;
  /** Chronological position: dated flights by date, then undated ones. */
  order: number;
};

export type UnknownAirport = { code: string; count: number; hint?: string };

export type ResolvedLog = {
  flights: ResolvedFlight[];
  unknown: UnknownAirport[];
};

/** Both directions of a city pair, counted together. */
export type RouteSummary = {
  key: string;
  a: AirportInfo;
  b: AirportInfo;
  count: number;
  distanceKm: number;
};

export type AirportVisits = { airport: AirportInfo; visits: number };

export type PassportStats = {
  flights: number;
  distanceKm: number;
  /** Estimated time in the air: distance at cruise speed plus taxi time. */
  hours: number;
  aroundEarth: number;
  toMoon: number;
  domestic: number;
  longest?: ResolvedFlight;
  first?: ResolvedFlight;
  last?: ResolvedFlight;
  /** Set when one airport accounts for at least 30% of visits. */
  home?: AirportInfo;
  /** Every airport, most visited first. */
  airportVisits: AirportVisits[];
  /** Every city pair, most flown first. */
  routes: RouteSummary[];
  /** Every country, by number of flights touching it. */
  countries: { country: string; flights: number }[];
  perYear: { year: number; flights: number; distanceKm: number }[];
  undated: number;
};

export type YearComparison = {
  year: number;
  flights: number;
  distanceKm: number;
  airports: number;
  countries: number;
};

export type YearInReview = {
  year: number;
  isCurrentYear: boolean;
  stats: PassportStats;
  months: { month: number; flights: number; distanceKm: number }[];
  busiestMonth?: { month: number; flights: number };
  newAirports: AirportInfo[];
  newCountries: string[];
  /** No dated flights before this year, so "new" places are not meaningful. */
  firstYearOnRecord: boolean;
  previous?: YearComparison;
  /** Most visited airport other than the lifetime home airport. */
  topDestination?: AirportVisits;
};

export const MAX_PASSPORT_FLIGHTS = 2000;
export const EARTH_CIRCUMFERENCE_KM = 40075;
export const MOON_DISTANCE_KM = 384400;
export const KM_PER_MILE = 1.609344;
export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const EARTH_RADIUS_KM = 6371;
const CRUISE_SPEED_KMH = 800;
const TAXI_HOURS = 0.5;
const HOME_SHARE = 0.3;
/** Earlier years are taken as typos. */
export const MIN_FLIGHT_YEAR = 1950;

const DATE_PATTERN = /(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?/;
/** "20240305", as some exports write dates; plausible ones only. */
const COMPACT_DATE_PATTERN =
  /(?<!\d)((?:19|20)\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?!\d)/;
const DAY_FIRST_DATE_PATTERN = /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b/;
const CODE_PATTERN = /\b[A-Za-z]{3}\b/g;
/** Multi-leg trips need explicit separators, so CSV rows never become legs. */
const LEG_CHAIN_PATTERN =
  /^[A-Za-z]{3}(?:\s*(?:->|=>|→|–|—|-|>)\s*[A-Za-z]{3})+$/;

/** Metropolitan codes people type that are not single airports. */
const CITY_CODE_HINTS: Record<string, string> = {
  TYO: "HND or NRT",
  OSA: "KIX or ITM",
  SPK: "CTS",
  SEL: "ICN or GMP",
  BJS: "PEK or PKX",
  JKT: "CGK or HLP",
  LON: "LHR, LGW, STN, LTN or LCY",
  PAR: "CDG or ORY",
  MIL: "MXP, LIN or BGY",
  ROM: "FCO or CIA",
  STO: "ARN or BMA",
  MOW: "SVO, DME or VKO",
  NYC: "JFK, EWR or LGA",
  WAS: "IAD, DCA or BWI",
  CHI: "ORD or MDW",
  YTO: "YYZ or YTZ",
  YMQ: "YUL",
  SAO: "GRU, CGH or VCP",
  RIO: "GIG or SDU",
  BUE: "EZE or AEP",
};

const SHORT_COUNTRY_NAMES: Record<string, string> = {
  "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
  "United States of America": "United States",
  "Korea, Republic of": "South Korea",
  "Korea, Democratic People's Republic of": "North Korea",
  "Russian Federation": "Russia",
  "Viet Nam": "Vietnam",
  "Netherlands, Kingdom of the": "Netherlands",
  "Iran, Islamic Republic of": "Iran",
  "Syrian Arab Republic": "Syria",
  "Lao People's Democratic Republic": "Laos",
  "Tanzania, United Republic of": "Tanzania",
  "Venezuela, Bolivarian Republic of": "Venezuela",
  "Bolivia, Plurinational State of": "Bolivia",
  "Moldova, Republic of": "Moldova",
  "Micronesia, Federated States of": "Micronesia",
  "Congo, Democratic Republic of the": "DR Congo",
  "Brunei Darussalam": "Brunei",
  "Falkland Islands (Malvinas)": "Falkland Islands",
  "Cocos (Keeling) Islands": "Cocos Islands",
  "Virgin Islands (British)": "British Virgin Islands",
  "Virgin Islands (U.S.)": "US Virgin Islands",
  "Sint Maarten (Dutch part)": "Sint Maarten",
  Macao: "Macau",
  XK: "Kosovo",
};

const INTEGER_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * The date in log form ("2024-03" or "2024-03-05") when it is a real date
 * from MIN_FLIGHT_YEAR to next year, otherwise undefined.
 */
export function normalizeFlightDate(
  date: string | undefined,
  now: Date = new Date(),
): string | undefined {
  const match = date?.trim().match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = match[3] ? Number(match[3]) : undefined;
  if (
    year < MIN_FLIGHT_YEAR ||
    year > now.getUTCFullYear() + 1 ||
    month < 1 ||
    month > 12 ||
    (day !== undefined && (day < 1 || day > daysInMonth(year, month)))
  ) {
    return undefined;
  }
  return day === undefined
    ? `${year}-${pad(month)}`
    : `${year}-${pad(month)}-${pad(day)}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * Parses a pasted flight log, one flight per line. Accepts an optional
 * `YYYY-MM-DD` or `YYYY-MM` date anywhere on the line, two IATA codes in
 * any case and with any separator, `TPE-NRT-HNL` chains for multi-leg
 * trips, and `#` or `//` comments.
 */
export function parseFlightLog(
  text: string,
  options: { maxFlights?: number; now?: Date } = {},
): ParsedFlightLog {
  const maxFlights = options.maxFlights ?? MAX_PASSPORT_FLIGHTS;
  const maxYear = (options.now ?? new Date()).getUTCFullYear() + 1;
  const flights: ParsedFlightLog["flights"] = [];
  const issues: FlightLogIssue[] = [];
  let truncated = false;

  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const raw = lines[index];
    let line = raw.replace(/(#|\/\/).*$/, "").trim();
    if (!line) continue;
    const report = (message: string) =>
      issues.push({ line: lineNumber, text: raw.trim(), message });

    if (DAY_FIRST_DATE_PATTERN.test(line)) {
      report("Write dates as YYYY-MM-DD.");
      continue;
    }

    let date: string | undefined;
    const dateMatch =
      line.match(DATE_PATTERN) ?? line.match(COMPACT_DATE_PATTERN);
    if (dateMatch) {
      const year = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);
      const day = dateMatch[3] ? Number(dateMatch[3]) : undefined;
      const valid =
        year >= MIN_FLIGHT_YEAR &&
        year <= maxYear &&
        month >= 1 &&
        month <= 12 &&
        (day === undefined || (day >= 1 && day <= daysInMonth(year, month)));
      if (!valid) {
        report(`"${dateMatch[0]}" is not a valid date.`);
        continue;
      }
      date =
        day === undefined
          ? `${year}-${pad(month)}`
          : `${year}-${pad(month)}-${pad(day)}`;
      line = line.replace(dateMatch[0], " ").trim();
    }

    const codes = (line.match(CODE_PATTERN) ?? []).map((code) =>
      code.toUpperCase(),
    );
    let legs: [string, string][];
    if (codes.length === 2) {
      legs = [[codes[0], codes[1]]];
    } else if (codes.length > 2 && LEG_CHAIN_PATTERN.test(line)) {
      legs = codes.slice(1).map((code, leg) => [codes[leg], code]);
    } else if (codes.length > 2) {
      report(
        `Found ${codes.length} codes. Put one flight per line, or join legs with "-".`,
      );
      continue;
    } else {
      // A first line without two codes is most likely a column header.
      if (lineNumber === 1 && !date) continue;
      report("Add two airport codes, like TPE HND.");
      continue;
    }

    for (const [from, to] of legs) {
      if (from === to) {
        report(`${from} to ${from} starts and ends at the same airport.`);
        continue;
      }
      if (flights.length >= maxFlights) {
        if (!truncated) {
          report(
            `Only the first ${INTEGER_FORMAT.format(maxFlights)} flights are used.`,
          );
        }
        truncated = true;
        continue;
      }
      flights.push(
        date
          ? { from, to, date, line: lineNumber }
          : { from, to, line: lineNumber },
      );
    }
  }

  return { flights, issues, truncated };
}

/** Turns flights back into editable log text, one flight per line. */
export function formatFlightLog(flights: readonly PassportFlightInput[]) {
  return flights
    .map((flight) =>
      [flight.date, flight.from, flight.to].filter(Boolean).join(" "),
    )
    .join("\n");
}

function haversineKm(a: AirportInfo, b: AirportInfo) {
  const toRadians = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * toRadians;
  const dLng = (b.longitude - a.longitude) * toRadians;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * toRadians) *
      Math.cos(b.latitude * toRadians) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Looks up both airports of every flight, measures it, and sorts the log:
 * dated flights by date (stable), then undated flights in input order.
 * Flights with an unknown airport are dropped and reported in `unknown`.
 */
export function resolveFlights(
  flights: readonly PassportFlightInput[],
  lookup: AirportLookup,
): ResolvedLog {
  const unknownCounts = new Map<string, number>();
  const resolved: (Omit<ResolvedFlight, "order"> & { index: number })[] = [];

  // Lookups can be custom, so an airport without real coordinates counts
  // as unknown rather than breaking distances and the map.
  const find = (code: string) => {
    const airport = lookup(code);
    return airport &&
      Number.isFinite(airport.latitude) &&
      Number.isFinite(airport.longitude)
      ? airport
      : undefined;
  };
  flights.forEach((flight, index) => {
    const from = find(flight.from);
    const to = find(flight.to);
    for (const [code, airport] of [
      [flight.from, from],
      [flight.to, to],
    ] as const) {
      if (!airport) unknownCounts.set(code, (unknownCounts.get(code) ?? 0) + 1);
    }
    if (!from || !to) return;
    // Flights passed in directly skip parseFlightLog, which drops flights
    // that start and end at one airport and counts a date that isn't real
    // as no date.
    if (from.code === to.code) return;
    const date = normalizeFlightDate(flight.date);
    const year = date ? Number(date.slice(0, 4)) : undefined;
    const month = date ? Number(date.slice(5, 7)) : undefined;
    resolved.push({
      from,
      to,
      date,
      year,
      month,
      distanceKm: haversineKm(from, to),
      index,
    });
  });

  resolved.sort((a, b) => {
    if (a.date && b.date && a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return a.index - b.index;
  });

  return {
    flights: resolved.map((entry, order) => ({
      from: entry.from,
      to: entry.to,
      date: entry.date,
      year: entry.year,
      month: entry.month,
      distanceKm: entry.distanceKm,
      order,
    })),
    unknown: [...unknownCounts]
      .map(([code, count]) => ({ code, count, hint: CITY_CODE_HINTS[code] }))
      .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code, "en")),
  };
}

/** Groups flights by city pair, counting both directions together. */
export function aggregateRoutes(
  flights: readonly ResolvedFlight[],
): RouteSummary[] {
  const routes = new Map<string, RouteSummary>();
  for (const flight of flights) {
    const [a, b] =
      flight.from.code < flight.to.code
        ? [flight.from, flight.to]
        : [flight.to, flight.from];
    const key = `${a.code}-${b.code}`;
    const route = routes.get(key);
    if (route) {
      route.count += 1;
    } else {
      routes.set(key, { key, a, b, count: 1, distanceKm: flight.distanceKm });
    }
  }
  return [...routes.values()].sort(
    (x, y) =>
      y.count - x.count ||
      y.distanceKm - x.distanceKm ||
      x.key.localeCompare(y.key, "en"),
  );
}

function rankAirports(flights: readonly ResolvedFlight[]): AirportVisits[] {
  const visits = new Map<string, AirportVisits>();
  for (const flight of flights) {
    for (const airport of [flight.from, flight.to]) {
      const entry = visits.get(airport.code);
      if (entry) entry.visits += 1;
      else visits.set(airport.code, { airport, visits: 1 });
    }
  }
  // A stable sort keeps ties in the order the airports first appear, so a
  // single round trip makes its departure airport home.
  return [...visits.values()].sort((a, b) => b.visits - a.visits);
}

function findHomeAirport(
  airportVisits: readonly AirportVisits[],
  flightCount: number,
) {
  const top = airportVisits[0];
  if (!top || flightCount === 0) return undefined;
  return top.visits / (flightCount * 2) >= HOME_SHARE ? top.airport : undefined;
}

/** Lifetime (or any subset's) totals, highlights, and rankings. */
export function computePassportStats(
  flights: readonly ResolvedFlight[],
): PassportStats {
  let distanceKm = 0;
  let hours = 0;
  let domestic = 0;
  let undated = 0;
  let longest: ResolvedFlight | undefined;
  let first: ResolvedFlight | undefined;
  let last: ResolvedFlight | undefined;
  const countryFlights = new Map<string, number>();
  const perYear = new Map<number, { flights: number; distanceKm: number }>();

  for (const flight of flights) {
    distanceKm += flight.distanceKm;
    hours += flight.distanceKm / CRUISE_SPEED_KMH + TAXI_HOURS;
    if (flight.from.country === flight.to.country) domestic += 1;
    for (const country of new Set([flight.from.country, flight.to.country])) {
      countryFlights.set(country, (countryFlights.get(country) ?? 0) + 1);
    }
    if (!longest || flight.distanceKm > longest.distanceKm) longest = flight;
    if (flight.year === undefined) {
      undated += 1;
      continue;
    }
    if (!first || flight.order < first.order) first = flight;
    if (!last || flight.order > last.order) last = flight;
    const year = perYear.get(flight.year) ?? { flights: 0, distanceKm: 0 };
    year.flights += 1;
    year.distanceKm += flight.distanceKm;
    perYear.set(flight.year, year);
  }

  const airportVisits = rankAirports(flights);
  return {
    flights: flights.length,
    distanceKm,
    hours,
    aroundEarth: distanceKm / EARTH_CIRCUMFERENCE_KM,
    toMoon: distanceKm / MOON_DISTANCE_KM,
    domestic,
    longest,
    first,
    last,
    home: findHomeAirport(airportVisits, flights.length),
    airportVisits,
    routes: aggregateRoutes(flights),
    countries: [...countryFlights]
      .map(([country, count]) => ({ country, flights: count }))
      .sort(
        (a, b) =>
          b.flights - a.flights || a.country.localeCompare(b.country, "en"),
      ),
    perYear: [...perYear]
      .map(([year, totals]) => ({ year, ...totals }))
      .sort((a, b) => a.year - b.year),
    undated,
  };
}

/** Years that have at least one dated flight, newest first. */
export function listFlightYears(flights: readonly ResolvedFlight[]) {
  const years = new Set<number>();
  for (const flight of flights) {
    if (flight.year !== undefined) years.add(flight.year);
  }
  return [...years].sort((a, b) => b - a);
}

function summarizeYear(
  flights: readonly ResolvedFlight[],
  year: number,
): YearComparison {
  const airports = new Set<string>();
  const countries = new Set<string>();
  let distanceKm = 0;
  for (const flight of flights) {
    distanceKm += flight.distanceKm;
    airports.add(flight.from.code).add(flight.to.code);
    countries.add(flight.from.country).add(flight.to.country);
  }
  return {
    year,
    flights: flights.length,
    distanceKm,
    airports: airports.size,
    countries: countries.size,
  };
}

/**
 * One year of dated flights: totals, a month-by-month breakdown, places
 * visited for the first time, and a comparison with the year before.
 * Returns null when the year has no dated flights.
 */
export function computeYearInReview(
  flights: readonly ResolvedFlight[],
  year: number,
  now: Date = new Date(),
): YearInReview | null {
  const dated = flights.filter((flight) => flight.year !== undefined);
  const inYear = dated.filter((flight) => flight.year === year);
  if (inYear.length === 0) return null;

  const months = MONTH_NAMES.map((_, index) => ({
    month: index + 1,
    flights: 0,
    distanceKm: 0,
  }));
  for (const flight of inYear) {
    if (!flight.month) continue;
    months[flight.month - 1].flights += 1;
    months[flight.month - 1].distanceKm += flight.distanceKm;
  }
  const busiest = months.reduce(
    (best, month) => (month.flights > best.flights ? month : best),
    months[0],
  );

  const before = dated.filter((flight) => (flight.year ?? 0) < year);
  const seenAirports = new Set<string>();
  const seenCountries = new Set<string>();
  for (const flight of before) {
    seenAirports.add(flight.from.code).add(flight.to.code);
    seenCountries.add(flight.from.country).add(flight.to.country);
  }
  const newAirports: AirportInfo[] = [];
  const newCountries: string[] = [];
  for (const flight of inYear) {
    for (const airport of [flight.from, flight.to]) {
      if (!seenAirports.has(airport.code)) {
        seenAirports.add(airport.code);
        newAirports.push(airport);
      }
      if (!seenCountries.has(airport.country)) {
        seenCountries.add(airport.country);
        newCountries.push(airport.country);
      }
    }
  }

  const firstYearOnRecord = before.length === 0;
  const stats = computePassportStats(inYear);
  const home = findHomeAirport(rankAirports(flights), flights.length);

  return {
    year,
    // Next year's planned flights are a year still under way, too.
    isCurrentYear: year >= now.getUTCFullYear(),
    stats,
    months,
    busiestMonth:
      busiest.flights > 0
        ? { month: busiest.month, flights: busiest.flights }
        : undefined,
    newAirports: firstYearOnRecord ? [] : newAirports,
    newCountries: firstYearOnRecord ? [] : newCountries,
    firstYearOnRecord,
    previous: firstYearOnRecord
      ? undefined
      : summarizeYear(
          dated.filter((flight) => flight.year === year - 1),
          year - 1,
        ),
    topDestination: stats.airportVisits.find(
      (entry) => entry.airport.code !== home?.code,
    ),
  };
}

/** Replay pacing: a flight takes longer the farther it goes. */
const REPLAY_LEG_BASE_MS = 700;
const REPLAY_LEG_MS_PER_1000_KM = 80;
const REPLAY_LEG_MAX_MS = 2000;
const REPLAY_LEG_GAP_MS = 100;
/** Longer logs take off closer together so a replay ends within about this long. */
const REPLAY_MAX_MS = 15000;
/** Flights in the busiest logs fly at no less than this share of their normal duration. */
const REPLAY_MIN_PACE = 0.35;
/** Time before the first takeoff, so the map settles first. */
export const REPLAY_LEAD_IN_MS = 600;

/** Airliner seen from above, nose up, on a 24×24 grid: the replay's plane. */
export const PLANE_ICON_PATH =
  "M12 2.5c.75 0 1.35.6 1.35 1.35v5.1l6.1 3.65v1.75l-6.1-1.85v4.2l2.1 1.55v1.35L12 18.7l-3.45.9v-1.35l2.1-1.55v-4.2l-6.1 1.85V12.6l6.1-3.65v-5.1c0-.75.6-1.35 1.35-1.35Z";

/** Takeoff and landing, in ms from the start of a replay. */
export type ReplaySlot = { start: number; end: number };

/**
 * Schedules a replay of flights in order, given each one's distance.
 * Flights take off one after another; when that would run past
 * REPLAY_MAX_MS they take off closer together and fly faster, so later
 * flights leave before earlier ones land.
 */
export function scheduleReplay(distancesKm: readonly number[]): ReplaySlot[] {
  const durations = distancesKm.map((distanceKm) =>
    Math.min(
      REPLAY_LEG_MAX_MS,
      REPLAY_LEG_BASE_MS + (distanceKm / 1000) * REPLAY_LEG_MS_PER_1000_KM,
    ),
  );
  const last = durations[durations.length - 1] ?? 0;
  const spacing = durations
    .slice(0, -1)
    .reduce((sum, duration) => sum + duration + REPLAY_LEG_GAP_MS, 0);
  const budget = Math.max(0, REPLAY_MAX_MS - REPLAY_LEAD_IN_MS - last);
  const scale = spacing > budget ? budget / spacing : 1;
  // Busy logs also fly faster, so fewer planes share the sky at once.
  const pace = Math.max(REPLAY_MIN_PACE, Math.sqrt(scale));
  let start = REPLAY_LEAD_IN_MS;
  return durations.map((duration) => {
    const slot = { start, end: start + duration * pace };
    start += (duration + REPLAY_LEG_GAP_MS) * scale;
    return slot;
  });
}

/** Progress along a flight (0–1): planes speed up after takeoff and slow down to land. */
export function easeFlight(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2;
}

export function formatInteger(value: number) {
  return INTEGER_FORMAT.format(value);
}

export function convertDistance(km: number, unit: DistanceUnit) {
  return unit === "mi" ? km / KM_PER_MILE : km;
}

export function formatDistance(km: number, unit: DistanceUnit) {
  return `${formatInteger(convertDistance(km, unit))} ${unit}`;
}

/** "1.23M" from a million up, plain grouped digits below. */
export function formatCompactNumber(value: number) {
  if (value < 1_000_000) return formatInteger(value);
  return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
}

/** "7.8×" below ten, "12×" from ten up. */
export function formatMultiplier(value: number) {
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)}×`;
}

/**
 * "3.4× around the Earth", or "4% around the Earth" for short logs, where
 * the multiplier would round to 0.0×.
 */
export function formatAroundEarth(aroundEarth: number) {
  const amount =
    aroundEarth >= 0.1
      ? formatMultiplier(aroundEarth)
      : `${Math.max(1, Math.floor(aroundEarth * 100))}%`;
  return `${amount} around the Earth`;
}

/** "Jan 2026" for month dates, "Jan 9, 2026" for full dates. */
export function formatFlightDate(date?: string) {
  if (!date) return "Undated";
  const year = date.slice(0, 4);
  const month = MONTH_NAMES[Number(date.slice(5, 7)) - 1] ?? "";
  const day = date.length > 7 ? Number(date.slice(8, 10)) : undefined;
  return day ? `${month} ${day}, ${year}` : `${month} ${year}`;
}

/** Everyday names for the longer official names in the airport database. */
export function shortCountryName(country: string) {
  return SHORT_COUNTRY_NAMES[country] ?? country;
}

/**
 * About three years of flights from a Taipei home base, including routes
 * across the date line. Every code is in the built-in airport database.
 */
export const SAMPLE_PASSPORT_FLIGHTS: readonly PassportFlightInput[] = [
  { date: "2024-01-12", from: "TPE", to: "HND" },
  { date: "2024-01-17", from: "HND", to: "TPE" },
  { date: "2024-03-08", from: "TPE", to: "BKK" },
  { date: "2024-03-13", from: "BKK", to: "TPE" },
  { date: "2024-05-02", from: "TPE", to: "ICN" },
  { date: "2024-05-06", from: "ICN", to: "TPE" },
  { date: "2024-07-19", from: "TPE", to: "SIN" },
  { date: "2024-07-23", from: "SIN", to: "KUL" },
  { date: "2024-07-27", from: "KUL", to: "TPE" },
  { date: "2024-10-10", from: "TPE", to: "OKA" },
  { date: "2024-10-14", from: "OKA", to: "TPE" },
  { date: "2024-12-20", from: "TPE", to: "KIX" },
  { date: "2024-12-27", from: "KIX", to: "TPE" },
  { date: "2025-02-07", from: "TPE", to: "CTS" },
  { date: "2025-02-12", from: "CTS", to: "TPE" },
  { date: "2025-04-03", from: "TPE", to: "HKG" },
  { date: "2025-04-05", from: "HKG", to: "TPE" },
  { date: "2025-06-14", from: "TPE", to: "DXB" },
  { date: "2025-06-15", from: "DXB", to: "ZRH" },
  { date: "2025-06-22", from: "ZRH", to: "AMS" },
  { date: "2025-06-28", from: "AMS", to: "TPE" },
  { date: "2025-08-09", from: "TPE", to: "SEA" },
  { date: "2025-08-13", from: "SEA", to: "SFO" },
  { date: "2025-08-18", from: "SFO", to: "TPE" },
  { date: "2025-11-21", from: "TPE", to: "DAD" },
  { date: "2025-11-25", from: "DAD", to: "TPE" },
  { date: "2026-01-09", from: "TPE", to: "HND" },
  { date: "2026-01-14", from: "HND", to: "TPE" },
  { date: "2026-03-02", from: "TPE", to: "NRT" },
  { date: "2026-03-03", from: "NRT", to: "HNL" },
  { date: "2026-03-10", from: "HNL", to: "NRT" },
  { date: "2026-03-11", from: "NRT", to: "TPE" },
  { date: "2026-04-18", from: "TPE", to: "SIN" },
  { date: "2026-04-23", from: "SIN", to: "BKK" },
  { date: "2026-04-27", from: "BKK", to: "TPE" },
  { date: "2026-06-11", from: "TPE", to: "SFO" },
  { date: "2026-06-15", from: "SFO", to: "JFK" },
  { date: "2026-06-24", from: "JFK", to: "TPE" },
  { date: "2026-07-30", from: "TPE", to: "FUK" },
  { date: "2026-08-03", from: "FUK", to: "TPE" },
  { date: "2026-09-04", from: "TPE", to: "KIX" },
  { date: "2026-09-08", from: "KIX", to: "TPE" },
];

#!/usr/bin/env node
/**
 * Builds src/data/airports-extended.json: airports with an IATA code that
 * the built-in registry database (src/registry/flight-airports.ts) lacks,
 * so the /passport page can resolve less common codes in people's logs.
 *
 * Data: OurAirports, public domain — https://ourairports.com/data/
 *
 * Usage:
 *   curl -o airports.csv https://davidmegginson.github.io/ourairports-data/airports.csv
 *   node scripts/build-airports-extended.mjs airports.csv
 *
 * Each entry is [code, name, city, country, latitude, longitude], with
 * country names spelled the way the built-in database spells them.
 *
 * Also writes src/data/country-codes.json, mapping every country name used
 * by either dataset to its ISO 3166-1 alpha-2 code (for flags).
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const [csvPath] = process.argv.slice(2);
if (!csvPath) {
  console.error(
    "Usage: node scripts/build-airports-extended.mjs <airports.csv>",
  );
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const outputPath = path.join(root, "src/data/airports-extended.json");
const countryCodesPath = path.join(root, "src/data/country-codes.json");

/** Built-in codes and their country names, read from the registry source. */
const builtInCountries = new Map();
const builtInSource = readFileSync(
  path.join(root, "src/registry/flight-airports.ts"),
  "utf8",
);
for (const match of builtInSource.matchAll(
  /code: "([A-Z]{3})"[^}]*?country: "([^"]+)"/g,
)) {
  builtInCountries.set(match[1], match[2]);
}
if (builtInCountries.size === 0) {
  console.error("Couldn't read airports from src/registry/flight-airports.ts");
  process.exit(1);
}

/**
 * Metropolitan codes (TYO, JKT) that the passport answers with a hint
 * instead of an airport, read from CITY_CODE_HINTS in the block's source.
 */
const statsSource = readFileSync(
  path.join(
    root,
    "src/registry/blocks/flight-passport/flight-passport-stats.ts",
  ),
  "utf8",
);
const cityCodes = new Set(
  [
    ...(
      statsSource.match(/const CITY_CODE_HINTS[^]*?\n};/)?.[0] ?? ""
    ).matchAll(/^ {2}([A-Z]{3}):/gm),
  ].map((match) => match[1]),
);
if (cityCodes.size === 0) {
  console.error("Couldn't read CITY_CODE_HINTS from flight-passport-stats.ts");
  process.exit(1);
}

/** Minimal RFC 4180 parser: quoted fields, doubled quotes, CRLF. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const [header, ...records] = parseCsv(readFileSync(csvPath, "utf8"));
const column = Object.fromEntries(header.map((name, index) => [name, index]));
// A renamed column (or an error page saved as the CSV) would otherwise skip
// every row and overwrite the data with an empty list.
const missingColumns = [
  "iata_code",
  "iso_country",
  "type",
  "scheduled_service",
  "latitude_deg",
  "longitude_deg",
  "name",
  "municipality",
  "wikipedia_link",
  "keywords",
].filter((name) => !(name in column));
if (missingColumns.length > 0) {
  console.error(`${csvPath} lacks columns: ${missingColumns.join(", ")}`);
  process.exit(1);
}
const get = (record, name) => (record[column[name]] ?? "").trim();

// Learn ISO code → country name from airports both datasets share, so the
// extended data counts countries exactly like the built-in data does.
const countryNames = new Map();
for (const record of records) {
  const name = builtInCountries.get(get(record, "iata_code"));
  const iso = get(record, "iso_country");
  if (name && iso && !countryNames.has(iso)) countryNames.set(iso, name);
}
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (iso) => {
  if (countryNames.has(iso)) return countryNames.get(iso);
  try {
    return regionNames.of(iso) ?? iso;
  } catch {
    return iso;
  }
};

const TYPE_RANK = {
  large_airport: 0,
  medium_airport: 1,
  small_airport: 2,
  seaplane_base: 3,
  heliport: 4,
  closed: 5,
};

const IATA_PATTERN = /^[A-Z]{3}$/;
const activeCodes = new Set(builtInCountries.keys());
for (const record of records) {
  const code = get(record, "iata_code").toUpperCase();
  if (IATA_PATTERN.test(code)) activeCodes.add(code);
}

/**
 * OurAirports clears the IATA code when an airport closes, but old logs
 * still use it (TXL, SXF, REP). Recover it from the keywords of notable
 * closed airports when exactly one unused code is listed there.
 */
function retiredCode(record) {
  if (get(record, "type") !== "closed" || !get(record, "wikipedia_link")) {
    return "";
  }
  const codes = get(record, "keywords")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(
      (keyword) => IATA_PATTERN.test(keyword) && !activeCodes.has(keyword),
    );
  return codes.length === 1 ? codes[0] : "";
}

const candidates = new Map();
for (const record of records) {
  const code = get(record, "iata_code").toUpperCase() || retiredCode(record);
  if (
    !IATA_PATTERN.test(code) ||
    builtInCountries.has(code) ||
    cityCodes.has(code)
  ) {
    continue;
  }
  const type = get(record, "type");
  const scheduled = get(record, "scheduled_service") === "yes";
  // Airports with airline service, larger airports, and closed airports that
  // still carry their code (old logs use TXL, SXF, and the like).
  const keep =
    scheduled ||
    type === "large_airport" ||
    type === "medium_airport" ||
    type === "closed";
  if (!keep) continue;
  // Number("") is 0, so a missing coordinate would land at 0°, 0°.
  const rawLatitude = get(record, "latitude_deg");
  const rawLongitude = get(record, "longitude_deg");
  if (!rawLatitude || !rawLongitude) continue;
  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

  // When several records share a code, prefer scheduled service, then size.
  const rank = (scheduled ? 0 : 10) + (TYPE_RANK[type] ?? 6);
  const existing = candidates.get(code);
  if (existing && existing.rank <= rank) continue;
  const name = get(record, "name");
  candidates.set(code, {
    rank,
    entry: [
      code,
      name,
      get(record, "municipality") || name,
      countryName(get(record, "iso_country")),
      Number(latitude.toFixed(4)),
      Number(longitude.toFixed(4)),
    ],
  });
}

const entries = [...candidates.values()]
  .map((candidate) => candidate.entry)
  // A fixed locale, so the output doesn't change with the machine's.
  .sort((a, b) => a[0].localeCompare(b[0], "en"));
if (entries.length < 1000) {
  console.error(`Only ${entries.length} airports found; check the input CSV.`);
  process.exit(1);
}
writeFileSync(outputPath, `${JSON.stringify(entries)}\n`);
console.log(
  `Wrote ${entries.length} airports to ${path.relative(root, outputPath)}`,
);

// Country name -> ISO code, for every name either dataset uses.
const countryCodes = {};
for (const [iso, name] of countryNames) countryCodes[name] ??= iso;
for (const record of records) {
  const iso = get(record, "iso_country");
  if (/^[A-Z]{2}$/.test(iso)) countryCodes[countryName(iso)] ??= iso;
}
const usedNames = new Set([
  ...builtInCountries.values(),
  ...entries.map((entry) => entry[3]),
]);
const sortedCodes = Object.fromEntries(
  Object.entries(countryCodes)
    .filter(([name]) => usedNames.has(name))
    .sort(([a], [b]) => a.localeCompare(b, "en")),
);
writeFileSync(countryCodesPath, `${JSON.stringify(sortedCodes, null, 2)}\n`);
const missing = [...usedNames].filter((name) => !(name in sortedCodes));
console.log(
  `Wrote ${Object.keys(sortedCodes).length} country codes to ${path.relative(root, countryCodesPath)}${
    missing.length ? ` (no code for: ${missing.join(", ")})` : ""
  }`,
);

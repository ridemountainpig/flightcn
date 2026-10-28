import entries from "@/data/airports-extended.json";

import {
  builtInLookup,
  composeLookup,
  lookupFromEntries,
  type ExtendedAirportEntry,
} from "./airport-lookup";

/** Built-in airports first, then the extended OurAirports list. */
export const serverAirportLookup = composeLookup(
  builtInLookup,
  lookupFromEntries(entries as unknown as ExtendedAirportEntry[]),
);

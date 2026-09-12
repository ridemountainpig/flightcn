"use client";

import { MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Map, useMap } from "@/components/ui/map";
import {
  FlightAirport,
  airports,
  type AirportInfo,
} from "@/components/ui/flight";

const FEATURED_CODES = ["TPE", "HND", "ICN", "SIN", "LHR", "JFK", "SFO", "SYD"];
const MAX_RESULTS = 30;

const ALL_AIRPORTS: readonly AirportInfo[] = Object.values(airports);

function searchAirports(query: string): AirportInfo[] {
  const term = query.trim().toLowerCase();
  if (!term) {
    return FEATURED_CODES.map((code) => airports[code]).filter(Boolean);
  }
  const matches: { airport: AirportInfo; score: number }[] = [];
  for (const airport of ALL_AIRPORTS) {
    const code = airport.code.toLowerCase();
    const haystack =
      `${airport.city} ${airport.country} ${airport.name}`.toLowerCase();
    let score = -1;
    if (code === term) score = 0;
    else if (code.startsWith(term)) score = 1;
    else if (haystack.includes(term)) score = 2;
    if (score >= 0) matches.push({ airport, score });
  }
  return matches
    .sort(
      (a, b) =>
        a.score - b.score || a.airport.code.localeCompare(b.airport.code),
    )
    .slice(0, MAX_RESULTS)
    .map((match) => match.airport);
}

function AirportCamera({ airport }: { airport: AirportInfo | null }) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded || !airport) return;
    map.flyTo({
      center: [airport.longitude, airport.latitude],
      zoom: 9,
      duration: 1200,
    });
  }, [map, isLoaded, airport]);
  return null;
}

export function AirportSearchMap() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AirportInfo | null>(
    airports.TPE ?? null,
  );
  const results = useMemo(() => searchAirports(query), [query]);

  return (
    <div className="grid min-h-[480px] w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[300px_1fr]">
      <aside className="flex min-h-0 flex-col border-b border-slate-200 lg:border-r lg:border-b-0">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
            <MapPin size={13} aria-hidden="true" /> AIRPORT DIRECTORY
          </p>
        </div>
        <div className="border-b border-slate-200 p-3">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-600">
            <Search size={15} className="shrink-0 text-slate-500" />
            <input
              aria-label="Search airports"
              placeholder="IATA code, city or country"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />
          </label>
        </div>
        <ul
          aria-label="Airport results"
          className="max-h-56 min-h-0 flex-1 overflow-y-auto p-2 lg:max-h-none"
        >
          {results.map((airport) => (
            <li key={airport.code}>
              <button
                type="button"
                onClick={() => setSelected(airport)}
                aria-pressed={selected?.code === airport.code}
                className={`flex w-full items-baseline gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 ${
                  selected?.code === airport.code
                    ? "bg-orange-50 text-orange-800"
                    : "text-slate-700"
                }`}
              >
                <span className="w-10 shrink-0 font-mono font-medium">
                  {airport.code}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{airport.city}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {airport.name}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-slate-500">
              No airports match “{query.trim()}”.
            </li>
          ) : null}
        </ul>
        {selected ? (
          <p className="border-t border-slate-200 px-4 py-3 font-mono text-[10px] text-slate-500">
            {selected.code} · {selected.latitude.toFixed(2)},{" "}
            {selected.longitude.toFixed(2)} · {selected.country}
          </p>
        ) : null}
      </aside>
      <div className="relative min-h-[320px]">
        <Map
          theme="light"
          center={[121.23, 25.08]}
          zoom={6}
          className="h-full w-full"
        >
          <AirportCamera airport={selected} />
          {selected ? (
            <FlightAirport key={selected.code} code={selected.code} showLabel />
          ) : null}
        </Map>
      </div>
    </div>
  );
}

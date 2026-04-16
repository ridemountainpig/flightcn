"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Search } from "lucide-react";

import { useMap } from "@/components/ui/map";
import { searchAirports } from "@/lib/flight-airports-search";
import { allAirports } from "@/components/home/home-config";
import { type AirportInfo } from "@/registry/flight-airports";

function AirportSearchSummary({ airport }: { airport: AirportInfo | null }) {
  if (!airport) {
    return (
      <div className="border-b px-3 py-3">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
          Airport Registry
        </p>
        <h1 className="mt-1 text-sm font-semibold">
          Search airports by IATA code, city, country, or airport name
        </h1>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          Browse the built-in airport dataset and jump straight to markers on
          the map.
        </p>
      </div>
    );
  }

  return (
    <div className="border-b px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="bg-muted rounded-full px-2 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
              {airport.code}
            </span>
            <span className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
              Airport
            </span>
          </div>
          <p className="mt-2 truncate text-sm font-semibold">{airport.name}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {airport.city}, {airport.country}
          </p>
        </div>
        <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-muted/50 rounded-md px-2.5 py-2">
          <p className="text-muted-foreground">Latitude</p>
          <p className="mt-1 font-medium">{airport.latitude.toFixed(4)}</p>
        </div>
        <div className="bg-muted/50 rounded-md px-2.5 py-2">
          <p className="text-muted-foreground">Longitude</p>
          <p className="mt-1 font-medium">{airport.longitude.toFixed(4)}</p>
        </div>
      </div>
    </div>
  );
}

function AirportSearchResults({
  query,
  results,
  onSelect,
}: {
  query: string;
  results: AirportInfo[];
  onSelect: (airport: AirportInfo) => void;
}) {
  if (!query.trim()) return null;

  return (
    <div className="max-h-64 overflow-y-auto border-b">
      {results.length === 0 ? (
        <div className="text-muted-foreground px-3 py-4 text-center text-sm">
          No airports found
        </div>
      ) : (
        results.map((airport) => (
          <button
            key={airport.code}
            onClick={() => onSelect(airport)}
            className="hover:bg-accent flex w-full cursor-pointer items-start gap-2.5 px-3 py-2 text-left transition-colors"
          >
            <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold">{airport.code}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {airport.name}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {airport.city}, {airport.country}
              </p>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

export function AirportSearchPanel() {
  const { map } = useMap();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedAirportCode, setSelectedAirportCode] = useState<string | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchAirports(allAirports, query, 8), [query]);
  const activeAirport = useMemo(() => {
    if (!query.trim()) return null;

    return (
      results.find((airport) => airport.code === selectedAirportCode) ??
      results[0] ??
      null
    );
  }, [query, results, selectedAirportCode]);

  const handleSelect = useCallback(
    (airport: AirportInfo) => {
      if (!map) return;

      setSelectedAirportCode(airport.code);
      setQuery(airport.code);
      map.flyTo({
        center: [airport.longitude, airport.latitude],
        zoom: 10,
        duration: 2000,
      });
    },
    [map],
  );

  if (collapsed) {
    return (
      <div className="bg-card/90 border-border text-card-foreground absolute right-4 bottom-4 z-50 rounded-lg border p-2 shadow-lg backdrop-blur-sm">
        <button
          onClick={() => {
            setCollapsed(false);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="hover:bg-accent flex h-10 cursor-pointer items-center gap-1.5 rounded-md px-3 transition-colors"
        >
          <Search className="text-muted-foreground size-4" />
          <ChevronUp className="text-muted-foreground size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute right-4 bottom-4 left-4 z-50 sm:left-auto">
      <div className="bg-card/90 border-border text-card-foreground w-full overflow-hidden rounded-lg border shadow-lg backdrop-blur-sm sm:w-80 sm:max-w-[calc(100vw-2rem)]">
        <AirportSearchSummary airport={activeAirport} />
        <AirportSearchResults
          query={query}
          results={results}
          onSelect={handleSelect}
        />

        <div className="flex items-center gap-2 p-3">
          <div className="bg-muted/50 flex min-w-0 flex-1 items-center gap-2 rounded-md border px-2.5 py-1.5">
            <Search className="text-muted-foreground size-3.5 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search airports..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="hover:bg-muted shrink-0 cursor-pointer rounded p-1 transition-colors"
            title="Collapse"
          >
            <ChevronDown className="text-muted-foreground size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

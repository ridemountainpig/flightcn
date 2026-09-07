"use client";

import Link from "next/link";
import { ArrowUpRight, Search, TowerControl } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { Map } from "@/components/ui/map";
import {
  allAirports,
  featuredAirportsForSearch,
  mapStyles,
} from "@/components/home/home-config";
import { FlightAirport } from "@/registry/flight";
import { searchAirports } from "@/lib/flight-airports-search";
import { useResponsiveZoom } from "@/lib/map-responsive-zoom";

export function AirportSearchSection() {
  const [query, setQuery] = useState("");
  const [selectedAirportCode, setSelectedAirportCode] = useState<string | null>(
    null,
  );
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    if (!deferredQuery.trim()) {
      return featuredAirportsForSearch;
    }
    return searchAirports(allAirports, deferredQuery);
  }, [deferredQuery]);

  const selectedAirport = useMemo(() => {
    if (results.length === 0) {
      return null;
    }

    return (
      results.find((airport) => airport.code === selectedAirportCode) ??
      results[0]
    );
  }, [results, selectedAirportCode]);

  const baseZoom = selectedAirport ? 2.8 : 0.9;
  const mapZoom = useResponsiveZoom(baseZoom);

  return (
    <section className="mt-14 border-t border-slate-200 pt-12 sm:mt-20 sm:pt-16 xl:flex xl:h-168 xl:flex-col">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-xl">
          <p className="section-kicker">Airport Search</p>
          <h2 className="section-title mt-4">
            The world, three letters at a time.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Search by code, city, or country. Every airport is included in the
            registry, ready for your next route.
          </p>
          <div>
            <Link
              href="/airports"
              className="pressable mt-4 inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
            >
              View all airports
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
        <label className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-600 sm:px-4 sm:py-3">
          <Search className="size-4 shrink-0 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search airports"
            placeholder="Search TPE, Tokyo, Taiwan, Narita…"
            className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-500"
          />
        </label>
      </div>
      <div className="mt-6 grid gap-3 sm:gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.9fr)]">
        <div className="overflow-hidden rounded-xl border border-black/8 bg-slate-50/70 p-3 xl:h-full xl:min-h-0">
          {results.length === 0 ? (
            <div className="flex h-104 flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-black/10 bg-white/70 px-4 text-center sm:h-129 xl:h-full">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 bg-white text-slate-500 shadow-sm">
                <TowerControl />
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-slate-900 sm:text-3xl">
                No airport found
              </h3>
              <p className="mt-3 max-w-md text-sm text-slate-500 sm:text-base">
                No airports matched the current search.
              </p>
            </div>
          ) : (
            <div className="custom-scrollbar grid h-104 auto-rows-[6.5rem] gap-3 overflow-y-auto sm:h-129 sm:auto-rows-[7.5rem] sm:grid-cols-2 xl:h-full xl:min-h-0">
              {results.map((airport) => {
                const isActive = airport.code === selectedAirport?.code;

                return (
                  <button
                    key={airport.code}
                    type="button"
                    onClick={() => setSelectedAirportCode(airport.code)}
                    className={`rounded-lg border px-3 py-3 text-left transition-colors sm:px-4 ${
                      isActive
                        ? "border-orange-200 bg-orange-50 text-orange-900"
                        : "border-black/8 bg-white text-slate-950 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-lg font-semibold">
                        {airport.code}
                      </span>
                      <span
                        className={`max-w-28 truncate rounded-full px-2 py-1 text-[11px] font-medium ${
                          isActive
                            ? "bg-orange-100 text-orange-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {airport.country}
                      </span>
                    </div>
                    <p
                      className={`mt-2 max-h-10 overflow-hidden text-sm leading-5 font-medium ${
                        isActive ? "text-orange-900" : "text-slate-900"
                      }`}
                    >
                      {airport.name}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isActive ? "text-orange-800" : "text-slate-500"
                      }`}
                    >
                      {airport.city}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-black/8 bg-[#ececeb] xl:h-full">
          <Map
            className="h-72 w-full sm:h-80 xl:h-full"
            viewport={{
              center: selectedAirport
                ? [selectedAirport.longitude, selectedAirport.latitude]
                : [15, 18],
              zoom: mapZoom,
            }}
            onViewportChange={() => {}}
            styles={mapStyles}
            projection={{ type: "globe" }}
          >
            {results.map((airport) => {
              const isActive = airport.code === selectedAirport?.code;

              return (
                <FlightAirport
                  key={airport.code}
                  code={airport.code}
                  showLabel={isActive}
                  markerContent={
                    <div
                      className={`rounded-full border-2 border-white shadow-lg ${
                        isActive
                          ? "h-4 w-4 bg-orange-600"
                          : "h-3 w-3 bg-slate-500"
                      }`}
                    />
                  }
                />
              );
            })}
          </Map>
        </div>
      </div>
    </section>
  );
}

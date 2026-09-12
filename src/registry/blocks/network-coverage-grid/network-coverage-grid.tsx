"use client";

import { Globe2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Map, useMap } from "@/components/ui/map";
import {
  FlightAirport,
  getAirportInfo,
  SingleWorldZoomLimit,
} from "@/components/ui/flight";

type CoverageAirport = {
  code: string;
  region: string;
  departures24h: number;
  gates: number;
  onTimeRate: number;
};

const AIRPORTS: readonly CoverageAirport[] = [
  {
    code: "TPE",
    region: "Asia Pacific",
    departures24h: 312,
    gates: 62,
    onTimeRate: 91,
  },
  {
    code: "HND",
    region: "Asia Pacific",
    departures24h: 458,
    gates: 114,
    onTimeRate: 94,
  },
  {
    code: "ICN",
    region: "Asia Pacific",
    departures24h: 387,
    gates: 111,
    onTimeRate: 92,
  },
  {
    code: "SIN",
    region: "Asia Pacific",
    departures24h: 402,
    gates: 140,
    onTimeRate: 90,
  },
  {
    code: "LHR",
    region: "Europe",
    departures24h: 476,
    gates: 115,
    onTimeRate: 82,
  },
  {
    code: "CDG",
    region: "Europe",
    departures24h: 441,
    gates: 104,
    onTimeRate: 84,
  },
  {
    code: "FRA",
    region: "Europe",
    departures24h: 429,
    gates: 120,
    onTimeRate: 81,
  },
  {
    code: "JFK",
    region: "North America",
    departures24h: 455,
    gates: 128,
    onTimeRate: 77,
  },
  {
    code: "LAX",
    region: "North America",
    departures24h: 494,
    gates: 146,
    onTimeRate: 79,
  },
  {
    code: "ORD",
    region: "North America",
    departures24h: 512,
    gates: 191,
    onTimeRate: 76,
  },
  {
    code: "DXB",
    region: "Middle East & Africa",
    departures24h: 468,
    gates: 184,
    onTimeRate: 88,
  },
  {
    code: "JNB",
    region: "Middle East & Africa",
    departures24h: 214,
    gates: 52,
    onTimeRate: 86,
  },
];

const REGIONS = [
  "All",
  ...Array.from(new Set(AIRPORTS.map((airport) => airport.region))),
] as readonly string[];

function CoverageCamera({ code }: { code: string | null }) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    if (!code) {
      map.flyTo({ center: [40, 28], zoom: 0.9, duration: 1200 });
      return;
    }
    const info = getAirportInfo(code);
    if (!info) return;
    map.flyTo({
      center: [info.longitude, info.latitude],
      zoom: 3.5,
      duration: 1200,
    });
  }, [map, isLoaded, code]);
  return null;
}

export function NetworkCoverageGrid() {
  const [region, setRegion] = useState<string>("All");
  const [selected, setSelected] = useState<string | null>(null);

  const visibleAirports = useMemo(
    () =>
      AIRPORTS.filter(
        (airport) => region === "All" || airport.region === region,
      ),
    [region],
  );

  function pickRegion(next: string) {
    setRegion(next);
    setSelected(null);
  }

  return (
    <div className="flex min-h-[480px] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
        <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
          <Globe2 size={13} aria-hidden="true" /> NETWORK COVERAGE
        </p>
        <p className="font-mono text-[10px] text-slate-500">
          {visibleAirports.length} AIRPORTS
        </p>
      </div>
      <div className="relative h-60 shrink-0 sm:h-72">
        <Map
          theme="light"
          center={[40, 28]}
          zoom={0.9}
          scrollZoom={false}
          renderWorldCopies
          className="h-full w-full"
        >
          <SingleWorldZoomLimit />
          <CoverageCamera code={selected} />
          {visibleAirports.map((airport) => {
            const isActive = selected === airport.code;
            return (
              <FlightAirport
                key={airport.code}
                code={airport.code}
                showLabel={isActive}
                onClick={() => setSelected(isActive ? null : airport.code)}
                markerContent={
                  <span
                    className={`block size-2.5 cursor-pointer rounded-full border-2 border-white shadow ${
                      isActive ? "bg-orange-600" : "bg-slate-950"
                    }`}
                  />
                }
              />
            );
          })}
        </Map>
      </div>
      <div
        role="group"
        aria-label="Filter by region"
        className="flex flex-wrap gap-1.5 border-t border-b border-slate-200 p-3"
      >
        {REGIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => pickRegion(option)}
            aria-pressed={region === option}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              region === option
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 text-slate-600 hover:text-slate-950"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <ul
        aria-label="Airports in coverage"
        className="grid flex-1 grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-3"
      >
        {visibleAirports.map((airport) => {
          const info = getAirportInfo(airport.code);
          const isActive = selected === airport.code;
          return (
            <li key={airport.code} className="min-w-0 bg-white">
              <button
                type="button"
                onClick={() => setSelected(isActive ? null : airport.code)}
                aria-pressed={isActive}
                className={`h-full w-full p-4 text-left hover:bg-slate-50 ${
                  isActive ? "bg-orange-50 hover:bg-orange-50" : ""
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={`font-mono text-lg font-medium ${
                      isActive ? "text-orange-800" : "text-slate-950"
                    }`}
                  >
                    {airport.code}
                  </span>
                  <span className="truncate font-mono text-[10px] text-slate-500">
                    {airport.region.toUpperCase()}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">
                  {info?.name}
                </span>
                <span className="mt-3 grid grid-cols-3 gap-2">
                  <span className="min-w-0">
                    <span className="block text-[10px] tracking-widest text-slate-500 uppercase">
                      Deps 24h
                    </span>
                    <span className="block font-mono text-sm text-slate-950">
                      {airport.departures24h}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] tracking-widest text-slate-500 uppercase">
                      Gates
                    </span>
                    <span className="block font-mono text-sm text-slate-950">
                      {airport.gates}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] tracking-widest text-slate-500 uppercase">
                      On-time
                    </span>
                    <span className="block font-mono text-sm text-slate-950">
                      {airport.onTimeRate}%
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

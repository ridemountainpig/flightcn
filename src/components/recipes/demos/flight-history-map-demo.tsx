"use client";

import { useMemo } from "react";

import { Map } from "@/components/ui/map";
import { FlightRoutes, getAirportInfo } from "@/registry/flight";
import { mapStyles } from "@/components/home/home-config";
import { useResponsiveZoom } from "@/lib/map-responsive-zoom";
import { cn } from "@/lib/utils";

/** One year of personal flights — the same shape the recipe walks through. */
const FLIGHTS: readonly { from: string; to: string; date: string }[] = [
  { from: "TPE", to: "HND", date: "2026-01-09" },
  { from: "HND", to: "TPE", date: "2026-01-14" },
  { from: "TPE", to: "ICN", date: "2026-03-02" },
  { from: "ICN", to: "TPE", date: "2026-03-06" },
  { from: "TPE", to: "SIN", date: "2026-04-18" },
  { from: "SIN", to: "BKK", date: "2026-04-23" },
  { from: "BKK", to: "TPE", date: "2026-04-27" },
  { from: "TPE", to: "SFO", date: "2026-06-11" },
  { from: "SFO", to: "JFK", date: "2026-06-15" },
  { from: "JFK", to: "TPE", date: "2026-06-24" },
  { from: "TPE", to: "KIX", date: "2026-09-04" },
  { from: "KIX", to: "TPE", date: "2026-09-08" },
];

function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Mirrors the recipe's stats step: everything derives from the flight log. */
function computeStats(flights: readonly { from: string; to: string }[]) {
  const airports = new Set<string>();
  const countries = new Set<string>();
  let distanceKm = 0;

  for (const flight of flights) {
    const from = getAirportInfo(flight.from);
    const to = getAirportInfo(flight.to);
    if (!from || !to) continue;
    airports.add(from.code).add(to.code);
    countries.add(from.country);
    countries.add(to.country);
    distanceKm += haversineKm(
      [from.longitude, from.latitude],
      [to.longitude, to.latitude],
    );
  }

  return {
    flights: flights.length,
    airports: airports.size,
    countries: countries.size,
    distanceKm: Math.round(distanceKm),
  };
}

export function FlightHistoryMapDemo({ className }: { className?: string }) {
  const zoom = useResponsiveZoom(1.62);
  const stats = useMemo(() => computeStats(FLIGHTS), []);

  const statItems = [
    { label: "Flights", value: String(stats.flights) },
    { label: "Airports", value: String(stats.airports) },
    { label: "Countries", value: String(stats.countries) },
    { label: "Distance", value: `${stats.distanceKm.toLocaleString()} km` },
  ];

  return (
    <div
      className={cn(
        "relative h-72 min-w-0 overflow-hidden rounded-xl border border-black/8 bg-[#ececeb] sm:h-96 lg:h-[480px]",
        className,
      )}
    >
      <Map
        className="h-full w-full"
        viewport={{ center: [178, 34], zoom }}
        onViewportChange={() => {}}
        styles={mapStyles}
      >
        <FlightRoutes routes={FLIGHTS} showAirports showLabel width={1.75} />
      </Map>
      <div className="absolute right-3 bottom-3 left-3 grid grid-cols-4 divide-x divide-slate-200 rounded-xl border border-black/10 bg-white/95 shadow-sm backdrop-blur sm:right-auto sm:bottom-4 sm:left-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="min-w-0 px-2.5 py-2 text-center sm:px-4 sm:py-2.5 sm:text-left"
          >
            <p className="truncate font-mono text-xs font-semibold text-slate-950 sm:text-sm">
              {item.value}
            </p>
            <p className="mt-0.5 truncate text-[9px] tracking-[0.12em] text-slate-500 uppercase sm:text-[10px]">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

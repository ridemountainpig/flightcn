"use client";

import { useMemo, useState } from "react";

import { X } from "lucide-react";

import { Map } from "@/components/ui/map";
import { FlightNetwork, getAirportInfo } from "@/registry/flight";
import type { FlightNetworkRoute } from "@/registry/flight";
import { mapStyles } from "@/components/home/home-config";
import { useResponsiveZoom } from "@/lib/map-responsive-zoom";
import { cn } from "@/lib/utils";

/** Weekly departures per route — value drives route width and node size. */
const AIRLINE_ROUTES: readonly FlightNetworkRoute[] = [
  { from: "TPE", to: "HND", value: 21 },
  { from: "TPE", to: "NRT", value: 17 },
  { from: "TPE", to: "KIX", value: 14 },
  { from: "TPE", to: "ICN", value: 14 },
  { from: "TPE", to: "HKG", value: 18 },
  { from: "TPE", to: "SIN", value: 12 },
  { from: "TPE", to: "BKK", value: 10 },
  { from: "TPE", to: "MNL", value: 7 },
  { from: "TPE", to: "SGN", value: 6 },
  { from: "TPE", to: "SYD", value: 4 },
  { from: "TPE", to: "LAX", value: 9 },
  { from: "TPE", to: "SFO", value: 7 },
  { from: "TPE", to: "SEA", value: 4 },
  { from: "TPE", to: "YVR", value: 5 },
];

export function AirlineRouteMapDemo({ className }: { className?: string }) {
  const zoom = useResponsiveZoom(1.72);
  const [selected, setSelected] = useState<string | null>(null);

  const selectedSummary = useMemo(() => {
    if (!selected) return null;
    const info = getAirportInfo(selected);
    const connected = AIRLINE_ROUTES.filter(
      (route) => route.from === selected || route.to === selected,
    );
    const weeklyFlights = connected.reduce(
      (total, route) => total + (route.value ?? 1),
      0,
    );
    return {
      code: selected,
      city: info ? `${info.city}, ${info.country}` : "Unknown airport",
      routes: connected.length,
      weeklyFlights,
    };
  }, [selected]);

  return (
    <div
      className={cn(
        "relative h-72 min-w-0 overflow-hidden rounded-xl border border-black/8 bg-[#ececeb] sm:h-96 lg:h-[480px]",
        className,
      )}
    >
      <Map
        className="h-full w-full"
        viewport={{ center: [163, 26], zoom }}
        onViewportChange={() => {}}
        styles={mapStyles}
      >
        <FlightNetwork
          routes={AIRLINE_ROUTES}
          selectedAirport={selected}
          onAirportSelect={setSelected}
        />
      </Map>
      {selectedSummary ? (
        <div className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-xl border border-black/10 bg-white/95 px-3.5 py-2.5 shadow-sm backdrop-blur sm:bottom-4 sm:left-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs font-semibold text-slate-950">
              {selectedSummary.code}
              <span className="ml-2 font-sans font-normal text-slate-500">
                {selectedSummary.city}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Clear selected airport"
              className="pressable -mr-1 flex size-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            {selectedSummary.routes} route
            {selectedSummary.routes === 1 ? "" : "s"} ·{" "}
            {selectedSummary.weeklyFlights} weekly flights
          </p>
        </div>
      ) : (
        <p className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-black/10 bg-white/95 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-slate-600 uppercase shadow-sm backdrop-blur sm:bottom-4 sm:left-4">
          Click an airport to inspect it
        </p>
      )}
    </div>
  );
}

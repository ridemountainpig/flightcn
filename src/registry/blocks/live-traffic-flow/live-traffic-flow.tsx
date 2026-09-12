"use client";

import { Radar } from "lucide-react";
import { useEffect, useState } from "react";
import { Map } from "@/components/ui/map";
import {
  FlightFlow,
  type FlightFlowRoute,
  SingleWorldZoomLimit,
} from "@/components/ui/flight";

/** Weighted corridors between major hubs; heavier routes carry more aircraft. */
const TRAFFIC_ROUTES: readonly FlightFlowRoute[] = [
  { from: "TPE", to: "HND", value: 9 },
  { from: "TPE", to: "SIN", value: 6 },
  { from: "HND", to: "SFO", value: 7 },
  { from: "SIN", to: "SYD", value: 6 },
  { from: "SIN", to: "DXB", value: 8 },
  { from: "DXB", to: "LHR", value: 10 },
  { from: "DXB", to: "JNB", value: 4 },
  { from: "LHR", to: "JFK", value: 10 },
  { from: "CDG", to: "GRU", value: 5 },
  { from: "JFK", to: "LAX", value: 8 },
  { from: "LAX", to: "SYD", value: 4 },
  { from: "FRA", to: "ICN", value: 6 },
];

const DENSITIES = [
  { label: "Light", aircraftCount: 24 },
  { label: "Normal", aircraftCount: 48 },
  { label: "Busy", aircraftCount: 84 },
] as const;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function LiveTrafficFlow() {
  const reducedMotion = usePrefersReducedMotion();
  const [density, setDensity] = useState<(typeof DENSITIES)[number]>(
    DENSITIES[1],
  );
  const [showRoutes, setShowRoutes] = useState(true);

  return (
    <div className="relative min-h-[480px] w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* The absolute wrapper gives the map a definite height: `h-full` alone
          collapses to 0 against this min-height-driven parent. */}
      <div className="absolute inset-0">
        <Map
          theme="light"
          center={[20, 25]}
          zoom={1.2}
          scrollZoom={false}
          renderWorldCopies
          className="h-full w-full"
        >
          <SingleWorldZoomLimit />
          <FlightFlow
            key={density.label}
            routes={TRAFFIC_ROUTES}
            color="#c65d24"
            showRoutes={showRoutes}
            routeColor="#8a8f86"
            routeOpacity={0.3}
            aircraftCount={density.aircraftCount}
            animate={!reducedMotion}
          />
        </Map>
      </div>
      <div className="absolute top-4 left-4 w-56 rounded-xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
            <Radar size={13} aria-hidden="true" /> GLOBAL TRAFFIC
          </p>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <p className="text-[10px] tracking-widest text-slate-500 uppercase">
              Density
            </p>
            <div
              role="group"
              aria-label="Traffic density"
              className="mt-1.5 flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
            >
              {DENSITIES.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setDensity(option)}
                  aria-pressed={density.label === option.label}
                  className={`flex-1 rounded-md px-2 py-1 text-xs font-medium ${
                    density.label === option.label
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(event) => setShowRoutes(event.target.checked)}
              className="size-3.5 accent-orange-600"
            />
            Show route guides
          </label>
        </div>
        <p className="border-t border-slate-200 px-4 py-3 font-mono text-[10px] text-slate-500">
          {TRAFFIC_ROUTES.length} CORRIDORS · ~{density.aircraftCount} AIRCRAFT
        </p>
      </div>
    </div>
  );
}

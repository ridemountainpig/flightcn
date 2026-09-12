"use client";

import { Network } from "lucide-react";
import { useMemo, useState } from "react";
import { Map } from "@/components/ui/map";
import {
  FlightNetwork,
  getAirportInfo,
  type FlightNetworkRoute,
  SingleWorldZoomLimit,
} from "@/components/ui/flight";

const HUB = "TPE";

/** Weekly departures per destination out of the hub. */
const NETWORK_ROUTES: readonly (FlightNetworkRoute & { to: string })[] = [
  { from: HUB, to: "HND", value: 42 },
  { from: HUB, to: "NRT", value: 35 },
  { from: HUB, to: "ICN", value: 28 },
  { from: HUB, to: "HKG", value: 38 },
  { from: HUB, to: "SIN", value: 24 },
  { from: HUB, to: "BKK", value: 21 },
  { from: HUB, to: "MNL", value: 18 },
  { from: HUB, to: "KIX", value: 26 },
  { from: HUB, to: "SGN", value: 14 },
  { from: HUB, to: "LAX", value: 17 },
  { from: HUB, to: "SFO", value: 12 },
  { from: HUB, to: "SYD", value: 8 },
];

export function AirlineNetworkDashboard() {
  const [selected, setSelected] = useState<string | null>(null);

  const rankedDestinations = useMemo(
    () => [...NETWORK_ROUTES].sort((a, b) => (b.value ?? 1) - (a.value ?? 1)),
    [],
  );
  const weeklyFlights = NETWORK_ROUTES.reduce(
    (sum, route) => sum + (route.value ?? 1),
    0,
  );
  const maxValue = rankedDestinations[0]?.value ?? 1;

  return (
    <div className="grid min-h-[480px] w-full min-w-0 grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[300px_1fr]">
      <aside className="flex min-h-0 flex-col border-b border-slate-200 lg:border-r lg:border-b-0">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
            <Network size={13} aria-hidden="true" /> {HUB} NETWORK
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-px border-b border-slate-200 bg-slate-200">
          <div className="bg-white p-4">
            <dt className="text-[10px] tracking-widest text-slate-500 uppercase">
              Destinations
            </dt>
            <dd className="mt-1 font-mono text-xl text-slate-950">
              {NETWORK_ROUTES.length}
            </dd>
          </div>
          <div className="bg-white p-4">
            <dt className="text-[10px] tracking-widest text-slate-500 uppercase">
              Weekly flights
            </dt>
            <dd className="mt-1 font-mono text-xl text-slate-950">
              {weeklyFlights}
            </dd>
          </div>
        </dl>
        <ul className="max-h-56 min-h-0 flex-1 overflow-y-auto p-2 lg:max-h-none">
          {rankedDestinations.map((route) => {
            const info = getAirportInfo(route.to);
            const isActive = selected === route.to;
            return (
              <li key={route.to}>
                <button
                  type="button"
                  onClick={() => setSelected(isActive ? null : route.to)}
                  aria-pressed={isActive}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 ${
                    isActive ? "bg-orange-50 text-orange-800" : "text-slate-700"
                  }`}
                >
                  <span className="w-10 shrink-0 font-mono font-medium">
                    {route.to}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
                    {info?.city ?? route.to}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-slate-200"
                  >
                    <span
                      className={`block h-full rounded-full ${isActive ? "bg-orange-600" : "bg-slate-400"}`}
                      style={{
                        width: `${((route.value ?? 1) / maxValue) * 100}%`,
                      }}
                    />
                  </span>
                  <span className="w-7 shrink-0 text-right font-mono text-xs">
                    {route.value}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
      <div className="relative min-h-[320px]">
        <Map
          theme="light"
          center={[150, 20]}
          zoom={2}
          scrollZoom={false}
          renderWorldCopies
          className="h-full w-full"
        >
          <SingleWorldZoomLimit />
          <FlightNetwork
            routes={NETWORK_ROUTES}
            color="#8a8f86"
            highlightColor="#c65d24"
            selectedAirport={selected}
            onAirportSelect={setSelected}
          />
        </Map>
      </div>
    </div>
  );
}

"use client";

import { Gauge, Plane, PlaneTakeoff, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { Map } from "@/components/ui/map";
import {
  FlightTracker,
  getAirportInfo,
  SingleWorldZoomLimit,
} from "@/components/ui/flight";

type OpsFlight = {
  number: string;
  from: string;
  to: string;
  /** Initial progress from 0 to 1. */
  progress: number;
  /** Progress advanced per simulation tick. */
  rate: number;
  delayed?: boolean;
};

const INITIAL_FLIGHTS: readonly OpsFlight[] = [
  { number: "FC 128", from: "TPE", to: "LAX", progress: 0.42, rate: 0.0005 },
  { number: "FC 204", from: "LHR", to: "JFK", progress: 0.63, rate: 0.0007 },
  { number: "FC 317", from: "SIN", to: "SYD", progress: 0.18, rate: 0.0006 },
  {
    number: "FC 452",
    from: "DXB",
    to: "CDG",
    progress: 0.51,
    rate: 0.0007,
    delayed: true,
  },
  { number: "FC 583", from: "GRU", to: "AMS", progress: 0.77, rate: 0.0005 },
];

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

export function FlightOpsOverview() {
  const reducedMotion = usePrefersReducedMotion();
  const [flights, setFlights] = useState(INITIAL_FLIGHTS);
  const [selected, setSelected] = useState(INITIAL_FLIGHTS[0].number);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setFlights((current) =>
        current.map((flight) => ({
          ...flight,
          progress: (flight.progress + flight.rate) % 1,
        })),
      );
    }, 50);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const delayedCount = flights.filter((flight) => flight.delayed).length;
  const onTimeRate = Math.round(
    ((flights.length - delayedCount) / flights.length) * 100,
  );

  const kpis = [
    { label: "Active flights", value: String(flights.length), icon: Plane },
    { label: "On-time rate", value: `${onTimeRate}%`, icon: Timer },
    { label: "Delayed", value: String(delayedCount), icon: Gauge },
    { label: "Departures 24h", value: "38", icon: PlaneTakeoff },
  ] as const;

  return (
    <div className="flex min-h-[480px] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <dl className="grid grid-cols-2 gap-px border-b border-slate-200 bg-slate-200 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white p-4">
            <dt className="flex items-center gap-1.5 text-[10px] tracking-widest text-slate-500 uppercase">
              <kpi.icon size={12} aria-hidden="true" /> {kpi.label}
            </dt>
            <dd className="mt-1 font-mono text-xl text-slate-950">
              {kpi.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_300px]">
        <div className="relative min-h-[320px]">
          <Map
            theme="light"
            center={[20, 25]}
            zoom={1.2}
            scrollZoom={false}
            renderWorldCopies
            className="h-full w-full"
          >
            <SingleWorldZoomLimit />
            {flights.map((flight) => {
              const isActive = flight.number === selected;
              return (
                <FlightTracker
                  key={flight.number}
                  from={flight.from}
                  to={flight.to}
                  progress={flight.progress}
                  completedColor={isActive ? "#c65d24" : "#8a8f86"}
                  remainingColor="#cbd5e1"
                  width={isActive ? 3 : 2}
                  iconSize={isActive ? 26 : 18}
                  showAirports={isActive}
                  showInfo={isActive}
                >
                  <span className="font-mono text-[10px]">{flight.number}</span>
                </FlightTracker>
              );
            })}
          </Map>
        </div>
        <aside className="flex min-h-0 flex-col border-t border-slate-200 lg:border-t-0 lg:border-l">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
            <p className="font-mono text-[10px] tracking-widest text-slate-500">
              EN ROUTE
            </p>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {flights.map((flight) => {
              const isActive = flight.number === selected;
              const from = getAirportInfo(flight.from);
              const to = getAirportInfo(flight.to);
              return (
                <li key={flight.number}>
                  <button
                    type="button"
                    onClick={() => setSelected(flight.number)}
                    aria-pressed={isActive}
                    className={`w-full rounded-lg px-3 py-2.5 text-left hover:bg-slate-100 ${
                      isActive ? "bg-orange-50" : ""
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={`font-mono text-sm font-medium ${
                          isActive ? "text-orange-800" : "text-slate-950"
                        }`}
                      >
                        {flight.number}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {flight.delayed ? "DELAYED" : "ON TIME"}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {from?.city} → {to?.city}
                    </span>
                    <span
                      role="progressbar"
                      aria-label={`${flight.number} progress`}
                      aria-valuenow={Math.round(flight.progress * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="mt-2 block h-1 overflow-hidden rounded-full bg-slate-200"
                    >
                      <span
                        className={`block h-full rounded-full ${
                          isActive ? "bg-orange-600" : "bg-slate-400"
                        }`}
                        style={{ width: `${flight.progress * 100}%` }}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-slate-200 px-4 py-3 font-mono text-[10px] text-slate-500">
            {flights.length} FLIGHTS TRACKED LIVE
          </p>
        </aside>
      </div>
    </div>
  );
}

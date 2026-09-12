"use client";

import { TowerControl } from "lucide-react";
import { useState } from "react";
import { Map } from "@/components/ui/map";
import {
  FlightRoute,
  FlightRoutes,
  FlightTracker,
  getAirportInfo,
  SingleWorldZoomLimit,
} from "@/components/ui/flight";

const STATUSES = {
  Scheduled: { color: "#8a8f86", lineStyle: "dash" },
  Boarding: { color: "#d9a441", lineStyle: "dash" },
  "In Flight": { color: "#c65d24", lineStyle: "solid" },
  Landed: { color: "#48864f", lineStyle: "solid" },
  Delayed: { color: "#a63d2f", lineStyle: "dash" },
} as const;

type Status = keyof typeof STATUSES;

type BoardFlight = {
  number: string;
  from: string;
  to: string;
  departure: string;
  status: Status;
  /** Progress from 0 to 1, only meaningful while in flight. */
  progress?: number;
};

const FLIGHTS: readonly BoardFlight[] = [
  {
    number: "FC 366",
    from: "HKG",
    to: "DEL",
    departure: "07:50",
    status: "Landed",
  },
  {
    number: "FC 101",
    from: "TPE",
    to: "HND",
    departure: "08:10",
    status: "In Flight",
    progress: 0.55,
  },
  {
    number: "FC 118",
    from: "SIN",
    to: "BKK",
    departure: "08:45",
    status: "Boarding",
  },
  {
    number: "FC 128",
    from: "TPE",
    to: "LAX",
    departure: "09:20",
    status: "In Flight",
    progress: 0.32,
  },
  {
    number: "FC 204",
    from: "LHR",
    to: "JFK",
    departure: "09:40",
    status: "Delayed",
  },
  {
    number: "FC 231",
    from: "DXB",
    to: "IST",
    departure: "10:05",
    status: "Scheduled",
  },
  {
    number: "FC 317",
    from: "SIN",
    to: "SYD",
    departure: "10:30",
    status: "In Flight",
    progress: 0.78,
  },
  {
    number: "FC 342",
    from: "ICN",
    to: "SFO",
    departure: "11:15",
    status: "Scheduled",
  },
];

const FILTERS = ["All", ...Object.keys(STATUSES)] as readonly string[];

export function DeparturesBoard() {
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<string | null>("FC 128");

  const visibleFlights = FLIGHTS.filter(
    (flight) => filter === "All" || flight.status === filter,
  );
  const selectedFlight =
    visibleFlights.find((flight) => flight.number === selected) ?? null;
  const contextRoutes = visibleFlights.filter(
    (flight) => flight.number !== selectedFlight?.number,
  );

  return (
    <div className="grid min-h-[480px] w-full min-w-0 grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[360px_1fr]">
      <aside className="flex min-h-0 flex-col border-b border-slate-200 lg:border-r lg:border-b-0">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
            <TowerControl size={13} aria-hidden="true" /> DEPARTURES
          </p>
        </div>
        <div
          role="group"
          aria-label="Filter by status"
          className="flex flex-wrap gap-1.5 border-b border-slate-200 p-3"
        >
          {FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              aria-pressed={filter === status}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                filter === status
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 text-slate-600 hover:text-slate-950"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <ul
          aria-label="Departure board"
          className="max-h-64 min-h-0 flex-1 overflow-y-auto p-2 lg:max-h-none"
        >
          {visibleFlights.map((flight) => {
            const isActive = selected === flight.number;
            const to = getAirportInfo(flight.to);
            return (
              <li key={flight.number}>
                <button
                  type="button"
                  onClick={() => setSelected(isActive ? null : flight.number)}
                  aria-pressed={isActive}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 ${
                    isActive ? "bg-orange-50" : ""
                  }`}
                >
                  <span className="w-12 shrink-0 font-mono text-[11px] text-slate-500">
                    {flight.departure}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block font-mono text-sm font-medium ${
                        isActive ? "text-orange-800" : "text-slate-950"
                      }`}
                    >
                      {flight.number}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {flight.from} → {flight.to} · {to?.city}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full"
                      style={{
                        backgroundColor: STATUSES[flight.status].color,
                      }}
                    />
                    <span className="font-mono text-[10px] text-slate-500">
                      {flight.status.toUpperCase()}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {visibleFlights.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-slate-500">
              No {filter.toLowerCase()} flights right now.
            </li>
          ) : null}
        </ul>
        <p className="border-t border-slate-200 px-4 py-3 font-mono text-[10px] text-slate-500">
          {visibleFlights.length} OF {FLIGHTS.length} FLIGHTS
        </p>
      </aside>
      <div className="relative min-h-[320px]">
        <Map
          theme="light"
          center={[95, 25]}
          zoom={1.4}
          scrollZoom={false}
          renderWorldCopies
          className="h-full w-full"
        >
          <SingleWorldZoomLimit />
          <FlightRoutes
            routes={contextRoutes.map((flight) => ({
              from: flight.from,
              to: flight.to,
            }))}
            color="#94a3b8"
            width={1.5}
            opacity={0.35}
          />
          {selectedFlight ? (
            selectedFlight.status === "In Flight" ? (
              <FlightTracker
                from={selectedFlight.from}
                to={selectedFlight.to}
                progress={selectedFlight.progress ?? 0}
                completedColor="#c65d24"
                remainingColor="#94a3b8"
              >
                <span className="font-mono text-[10px]">
                  {selectedFlight.number}
                </span>
              </FlightTracker>
            ) : (
              <FlightRoute
                from={selectedFlight.from}
                to={selectedFlight.to}
                color={STATUSES[selectedFlight.status].color}
                width={2.5}
                lineStyle={STATUSES[selectedFlight.status].lineStyle}
                showAirports
              />
            )
          ) : null}
        </Map>
      </div>
    </div>
  );
}

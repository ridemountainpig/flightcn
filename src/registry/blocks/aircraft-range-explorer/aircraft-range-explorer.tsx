"use client";

import { Compass } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Map, useMap } from "@/components/ui/map";
import {
  FlightRange,
  getAirportInfo,
  SingleWorldZoomLimit,
} from "@/components/ui/flight";

const HUBS = ["TPE", "DXB", "LHR", "JFK"] as const;

type Aircraft = {
  model: string;
  /** Maximum range in kilometres. */
  rangeKm: number;
  seats: number;
};

const AIRCRAFT: readonly Aircraft[] = [
  { model: "A321XLR", rangeKm: 8700, seats: 180 },
  { model: "787-9", rangeKm: 14140, seats: 290 },
  { model: "777-300ER", rangeKm: 13650, seats: 365 },
  { model: "A350-900", rangeKm: 15372, seats: 325 },
];

/** Major destinations used for the reachability readout. */
const DESTINATIONS = [
  "HND",
  "ICN",
  "SIN",
  "SYD",
  "AKL",
  "DEL",
  "DXB",
  "IST",
  "CAI",
  "NBO",
  "JNB",
  "LHR",
  "CDG",
  "FRA",
  "AMS",
  "MAD",
  "JFK",
  "ORD",
  "ATL",
  "LAX",
  "SFO",
  "YYZ",
  "MEX",
  "GRU",
  "SCL",
] as const;

const EARTH_RADIUS_KM = 6371;
const REFERENCE_COLOR = "#0284c7";
const MAX_RANGE_COLOR = "#c65d24";
const formatKm = (distance: number) => `${distance.toLocaleString("en-US")} km`;

function greatCircleKm(from: string, to: string) {
  const a = getAirportInfo(from);
  const b = getAirportInfo(to);
  if (!a || !b) return Infinity;
  const toRadians = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * toRadians;
  const dLng = (b.longitude - a.longitude) * toRadians;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * toRadians) *
      Math.cos(b.latitude * toRadians) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function HubCamera({ hub }: { hub: string }) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    const info = getAirportInfo(hub);
    if (!info) return;
    map.flyTo({
      center: [info.longitude, info.latitude],
      zoom: 1.4,
      duration: 1200,
    });
  }, [map, isLoaded, hub]);
  return null;
}

export function AircraftRangeExplorer() {
  const [hub, setHub] = useState<string>(HUBS[0]);
  const [aircraft, setAircraft] = useState<Aircraft>(AIRCRAFT[1]);

  const hubInfo = getAirportInfo(hub);
  const referenceKm = Math.round(aircraft.rangeKm * 0.75);
  const destinations = useMemo(
    () => DESTINATIONS.filter((code) => code !== hub),
    [hub],
  );
  const reachable = useMemo(
    () =>
      destinations.filter(
        (code) => greatCircleKm(hub, code) <= aircraft.rangeKm,
      ),
    [hub, aircraft, destinations],
  );

  return (
    <div className="grid min-h-[480px] w-full min-w-0 grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[300px_1fr]">
      <aside className="flex min-h-0 flex-col border-b border-slate-200 lg:border-r lg:border-b-0">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
            <Compass size={13} aria-hidden="true" /> RANGE EXPLORER
          </p>
        </div>
        <div className="border-b border-slate-200 p-4">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase">
            Departure airport
          </p>
          <div
            role="group"
            aria-label="Hub airport"
            className="mt-1.5 flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
          >
            {HUBS.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setHub(code)}
                aria-pressed={hub === code}
                className={`pressable flex-1 rounded-md px-2 py-1.5 font-mono text-xs font-medium ${
                  hub === code
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
          <p className="mt-2 truncate text-xs text-slate-500">
            {hubInfo?.name}
          </p>
        </div>
        <ul
          aria-label="Aircraft types"
          className="min-h-0 flex-1 overflow-y-auto p-2"
        >
          {AIRCRAFT.map((option) => {
            const isActive = aircraft.model === option.model;
            return (
              <li key={option.model}>
                <button
                  type="button"
                  onClick={() => setAircraft(option)}
                  aria-pressed={isActive}
                  className={`pressable flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-100 ${
                    isActive ? "bg-orange-50" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block font-mono text-sm font-medium ${
                        isActive ? "text-orange-800" : "text-slate-950"
                      }`}
                    >
                      {option.model}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {option.seats} seats
                    </span>
                  </span>
                  <span className="shrink-0 text-right font-mono text-[10px] text-slate-500">
                    {formatKm(option.rangeKm)}
                    <span className="mt-0.5 block font-sans">Max range</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div role="status" className="border-t border-slate-200 px-4 py-4">
          <p className="text-sm font-medium text-slate-950">
            <span className="font-mono text-xl tabular-nums">
              {reachable.length}
            </span>
            <span className="text-slate-500"> / {destinations.length}</span>{" "}
            destinations in range
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Sample major airports within the orange boundary.
          </p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-sm font-medium text-slate-950">
            {aircraft.model} range from <span className="font-mono">{hub}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Both boundaries show distance from the same departure airport.
          </p>
        </div>
        <div className="relative min-h-[400px] flex-1 lg:min-h-[520px]">
          <Map
            theme="light"
            center={[hubInfo?.longitude ?? 121, hubInfo?.latitude ?? 25]}
            zoom={1.4}
            scrollZoom={false}
            renderWorldCopies
            className="absolute inset-0 h-full w-full"
          >
            <SingleWorldZoomLimit />
            <HubCamera hub={hub} />
            <FlightRange
              key={`${hub}-${aircraft.model}`}
              origin={hub}
              ranges={[
                {
                  distance: referenceKm,
                  color: REFERENCE_COLOR,
                  opacity: 0.09,
                },
                {
                  distance: aircraft.rangeKm,
                  color: MAX_RANGE_COLOR,
                  opacity: 0.06,
                },
              ]}
            />
          </Map>
        </div>
        <div className="border-t border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="relative hidden size-20 shrink-0 items-center justify-center rounded-full border-2 bg-orange-50 sm:flex"
              style={{ borderColor: MAX_RANGE_COLOR }}
            >
              <div
                className="flex size-14 items-center justify-center rounded-full border-2 bg-sky-50"
                style={{ borderColor: REFERENCE_COLOR }}
              >
                <span className="size-2 rounded-full bg-slate-950" />
              </div>
            </div>
            <dl
              aria-label="Range boundary legend"
              className="min-w-0 flex-1 space-y-3"
            >
              <div>
                <dt className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-950">
                  <span
                    aria-hidden="true"
                    className="h-0.5 w-4 shrink-0"
                    style={{ backgroundColor: REFERENCE_COLOR }}
                  />
                  75% reference
                  <span className="font-mono text-sky-700 tabular-nums">
                    {formatKm(referenceKm)}
                  </span>
                </dt>
                <dd className="mt-1 pl-6 text-xs leading-5 text-slate-500">
                  Inner boundary · three quarters of this aircraft’s maximum
                  range.
                </dd>
              </div>
              <div>
                <dt className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-950">
                  <span
                    aria-hidden="true"
                    className="h-0.5 w-4 shrink-0"
                    style={{ backgroundColor: MAX_RANGE_COLOR }}
                  />
                  Maximum range
                  <span className="font-mono text-orange-800 tabular-nums">
                    {formatKm(aircraft.rangeKm)}
                  </span>
                </dt>
                <dd className="mt-1 pl-6 text-xs leading-5 text-slate-500">
                  Outer boundary · beyond this line is outside the selected
                  range.
                </dd>
              </div>
            </dl>
          </div>
          <p className="mt-3 border-t border-slate-200 pt-3 text-[11px] leading-5 text-slate-500">
            Distances follow Earth’s surface. The 75% line is a visual
            reference, not a fuel reserve. Actual reach varies with payload,
            winds and routing.
          </p>
        </div>
      </div>
    </div>
  );
}

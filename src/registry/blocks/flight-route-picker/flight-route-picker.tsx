"use client";

import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  ArrowRight,
  LocateFixed,
  Plane,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { LngLatBounds } from "maplibre-gl";
import { Map, useMap } from "@/components/ui/map";
import {
  FlightAirport,
  FlightRoute,
  airports,
  generateArcCoordinates,
  getAirportInfo,
  resolveAirport,
  SingleWorldZoomLimit,
} from "@/components/ui/flight";

const EARTH_RADIUS_KM = 6371;
const CRUISE_SPEED_KMH = 880;
const LEG_COLORS = [
  "#b65320",
  "#2f6f8f",
  "#6d5a9c",
  "#337b60",
  "#a34468",
  "#8a6d24",
] as const;
const ALL_AIRPORTS = Object.values(airports);
const FEATURED_AIRPORTS = [
  "TPE",
  "NRT",
  "HND",
  "SIN",
  "DXB",
  "LHR",
  "JFK",
  "SFO",
  "SYD",
];
const PRESETS = [
  { name: "Across the Pacific", from: "TPE", to: "SFO", via: [] },
  { name: "A stop in Tokyo", from: "TPE", to: "SFO", via: ["NRT"] },
  { name: "Across the Atlantic", from: "LHR", to: "JFK", via: [] },
  { name: "Pacific connections", from: "TPE", to: "SFO", via: ["NRT", "HNL"] },
] as const;
type Route = { from: string; to: string; via: readonly string[] };
const formatKm = (distance: number) =>
  `${Math.round(distance).toLocaleString("en-US")} km`;
const flightMinutes = (distance: number) =>
  Math.round((distance / CRUISE_SPEED_KMH) * 60);
function formatTime(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

function greatCircleKm(from: string, to: string) {
  const a = resolveAirport(from);
  const b = resolveAirport(to);
  const radians = Math.PI / 180;
  const h =
    Math.sin(((b[1] - a[1]) * radians) / 2) ** 2 +
    Math.cos(a[1] * radians) *
      Math.cos(b[1] * radians) *
      Math.sin(((b[0] - a[0]) * radians) / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function AirportSearch({
  label,
  value,
  excluded,
  onSelect,
}: {
  label: string;
  value: string | null;
  excluded: readonly string[];
  onSelect: (code: string) => void;
}) {
  const id = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const selected = value ? getAirportInfo(value) : null;
  const term = query.trim().toLowerCase();
  const results = (
    term
      ? ALL_AIRPORTS.filter((airport) =>
          `${airport.code} ${airport.city} ${airport.name} ${airport.country}`
            .toLowerCase()
            .includes(term),
        ).sort((a, b) => {
          const rank = (airport: (typeof ALL_AIRPORTS)[number]) => {
            if (airport.code.toLowerCase() === term) return 0;
            if (airport.code.toLowerCase().startsWith(term)) return 1;
            if (airport.city.toLowerCase() === term) return 2;
            if (airport.city.toLowerCase().startsWith(term)) return 3;
            if (airport.name.toLowerCase().startsWith(term)) return 4;
            return 5;
          };
          return rank(a) - rank(b) || a.code.localeCompare(b.code);
        })
      : FEATURED_AIRPORTS.map((code) => airports[code])
  )
    .filter((airport) => !excluded.includes(airport.code))
    .slice(0, 8);

  useEffect(() => {
    if (open)
      listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function select(code: string) {
    onSelect(code);
    setOpen(false);
  }

  function openSearch() {
    if (open) return;
    setQuery("");
    setActive(0);
    setOpen(true);
  }

  return (
    <div className="relative min-w-0">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium text-slate-600"
      >
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-orange-600 focus-within:ring-1 focus-within:ring-orange-600">
        <Search
          size={14}
          aria-hidden="true"
          className="shrink-0 text-slate-400"
        />
        <input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? `${id}-results` : undefined}
          aria-activedescendant={
            open && results[active]
              ? `${id}-${results[active].code}`
              : undefined
          }
          autoComplete="off"
          spellCheck={false}
          placeholder="Search city or airport"
          value={
            open ? query : selected ? `${selected.code} · ${selected.city}` : ""
          }
          onFocus={openSearch}
          onClick={openSearch}
          onBlur={() => setOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              if (!open) {
                openSearch();
                return;
              }
              setActive((current) =>
                Math.max(
                  0,
                  Math.min(
                    results.length - 1,
                    current + (event.key === "ArrowDown" ? 1 : -1),
                  ),
                ),
              );
            }
            if (event.key === "Enter" && open) {
              event.preventDefault();
              if (results[active]) select(results[active].code);
            }
          }}
          className="w-full min-w-0 bg-transparent py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400"
        />
      </div>
      {selected && (
        <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
          {selected.name}
        </p>
      )}
      {open && (
        <div className="absolute top-full right-0 left-0 z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <ul
            ref={listRef}
            id={`${id}-results`}
            role="listbox"
            aria-label={`${label} airports`}
            className="max-h-60 overflow-y-auto p-1"
          >
            {results.map((airport, index) => (
              <li
                key={airport.code}
                id={`${id}-${airport.code}`}
                role="option"
                aria-selected={active === index}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => select(airport.code)}
                className={`cursor-pointer rounded-lg px-2.5 py-2 text-xs hover:bg-orange-50 ${active === index ? "bg-orange-50" : ""}`}
              >
                <span className="flex items-baseline justify-between gap-2 font-medium text-slate-950">
                  <span>{airport.city}</span>
                  <span className="font-mono text-orange-800">
                    {airport.code}
                  </span>
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                  {airport.name} · {airport.country}
                </span>
              </li>
            ))}
          </ul>
          {results.length === 0 && (
            <p
              role="status"
              className="px-3 py-4 text-xs leading-5 text-slate-500"
            >
              No available airports match “{query}”. Try a city, name or IATA
              code. Airports already on this route are excluded.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function RouteCamera({ from, via, to }: Route) {
  const { map, isLoaded } = useMap();
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!map || !isLoaded) return;
    const stops = [from, ...via, to];
    const bounds = new LngLatBounds();
    let previousLongitude = resolveAirport(from)[0];
    // Keep consecutive legs in the same world copy across the date line.
    for (let i = 1; i < stops.length; i++) {
      for (const [longitude, latitude] of generateArcCoordinates(
        resolveAirport(stops[i - 1]),
        resolveAirport(stops[i]),
      )) {
        const unwrapped =
          longitude + 360 * Math.round((previousLongitude - longitude) / 360);
        bounds.extend([unwrapped, latitude]);
        previousLongitude = unwrapped;
      }
    }
    if (via.length > 0) {
      const originLongitude = resolveAirport(from)[0];
      for (const [longitude, latitude] of generateArcCoordinates(
        resolveAirport(from),
        resolveAirport(to),
      )) {
        bounds.extend([
          longitude + 360 * Math.round((originLongitude - longitude) / 360),
          latitude,
        ]);
      }
    }
    const fitRoute = () => {
      map.fitBounds(bounds, {
        padding: { top: 65, bottom: 155, left: 45, right: 45 },
        maxZoom: 5,
        duration: 0,
      });
    };
    fitRoute();
    map.on("resize", fitRoute);
    return () => {
      map.off("resize", fitRoute);
    };
  }, [map, isLoaded, from, via, to, revision]);
  return (
    <button
      type="button"
      onClick={() => setRevision((value) => value + 1)}
      className="pressable absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-2 text-xs text-slate-600 shadow-sm hover:bg-slate-50"
    >
      <LocateFixed size={14} aria-hidden="true" /> Fit route
    </button>
  );
}

export function FlightRoutePicker() {
  const [route, setRoute] = useState<Route>({
    from: "TPE",
    to: "SFO",
    via: [],
  });
  const [addingStop, setAddingStop] = useState(false);
  const stops = [route.from, ...route.via, route.to];
  const legs = stops.slice(1).map((to, index) => ({
    from: stops[index],
    to,
    // Round each leg first so displayed legs, totals and differences agree.
    distance: Math.round(greatCircleKm(stops[index], to)),
    color: LEG_COLORS[index % LEG_COLORS.length],
  }));
  const directDistance = Math.round(greatCircleKm(route.from, route.to));
  const totalDistance = legs.reduce((total, leg) => total + leg.distance, 0);
  const totalMinutes = legs.reduce(
    (total, leg) => total + flightMinutes(leg.distance),
    0,
  );
  const extraDistance = Math.max(0, totalDistance - directDistance);
  const extraMinutes = Math.max(
    0,
    totalMinutes - flightMinutes(directDistance),
  );
  const detourPercent =
    directDistance > 0 ? (extraDistance / directDistance) * 100 : null;

  function moveStop(index: number, direction: -1 | 1) {
    setRoute((current) => {
      const via = [...current.via];
      const next = index + direction;
      if (next < 0 || next >= via.length) return current;
      [via[index], via[next]] = [via[next], via[index]];
      return { ...current, via };
    });
  }

  return (
    <div className="grid w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[320px_1fr]">
      <aside className="flex min-w-0 flex-col border-b border-slate-200 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
            <Plane size={13} aria-hidden="true" /> ROUTE PICKER
          </p>
          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500">
            {route.via.length > 0
              ? `${route.via.length} ${route.via.length === 1 ? "stop" : "stops"}`
              : "Direct"}
          </span>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-950">
              Build your route
            </p>
            <button
              type="button"
              aria-label="Swap departure and destination"
              title="Swap departure and destination"
              onClick={() =>
                setRoute({
                  ...route,
                  from: route.to,
                  to: route.from,
                  via: [...route.via].reverse(),
                })
              }
              className="pressable rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <ArrowDownUp size={15} aria-hidden="true" />
            </button>
          </div>
          <AirportSearch
            label="Departure"
            value={route.from}
            excluded={stops.filter((code) => code !== route.from)}
            onSelect={(from) => setRoute({ ...route, from })}
          />
          {route.via.map((code, index) => (
            <div
              key={code}
              className="relative rounded-xl border border-dashed border-sky-200 bg-sky-50/40 p-3"
            >
              <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label={`Move stopover ${index + 1} earlier`}
                  disabled={index === 0}
                  onClick={() => moveStop(index, -1)}
                  className="pressable rounded-md p-1.5 text-slate-500 hover:bg-sky-100 disabled:opacity-30"
                >
                  <ArrowUp size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move stopover ${index + 1} later`}
                  disabled={index === route.via.length - 1}
                  onClick={() => moveStop(index, 1)}
                  className="pressable rounded-md p-1.5 text-slate-500 hover:bg-sky-100 disabled:opacity-30"
                >
                  <ArrowDown size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Remove stopover ${index + 1}`}
                  onClick={() =>
                    setRoute({
                      ...route,
                      via: route.via.filter((_, i) => i !== index),
                    })
                  }
                  className="pressable rounded-md p-1.5 text-slate-500 hover:bg-sky-100"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
              <AirportSearch
                label={`Stopover ${index + 1}`}
                value={code}
                excluded={stops.filter((airport) => airport !== code)}
                onSelect={(selected) =>
                  setRoute({
                    ...route,
                    via: route.via.map((airport, i) =>
                      i === index ? selected : airport,
                    ),
                  })
                }
              />
            </div>
          ))}
          {addingStop ? (
            <div className="relative rounded-xl border border-dashed border-sky-200 bg-sky-50/40 p-3">
              <button
                type="button"
                aria-label="Cancel adding stopover"
                onClick={() => setAddingStop(false)}
                className="pressable absolute top-1 right-1 z-10 rounded-md p-2 text-slate-500 hover:bg-sky-100"
              >
                <X size={13} aria-hidden="true" />
              </button>
              <AirportSearch
                label={`Stopover ${route.via.length + 1}`}
                value={null}
                excluded={stops}
                onSelect={(code) => {
                  setRoute({ ...route, via: [...route.via, code] });
                  setAddingStop(false);
                }}
              />
              <p className="mt-2 text-[11px] leading-4 text-slate-500">
                Choose the next stop before your destination.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingStop(true)}
              className="pressable flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-xs font-medium text-slate-600 hover:border-orange-400 hover:bg-orange-50"
            >
              <Plus size={14} aria-hidden="true" />{" "}
              {route.via.length > 0 ? "Add another stop" : "Add a stop"}
            </button>
          )}
          <AirportSearch
            label="Destination"
            value={route.to}
            excluded={stops.filter((code) => code !== route.to)}
            onSelect={(to) => setRoute({ ...route, to })}
          />
          <p className="text-[11px] leading-5 text-slate-500">
            Search by city, airport name or IATA code. Your route updates as you
            select.
          </p>
        </div>
        <div className="border-t border-slate-200 p-4">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase">
            Route breakdown
          </p>
          <ol className="mt-3 space-y-4" aria-label="Flight legs">
            {legs.map((leg, index) => (
              <li key={`${leg.from}-${leg.to}`} className="flex gap-3">
                <span
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white"
                  style={{ backgroundColor: leg.color }}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-mono text-xs font-medium text-slate-950">
                    {leg.from}
                    <ArrowRight size={12} aria-hidden="true" />
                    {leg.to}
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    {getAirportInfo(leg.from)?.city} →{" "}
                    {getAirportInfo(leg.to)?.city}
                  </p>
                  <p className="mt-1.5 font-mono text-[11px] text-slate-600">
                    {formatKm(leg.distance)} ·{" "}
                    {formatTime(flightMinutes(leg.distance))} est.
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-auto border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-[11px] leading-5 text-slate-500">
          Estimated time in the air at {CRUISE_SPEED_KMH} km/h. Ground time and
          stopover waits are excluded. Routes follow great-circle distances.
        </p>
      </aside>
      <div className="flex min-w-0 flex-col">
        <div className="border-b border-slate-200 bg-slate-50/70 p-4">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase">
            Try a route
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const selected =
                route.from === preset.from &&
                route.to === preset.to &&
                route.via.length === preset.via.length &&
                route.via.every((code, index) => code === preset.via[index]);
              return (
                <button
                  key={preset.name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setRoute({
                      from: preset.from,
                      to: preset.to,
                      via: preset.via,
                    });
                    setAddingStop(false);
                  }}
                  className={`pressable rounded-lg border px-3 py-2 text-left ${selected ? "border-orange-200 bg-orange-50 text-orange-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"}`}
                >
                  <span className="block text-xs font-medium">
                    {preset.name}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] opacity-80">
                    {[preset.from, ...preset.via, preset.to].join(" → ")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div
          className="relative min-h-[460px] flex-1 lg:min-h-[560px]"
          role="region"
          aria-label={`Flight map ${stops.join(" to ")}`}
        >
          <div className="absolute inset-0">
            <Map
              theme="light"
              center={[150, 35]}
              zoom={2}
              scrollZoom={false}
              renderWorldCopies
              className="h-full w-full"
            >
              <SingleWorldZoomLimit />
              <RouteCamera {...route} />
              {route.via.length > 0 && (
                <FlightRoute
                  from={route.from}
                  to={route.to}
                  color="#64748b"
                  lineStyle="dash"
                  opacity={0.55}
                  width={2}
                  interactive={false}
                  hoverEffect={false}
                />
              )}
              {legs.map((leg) => (
                <FlightRoute
                  key={`${leg.from}-${leg.to}`}
                  from={leg.from}
                  to={leg.to}
                  color={leg.color}
                  width={3}
                  opacity={0.95}
                />
              ))}
              {stops.map((code, index) => (
                <FlightAirport
                  key={code}
                  code={code}
                  showLabel
                  markerContent={
                    <span
                      className="flex size-6 items-center justify-center rounded-full border-2 border-white font-mono text-[10px] font-medium text-white shadow-sm"
                      style={{
                        backgroundColor:
                          index === 0
                            ? "#0f172a"
                            : LEG_COLORS[(index - 1) % LEG_COLORS.length],
                      }}
                    >
                      {index + 1}
                    </span>
                  }
                />
              ))}
            </Map>
          </div>
          <div
            className="pointer-events-none absolute right-3 bottom-9 left-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur sm:left-auto sm:w-80"
            role="status"
            aria-label="Route comparison"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] tracking-wide text-slate-500 uppercase">
                  Total distance
                </p>
                <p className="mt-1 font-mono text-lg font-medium text-slate-950 tabular-nums">
                  {formatKm(totalDistance)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] tracking-wide text-slate-500 uppercase">
                  Est. time in air
                </p>
                <p className="mt-1 font-mono text-lg font-medium text-slate-950 tabular-nums">
                  {formatTime(totalMinutes)}
                </p>
              </div>
            </div>
            <p className="mt-2 border-t border-slate-200 pt-2 text-[11px] leading-5 text-slate-600">
              {route.via.length > 0 ? (
                <>
                  <span className="font-medium text-orange-800">
                    +{formatKm(extraDistance)}
                    {detourPercent !== null &&
                      ` · +${detourPercent.toFixed(1)}%`}
                  </span>{" "}
                  vs direct
                  <br />
                  About {extraMinutes} min more in the air · stopover wait
                  excluded
                </>
              ) : (
                "Direct great-circle route. Add a stop to see the extra distance."
              )}
            </p>
          </div>
        </div>
        <div
          className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 px-4 py-3 text-[11px] text-slate-600"
          aria-label="Route legend"
        >
          {legs.map((leg, index) => (
            <span key={leg.from} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-0.5 w-5"
                style={{ backgroundColor: leg.color }}
              />
              Leg {index + 1} · {leg.from} → {leg.to}
            </span>
          ))}
          {route.via.length > 0 && (
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="w-5 border-t-2 border-dashed border-slate-500"
              />
              Direct · {formatKm(directDistance)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

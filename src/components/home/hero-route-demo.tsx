"use client";

import { ArrowLeftRight, Play, Square, Plane } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useReducedMotion } from "framer-motion";
import { CopyButton } from "@/components/ui/copy-button";
import { Map, useMap } from "@/components/ui/map";
import { LngLatBounds } from "maplibre-gl";
import { FlightRoute, generateArcCoordinates } from "@/registry/flight";
import {
  getAirportInfo,
  resolveAirport,
} from "@/registry/flight-airports-utils";

function RouteCamera({
  from,
  to,
  revision,
}: {
  from: string;
  to: string;
  revision: number;
}) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    // Include the entire great-circle arc, which can extend far north of
    // both airports. Its unwrapped longitudes preserve dateline crossings.
    const bounds = new LngLatBounds();
    for (const point of generateArcCoordinates(
      resolveAirport(from),
      resolveAirport(to),
    )) {
      bounds.extend(point);
    }
    const fitRoute = () => {
      map.fitBounds(bounds, {
        padding: 70,
        maxZoom: 5,
        duration: 0,
      });
    };
    fitRoute();
    map.on("resize", fitRoute);
    return () => {
      map.off("resize", fitRoute);
    };
  }, [map, isLoaded, from, to, revision]);
  return null;
}

export function HeroRouteDemo() {
  const [from, setFrom] = useState("TPE");
  const [to, setTo] = useState("HND");
  const [route, setRoute] = useState({ from: "TPE", to: "HND", revision: 0 });
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();

  const code = `<FlightRoute from="${route.from}" to="${route.to}" color="#b65320" opacity={1} showAirports showLabel${!paused && !reducedMotion ? " animate" : ""} />`;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const origin = from.trim().toUpperCase();
    const destination = to.trim().toUpperCase();
    if (!getAirportInfo(origin) || !getAirportInfo(destination)) {
      setError("Enter valid IATA airport codes, such as TPE and HND.");
      return;
    }
    if (origin === destination) {
      setError("Choose two different airports.");
      return;
    }
    setError("");
    setFrom(origin);
    setTo(destination);
    setRoute((previous) => ({
      from: origin,
      to: destination,
      revision: previous.revision + 1,
    }));
  }

  return (
    <div
      id="try-route"
      className="w-full min-w-0 scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_12px_48px_-20px_#1d241c30]"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
          <Plane size={13} aria-hidden="true" /> ROUTE EXPLORER
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
          <span className="size-1.5 rounded-full bg-orange-600" /> INTERACTIVE
          DEMO
        </span>
      </div>
      <form
        onSubmit={submit}
        className="flex flex-wrap items-end gap-2 border-b border-slate-200 p-3 sm:p-4"
      >
        {(["From", "To"] as const).map((label) => (
          <label
            key={label}
            className={`text-xs font-medium text-slate-600 ${label === "From" ? "order-0" : "order-2"}`}
          >
            {label}
            <input
              aria-invalid={!!error}
              aria-describedby={error ? "route-error" : undefined}
              name={label.toLowerCase()}
              value={label === "From" ? from : to}
              onChange={(event) =>
                (label === "From" ? setFrom : setTo)(event.target.value)
              }
              maxLength={3}
              autoComplete="off"
              spellCheck={false}
              required
              className="mt-1 block w-20 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-base text-slate-950 uppercase sm:w-24"
            />
          </label>
        ))}
        <button
          type="button"
          aria-label="Swap airports"
          title="Swap airports"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          className="pressable order-1 mb-0.5 rounded-lg p-2.5 text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeftRight size={16} />
        </button>
        <button
          className="pressable order-3 rounded-lg bg-slate-950 px-3 py-2.5 text-sm font-medium text-white"
          type="submit"
        >
          Fly route
        </button>
        <button
          className="pressable order-4 rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700 hover:bg-slate-100"
          type="button"
          onClick={() => setPaused(!paused)}
          aria-label={paused ? "Animate route" : "Stop animation"}
          title={
            reducedMotion
              ? "Reduced motion enabled"
              : paused
                ? "Animate route"
                : "Stop animation"
          }
          aria-pressed={paused}
          disabled={!!reducedMotion}
        >
          {paused || reducedMotion ? <Play size={16} /> : <Square size={16} />}
        </button>
        {error ? (
          <p
            id="route-error"
            role="alert"
            className="fade-rise order-5 w-full text-sm text-red-600"
          >
            {error}
          </p>
        ) : null}
      </form>
      <div
        className="relative h-[300px] sm:h-[370px]"
        role="region"
        aria-label={`Flight map from ${route.from} to ${route.to}`}
      >
        <Map
          theme="light"
          center={[130, 30]}
          zoom={3}
          scrollZoom={false}
          renderWorldCopies
        >
          <RouteCamera
            from={route.from}
            to={route.to}
            revision={route.revision}
          />
          <FlightRoute
            key={route.revision}
            from={route.from}
            to={route.to}
            color="#b65320"
            opacity={1}
            showAirports
            showLabel
            animate={
              !paused && !reducedMotion
                ? {
                    duration: 8000,
                    iconClassName:
                      "drop-shadow-[0_1px_2px_rgba(15,23,42,0.85)]",
                  }
                : false
            }
          />
        </Map>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 font-mono text-[10px] text-slate-500">
        <span>
          {route.from} <span className="mx-2 text-orange-600">→</span>{" "}
          {route.to}
        </span>
        <span>GREAT-CIRCLE ROUTE</span>
      </div>
      <div className="flex items-center gap-3 border-t border-slate-200 bg-slate-950 px-4 py-3 text-xs text-orange-200">
        <code
          tabIndex={0}
          aria-label="Route example code"
          className="scrollbar-none min-w-0 flex-1 overflow-x-auto whitespace-nowrap"
        >
          {code}
        </code>
        <CopyButton text={code} className="text-slate-300 hover:bg-white/10" />
      </div>
    </div>
  );
}

"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Map } from "@/components/ui/map";
import {
  AircraftTrail,
  generateArcCoordinates,
  resolveAirport,
  type AircraftTrailPosition,
} from "@/components/ui/flight";

const FLIGHT = { number: "FC 216", from: "HND", to: "TPE" } as const;
const SAMPLE_COUNT = 80;
const CRUISE_ALTITUDE_FT = 38000;
const CLIMB_FRACTION = 0.18;
const DESCENT_FRACTION = 0.24;

const ALTITUDE_COLOR_STOPS = [
  { altitude: 0, color: "#c65d24" },
  { altitude: 18000, color: "#d9a441" },
  { altitude: CRUISE_ALTITUDE_FT, color: "#2f6f8f" },
] as const;

/** Recorded demo track: the great-circle path with a climb/cruise/descent profile. */
function buildRecordedTrack(): AircraftTrailPosition[] {
  const path = generateArcCoordinates(
    resolveAirport(FLIGHT.from),
    resolveAirport(FLIGHT.to),
    SAMPLE_COUNT,
  );
  return path.map(([longitude, latitude], index) => {
    const t = index / (path.length - 1);
    let factor = 1;
    if (t < CLIMB_FRACTION) factor = t / CLIMB_FRACTION;
    else if (t > 1 - DESCENT_FRACTION) factor = (1 - t) / DESCENT_FRACTION;
    return {
      longitude,
      latitude,
      altitude: Math.round((CRUISE_ALTITUDE_FT * factor) / 100) * 100,
    };
  });
}

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

export function AircraftTrailReplay() {
  const reducedMotion = usePrefersReducedMotion();
  const track = useMemo(() => buildRecordedTrack(), []);
  const [index, setIndex] = useState(Math.floor(track.length * 0.55));
  const [playing, setPlaying] = useState(true);

  const atEnd = index >= track.length;

  useEffect(() => {
    if (!playing || reducedMotion || atEnd) return;
    const timer = window.setInterval(() => {
      setIndex((value) => Math.min(track.length, value + 1));
    }, 220);
    return () => window.clearInterval(timer);
  }, [playing, reducedMotion, atEnd, track.length]);

  const visible = track.slice(0, Math.max(2, index));
  // Reuse the recorded route so the aircraft follows the exact dashed path.
  // Include the current point and anchor the dash phase at the destination.
  const remaining = atEnd ? [] : track.slice(visible.length - 1).reverse();
  const current = visible[visible.length - 1];
  const progressPercent = Math.round((index / track.length) * 100);

  return (
    <div className="flex min-h-[480px] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-slate-200 bg-slate-50 px-5 py-3">
        <span className="font-mono text-[10px] tracking-widest text-slate-500">
          TRAIL REPLAY · {FLIGHT.number} · {FLIGHT.from} → {FLIGHT.to}
        </span>
        <span className="font-mono text-[10px] text-slate-500">
          ALT {current?.altitude?.toLocaleString() ?? 0} FT · {progressPercent}%
        </span>
      </div>
      <div className="relative min-h-[320px] flex-1">
        {/* The absolute wrapper gives the map a definite height: `h-full` alone
            collapses to 0 against this min-height flex-1 parent. */}
        <div className="absolute inset-0">
          <Map
            theme="light"
            center={[130, 28]}
            zoom={3.4}
            scrollZoom={false}
            className="h-full w-full"
          >
            <AircraftTrail
              positions={visible}
              plannedPositions={remaining}
              altitudeColorStops={ALTITUDE_COLOR_STOPS}
              showAircraft={!atEnd}
              width={3}
            />
          </Map>
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 backdrop-blur">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase">
            Altitude
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-1.5 w-24 rounded-full"
              style={{
                background: `linear-gradient(to right, ${ALTITUDE_COLOR_STOPS.map(
                  (stop) => stop.color,
                ).join(", ")})`,
              }}
            />
          </div>
          <div className="mt-0.5 flex w-24 justify-between font-mono text-[9px] text-slate-500">
            <span>0</span>
            <span>{(CRUISE_ALTITUDE_FT / 1000).toFixed(0)}k ft</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={() => {
            if (atEnd) {
              setIndex(2);
              setPlaying(true);
              return;
            }
            setPlaying(!playing);
          }}
          aria-label={
            atEnd ? "Replay track" : playing ? "Pause replay" : "Play replay"
          }
          disabled={reducedMotion}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-40"
        >
          {atEnd ? (
            <RotateCcw size={14} />
          ) : playing && !reducedMotion ? (
            <Pause size={14} />
          ) : (
            <Play size={14} />
          )}
        </button>
        <input
          type="range"
          aria-label="Scrub recorded track"
          min={2}
          max={track.length}
          value={index}
          onChange={(event) => {
            setPlaying(false);
            setIndex(Number(event.target.value));
          }}
          className="w-full accent-orange-600"
        />
        <span className="w-12 shrink-0 text-right font-mono text-xs text-slate-500">
          {progressPercent}%
        </span>
      </div>
    </div>
  );
}

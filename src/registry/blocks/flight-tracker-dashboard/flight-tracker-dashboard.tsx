"use client";

import { Pause, Play, PlaneTakeoff, PlaneLanding } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Map } from "@/components/ui/map";
import {
  FlightTracker,
  getAirportInfo,
  SingleWorldZoomLimit,
} from "@/components/ui/flight";

const FLIGHT = {
  number: "FC 128",
  from: "TPE",
  to: "LAX",
  aircraft: "777-300ER",
} as const;

const EARTH_RADIUS_KM = 6371;
const CRUISE_SPEED_KMH = 880;
const CRUISE_ALTITUDE_FT = 36000;
const SIMULATION_STEP = 0.0006;

function greatCircleKm(from: string, to: string) {
  const a = getAirportInfo(from);
  const b = getAirportInfo(to);
  if (!a || !b) return 0;
  const toRadians = Math.PI / 180;
  const latA = a.latitude * toRadians;
  const latB = b.latitude * toRadians;
  const dLat = (b.latitude - a.latitude) * toRadians;
  const dLng = (b.longitude - a.longitude) * toRadians;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latA) * Math.cos(latB) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Ramp altitude/speed near the endpoints so the readouts feel like a flight. */
function flightPhaseFactor(progress: number) {
  const ramp = 0.08;
  if (progress < ramp) return progress / ramp;
  if (progress > 1 - ramp) return (1 - progress) / ramp;
  return 1;
}

function formatDuration(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  return `${Math.floor(safe / 60)}h ${String(safe % 60).padStart(2, "0")}m`;
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

export function FlightTrackerDashboard() {
  const reducedMotion = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0.42);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    const timer = window.setInterval(() => {
      setProgress((value) => (value + SIMULATION_STEP) % 1);
    }, 50);
    return () => window.clearInterval(timer);
  }, [playing, reducedMotion]);

  const origin = getAirportInfo(FLIGHT.from);
  const destination = getAirportInfo(FLIGHT.to);
  const distanceKm = useMemo(() => greatCircleKm(FLIGHT.from, FLIGHT.to), []);
  const totalMinutes = (distanceKm / CRUISE_SPEED_KMH) * 60;
  const phase = flightPhaseFactor(progress);
  const altitude = Math.round((CRUISE_ALTITUDE_FT * phase) / 100) * 100;
  const speed = Math.round(CRUISE_SPEED_KMH * (0.35 + 0.65 * phase));
  const remainingKm = Math.round(distanceKm * (1 - progress));

  return (
    <div className="grid min-h-[480px] w-full min-w-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[300px_1fr]">
      <aside className="flex flex-col border-b border-slate-200 lg:border-r lg:border-b-0">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <p className="font-mono text-[10px] tracking-widest text-slate-500">
            LIVE FLIGHT
          </p>
          <p className="mt-1 font-mono text-xl font-medium text-slate-950">
            {FLIGHT.number}
          </p>
        </div>
        <div className="flex-1 space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-2xl font-medium text-slate-950">
                {FLIGHT.from}
              </p>
              <p className="text-xs text-slate-500">{origin?.city}</p>
            </div>
            <PlaneTakeoff
              size={16}
              className="shrink-0 text-slate-400"
              aria-hidden="true"
            />
            <div className="text-right">
              <p className="font-mono text-2xl font-medium text-slate-950">
                {FLIGHT.to}
              </p>
              <p className="text-xs text-slate-500">{destination?.city}</p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Progress</span>
              <span className="font-mono">{Math.round(progress * 100)}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Flight progress"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200"
            >
              <div
                className="h-full rounded-full bg-orange-600"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <dt className="text-[10px] tracking-widest text-slate-500 uppercase">
                Altitude
              </dt>
              <dd className="mt-1 font-mono text-slate-950">
                {altitude.toLocaleString()} ft
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <dt className="text-[10px] tracking-widest text-slate-500 uppercase">
                Speed
              </dt>
              <dd className="mt-1 font-mono text-slate-950">{speed} km/h</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <dt className="text-[10px] tracking-widest text-slate-500 uppercase">
                Remaining
              </dt>
              <dd className="mt-1 font-mono text-slate-950">
                {remainingKm.toLocaleString()} km
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <dt className="text-[10px] tracking-widest text-slate-500 uppercase">
                Time left
              </dt>
              <dd className="mt-1 font-mono text-slate-950">
                <span className="flex items-center gap-1.5">
                  <PlaneLanding size={13} aria-hidden="true" />
                  {formatDuration(totalMinutes * (1 - progress))}
                </span>
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            aria-pressed={playing}
            aria-label={playing ? "Pause simulation" : "Play simulation"}
            disabled={reducedMotion}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-40"
          >
            {playing && !reducedMotion ? (
              <Pause size={14} />
            ) : (
              <Play size={14} />
            )}
          </button>
          <input
            type="range"
            aria-label="Scrub flight progress"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            onChange={(event) => {
              setPlaying(false);
              setProgress(Number(event.target.value) / 1000);
            }}
            className="w-full accent-orange-600"
          />
        </div>
      </aside>
      <div className="relative min-h-[320px]">
        <Map
          theme="light"
          center={[178, 42]}
          zoom={2}
          scrollZoom={false}
          renderWorldCopies
          className="h-full w-full"
        >
          <SingleWorldZoomLimit />
          <FlightTracker
            from={FLIGHT.from}
            to={FLIGHT.to}
            progress={progress}
            completedColor="#c65d24"
            remainingColor="#94a3b8"
            altitude={altitude}
            // The tracker's built-in info card displays speed in knots.
            speed={Math.round(speed * 0.54)}
          >
            <span className="font-mono text-[10px]">{FLIGHT.number}</span>
          </FlightTracker>
        </Map>
      </div>
    </div>
  );
}

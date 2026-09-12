"use client";

import { Satellite } from "lucide-react";
import { useEffect, useState } from "react";
import { Map } from "@/components/ui/map";
import {
  SatelliteOrbits,
  type SatelliteOrbitData,
} from "@/components/ui/satellite-orbit";

type TrackedSatellite = SatelliteOrbitData & {
  name: string;
  orbitColor: string;
  altitudeKm: number;
  periodMinutes: number;
};

const SATELLITES: readonly TrackedSatellite[] = [
  {
    name: "ISS",
    inclination: 51.6,
    ascendingNode: 0,
    orbitColor: "#c65d24",
    orbitGlowColor: "rgba(198, 93, 36, 0.14)",
    altitudeKm: 420,
    periodMinutes: 93,
  },
  {
    name: "Hubble",
    inclination: 28.5,
    ascendingNode: 80,
    orbitColor: "#1f7a9e",
    orbitGlowColor: "rgba(31, 122, 158, 0.14)",
    altitudeKm: 540,
    periodMinutes: 95,
  },
  {
    name: "NOAA-20",
    inclination: 98.7,
    ascendingNode: 140,
    orbitColor: "#48864f",
    orbitGlowColor: "rgba(72, 134, 79, 0.14)",
    altitudeKm: 825,
    periodMinutes: 101,
  },
  {
    name: "GPS IIF-12",
    inclination: 55,
    ascendingNode: 220,
    orbitColor: "#8455a8",
    orbitGlowColor: "rgba(132, 85, 168, 0.14)",
    altitudeKm: 20180,
    periodMinutes: 718,
  },
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

export function SatelliteOrbitTracker() {
  const reducedMotion = usePrefersReducedMotion();
  const [visibleNames, setVisibleNames] = useState<readonly string[]>(
    SATELLITES.map((satellite) => satellite.name),
  );

  const visibleOrbits = SATELLITES.filter((satellite) =>
    visibleNames.includes(satellite.name),
  );

  function toggle(name: string) {
    setVisibleNames((names) =>
      names.includes(name)
        ? names.filter((existing) => existing !== name)
        : [...names, name],
    );
  }

  return (
    <div className="grid min-h-[480px] w-full min-w-0 grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[300px_1fr]">
      <aside className="flex min-h-0 flex-col border-b border-slate-200 lg:border-r lg:border-b-0">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
            <Satellite size={13} aria-hidden="true" /> ORBIT TRACKER
          </p>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {SATELLITES.map((satellite) => {
            const visible = visibleNames.includes(satellite.name);
            return (
              <li key={satellite.name}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => toggle(satellite.name)}
                    className="size-3.5 accent-orange-600"
                  />
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: visible
                        ? satellite.orbitColor
                        : "#cbd5e1",
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-950">
                      {satellite.name}
                    </span>
                    <span className="block font-mono text-[10px] text-slate-500">
                      INC {satellite.inclination}° · RAAN{" "}
                      {satellite.ascendingNode}°
                    </span>
                  </span>
                  <span className="shrink-0 text-right font-mono text-[10px] text-slate-500">
                    {satellite.altitudeKm.toLocaleString()} km
                    <br />
                    {satellite.periodMinutes} min
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-slate-200 px-4 py-3 font-mono text-[10px] text-slate-500">
          {visibleOrbits.length} OF {SATELLITES.length} ORBITS SHOWN
        </p>
      </aside>
      <div className="relative min-h-[320px]">
        <Map
          theme="light"
          center={[121, 15]}
          zoom={1.4}
          projection={{ type: "globe" }}
          scrollZoom={false}
          className="h-full w-full"
        >
          <SatelliteOrbits
            orbits={visibleOrbits}
            showLabel
            animate={!reducedMotion ? { duration: 24000 } : false}
          />
        </Map>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Orbit, Play, Square } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { CopyButton } from "@/components/ui/copy-button";
import { Map } from "@/components/ui/map";
import { SatelliteOrbit } from "@/registry/satellite-orbit";

export function HeroSatelliteDemo() {
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const code = `<SatelliteOrbit inclination={51.6} ascendingNode={-28} name="ISS" showLabel${!paused && !reducedMotion ? " animate" : ""} />`;
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_12px_48px_-20px_#1d241c30]">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
          <Orbit size={13} aria-hidden="true" /> ORBIT EXPLORER
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
          <span className="size-1.5 rounded-full bg-orange-600" /> INTERACTIVE
          DEMO
        </span>
      </div>
      <div
        className="relative h-[374px] sm:h-[444px]"
        role="region"
        aria-label="Satellite orbit preview"
      >
        <Map
          theme="light"
          projection={{ type: "globe" }}
          center={[8, 16]}
          zoom={0.8}
          scrollZoom={false}
        >
          <SatelliteOrbit
            inclination={51.6}
            ascendingNode={-28}
            name="ISS"
            orbitColor="#b65320"
            orbitWidth={1.6}
            showGlow={false}
            groundTrackColor="#8b9588"
            groundTrackWidth={0.8}
            satelliteConnectorColor="#667160"
            showLabel
            animate={!paused && !reducedMotion ? { duration: 12000 } : false}
          />
        </Map>
        <button
          type="button"
          disabled={!!reducedMotion}
          aria-pressed={paused}
          onClick={() => setPaused((previous) => !previous)}
          className="pressable absolute top-3 right-3 flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
        >
          {paused || reducedMotion ? <Play size={13} /> : <Square size={13} />}
          {reducedMotion
            ? "Reduced motion"
            : paused
              ? "Play animation"
              : "Stop animation"}
        </button>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 font-mono text-[10px] text-slate-500">
        <span>
          ISS <span className="mx-2 text-orange-600">·</span> 51.6° INCLINATION
        </span>
        <span>LOW EARTH ORBIT</span>
      </div>
      <div className="flex items-center gap-3 border-t border-slate-200 bg-slate-950 px-4 py-3 text-xs text-orange-200">
        <code
          tabIndex={0}
          aria-label="Satellite example code"
          className="scrollbar-none min-w-0 flex-1 overflow-x-auto whitespace-nowrap"
        >
          {code}
        </code>
        <CopyButton text={code} className="text-slate-300 hover:bg-white/10" />
      </div>
    </div>
  );
}

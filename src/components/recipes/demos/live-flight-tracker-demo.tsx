"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "framer-motion";

import { Map } from "@/components/ui/map";
import { FlightTracker } from "@/registry/flight";
import { mapStyles } from "@/components/home/home-config";
import { useResponsiveZoom } from "@/lib/map-responsive-zoom";
import { cn } from "@/lib/utils";

/**
 * Simulated live feed for the recipe demo: advances progress the way a
 * polled flight API would, with small altitude/speed drift. The published
 * recipe swaps this for a real data source (see useLiveFlight in the recipe).
 */
function useSimulatedFeed(paused: boolean) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setTick((value) => value + 1), 800);
    return () => clearInterval(timer);
  }, [paused]);

  // Loop the crossing between 4% and 96% so the aircraft never sits on an
  // airport marker; each tick is one simulated poll.
  const progress = 0.04 + ((tick * 0.02) % 0.92);
  const altitude = Math.round(36000 + Math.sin(tick / 3) * 800);
  const speed = Math.round(905 + Math.cos(tick / 4) * 18);

  return { progress, altitude, speed };
}

export function LiveFlightTrackerDemo({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();
  const zoom = useResponsiveZoom(3.05);
  const feed = useSimulatedFeed(!!reducedMotion);

  return (
    <div
      className={cn(
        "relative h-72 min-w-0 overflow-hidden rounded-xl border border-black/8 bg-[#ececeb] sm:h-96 lg:h-[480px]",
        className,
      )}
    >
      <Map
        className="h-full w-full"
        viewport={{ center: [131.2, 30.9], zoom }}
        onViewportChange={() => {}}
        styles={mapStyles}
      >
        <FlightTracker
          from="TPE"
          to="NRT"
          progress={reducedMotion ? 0.63 : feed.progress}
          altitude={feed.altitude}
          speed={feed.speed}
        />
      </Map>
      <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-full border border-black/10 bg-white/95 py-1.5 pr-3 pl-2.5 shadow-sm backdrop-blur">
        <span className="relative flex size-2">
          {!reducedMotion && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-600 opacity-60" />
          )}
          <span className="relative inline-flex size-2 rounded-full bg-orange-600" />
        </span>
        <span className="font-mono text-[10px] font-medium tracking-[0.15em] text-slate-700 uppercase">
          Live · simulated feed
        </span>
      </div>
    </div>
  );
}

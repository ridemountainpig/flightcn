"use client";

import { useState } from "react";
import { useReducedMotion } from "framer-motion";

import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Map } from "@/components/ui/map";
import {
  buildSatelliteOrbitProps,
  DEFAULT_SATELLITE_ORBIT_PLAYGROUND,
  SatelliteOrbitControls,
  type SatelliteOrbitPlayground,
} from "@/components/satellite/satellite-orbit-playground-controls";
import { SatelliteOrbit } from "@/registry/satellite-orbit";

export function SatelliteDemoPage() {
  const [playground, setPlayground] = useState<SatelliteOrbitPlayground>(
    DEFAULT_SATELLITE_ORBIT_PLAYGROUND,
  );

  const reducedMotion = useReducedMotion();

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#fafaf8]">
      <div className="site-shell flex flex-col gap-4">
        <AppHeader
          title="Satellite playground"
          subtitle="Explore orbital visualizations"
        />
        <div id="page-content" tabIndex={-1} className="py-6">
          <p className="section-kicker mb-4">Orbital playground</p>
          <h1 className="section-title text-slate-950">Satellite playground</h1>
          <p className="mt-4 text-sm text-slate-600">
            Adjust the controls to preview different configurations.
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <Map
            className="h-[70vh] min-h-[420px] overflow-hidden rounded-xl border border-slate-200 lg:flex-1"
            projection={{ type: "globe" }}
            center={[8, 16]}
            zoom={1.05}
          >
            <SatelliteOrbit
              {...buildSatelliteOrbitProps({
                ...playground,
                animate: playground.animate && !reducedMotion,
              })}
            />
          </Map>

          <SatelliteOrbitControls value={playground} onChange={setPlayground} />
        </div>
        <AppFooter />
      </div>
    </main>
  );
}

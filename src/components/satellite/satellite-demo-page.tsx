"use client";

import { useState } from "react";

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

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Satellite Demo
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Adjust the controls to preview different configurations.
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <Map
            className="h-[70vh] min-h-[420px] overflow-hidden rounded-[1.5rem] border border-black/10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:flex-1"
            projection={{ type: "globe" }}
            center={[8, 16]}
            zoom={1.05}
          >
            <SatelliteOrbit {...buildSatelliteOrbitProps(playground)} />
          </Map>

          <SatelliteOrbitControls value={playground} onChange={setPlayground} />
        </div>
      </div>
    </main>
  );
}

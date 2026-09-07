"use client";

import { useCallback, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { AppHeader } from "@/components/app-header";
import { AirportSearchPanel } from "./airport-search-panel";
import { CopyableAirportMarker } from "./copyable-airport-marker";
import { allAirports, mapStyles } from "@/components/home/home-config";
import { Map, MapControls, type MapRef } from "@/components/ui/map";
import { FlightAirport } from "@/registry/flight";
import type { AirportInfo } from "@/registry/flight-airports";

export function AirportsMapView() {
  const mapRef = useRef<MapRef>(null);
  const [zoom, setZoom] = useState(2);
  const [selected, setSelected] = useState<AirportInfo | null>(null);
  const reducedMotion = useReducedMotion();
  const handleViewportChange = useCallback((viewport: { zoom: number }) => {
    setZoom((previous) =>
      Math.abs(previous - viewport.zoom) < 0.01 ? previous : viewport.zoom,
    );
  }, []);
  function selectAirport(airport: AirportInfo) {
    setSelected(airport);
    mapRef.current?.flyTo({
      center: [airport.longitude, airport.latitude],
      zoom: 8,
      duration:
        reducedMotion || document.documentElement.dataset.input === "keyboard"
          ? 0
          : 900,
    });
  }
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-dvh bg-[#fafaf8] text-slate-950"
    >
      <div className="site-shell">
        <AppHeader title="Airports" subtitle="Explore the airport directory" />
        <section
          id="page-content"
          tabIndex={-1}
          className="flex flex-wrap items-end justify-between gap-4 py-7 sm:py-9"
        >
          <div>
            <p className="section-kicker mb-3">Every route starts somewhere</p>
            <h1 className="section-title">Search airports by IATA code.</h1>
            <p className="mt-3 text-sm text-slate-500">
              Look up any airport in the flightcn registry by IATA code, city,
              country, or name. Preview its location on the map and copy the
              code into your next flight route.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500">
            {allAirports.length.toLocaleString()} AIRPORTS
          </span>
        </section>
        <div className="grid gap-4 lg:h-[calc(100dvh-290px)] lg:min-h-[480px] lg:grid-cols-[320px_minmax(0,1fr)]">
          <AirportSearchPanel selected={selected} onSelect={selectAirport} />
          <div
            className="relative h-[55dvh] min-h-[380px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 lg:h-full"
            role="region"
            aria-label="Airport explorer map"
          >
            <Map
              ref={mapRef}
              className="h-full w-full"
              center={[0, 20]}
              zoom={2}
              styles={mapStyles}
              theme="light"
              onViewportChange={handleViewportChange}
            >
              <MapControls />
              {allAirports.map((airport) => (
                <FlightAirport
                  key={airport.code}
                  code={airport.code}
                  showLabel={zoom >= 4 || selected?.code === airport.code}
                  labelPosition="bottom"
                  markerContent={<CopyableAirportMarker airport={airport} />}
                />
              ))}
            </Map>
            {selected ? (
              <div
                className="fade-rise absolute top-3 left-3 max-w-[calc(100%-5rem)] rounded-lg border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur"
                role="status"
              >
                <p className="font-mono text-xs font-semibold text-orange-700">
                  {selected.code} · {selected.city}
                </p>
                <p className="mt-1 text-sm font-medium">{selected.name}</p>
                <p className="mt-2 font-mono text-[10px] text-slate-500">
                  {selected.latitude.toFixed(4)},{" "}
                  {selected.longitude.toFixed(4)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

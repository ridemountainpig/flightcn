"use client";

import { useCallback, useState } from "react";

import { AppHeader } from "@/components/app-header";
import { AirportSearchPanel } from "@/components/airports/airport-search-panel";
import { CopyableAirportMarker } from "@/components/airports/copyable-airport-marker";
import { allAirports, mapStyles } from "@/components/home/home-config";
import { Map } from "@/components/ui/map";
import { FlightAirport } from "@/registry/flight";

const LABEL_ZOOM_THRESHOLD = 4;

export function AirportsMapView() {
  const [zoom, setZoom] = useState(2);
  const showLabels = zoom >= LABEL_ZOOM_THRESHOLD;

  const handleViewportChange = useCallback((viewport: { zoom: number }) => {
    setZoom((currentZoom) =>
      Math.abs(currentZoom - viewport.zoom) < 0.01
        ? currentZoom
        : viewport.zoom,
    );
  }, []);

  return (
    <main className="relative h-screen w-screen">
      <Map
        className="h-full w-full"
        center={[0, 20]}
        zoom={2}
        styles={mapStyles}
        attributionControl={false}
        onViewportChange={handleViewportChange}
      >
        <div className="pointer-events-none absolute top-4 right-4 left-4">
          <AppHeader
            title="Airports"
            subtitle="Search airports and jump directly on the map"
            className="pointer-events-auto"
          />
        </div>

        <AirportSearchPanel />

        {allAirports.map((airport) => (
          <FlightAirport
            key={airport.code}
            code={airport.code}
            showLabel={showLabels}
            labelPosition="bottom"
            markerContent={<CopyableAirportMarker airport={airport} />}
          />
        ))}
      </Map>
    </main>
  );
}

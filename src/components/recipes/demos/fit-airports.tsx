"use client";

import { useEffect } from "react";

import { LngLatBounds, type PaddingOptions } from "maplibre-gl";

import { useMap } from "@/components/ui/map";
import { resolveAirport, type AirportRef } from "@/registry/flight";

/**
 * Frames a set of airports on load and on every resize, so a demo shows its
 * whole network at any container size instead of relying on a fixed zoom.
 * Longitudes are unwrapped around the first airport, keeping a transpacific
 * network in one continuous view across the date line. Pass stable (module
 * level) `airports` and `padding` values so the effect does not refit on
 * every render.
 */
export function FitAirports({
  airports,
  padding,
  // MapLibre copies an explicit `undefined` over its own default and the
  // camera math turns NaN, so this always passes a number.
  maxZoom = 5,
}: {
  airports: readonly AirportRef[];
  padding: PaddingOptions;
  maxZoom?: number;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || airports.length === 0) return;
    const anchorLongitude = resolveAirport(airports[0])[0];
    const bounds = new LngLatBounds();
    for (const airport of airports) {
      const [longitude, latitude] = resolveAirport(airport);
      bounds.extend([
        longitude + 360 * Math.round((anchorLongitude - longitude) / 360),
        latitude,
      ]);
    }
    const fit = () => {
      map.fitBounds(bounds, { padding, maxZoom, duration: 0 });
    };
    fit();
    map.on("resize", fit);
    return () => {
      map.off("resize", fit);
    };
  }, [map, isLoaded, airports, padding, maxZoom]);

  return null;
}

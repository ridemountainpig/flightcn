"use client";

import { useEffect } from "react";

import { LngLatBounds, type PaddingOptions } from "maplibre-gl";

import { useMap } from "@/components/ui/map";
import {
  generateArcCoordinates,
  resolveAirport,
  type AirportRef,
} from "@/registry/flight";

/**
 * Frames every great-circle arc on load and on every resize, so a demo shows
 * its whole network at any container size instead of relying on a fixed
 * zoom. Bounds follow the arcs rather than the airports, so a polar route
 * like JFK→TPE stays in frame. Longitudes are unwrapped around the first
 * origin, keeping a transpacific network in one continuous view across the
 * date line. Pass stable (module level) `routes` and `padding` values so the
 * effect does not refit on every render.
 */
export function FitRoutes({
  routes,
  padding,
  // MapLibre copies an explicit `undefined` over its own default and the
  // camera math turns NaN, so this always passes a number.
  maxZoom = 5,
}: {
  routes: readonly { from: AirportRef; to: AirportRef }[];
  padding: PaddingOptions;
  maxZoom?: number;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || routes.length === 0) return;
    const anchorLongitude = resolveAirport(routes[0].from)[0];
    const bounds = new LngLatBounds();
    for (const route of routes) {
      for (const [longitude, latitude] of generateArcCoordinates(
        resolveAirport(route.from),
        resolveAirport(route.to),
      )) {
        bounds.extend([
          longitude + 360 * Math.round((anchorLongitude - longitude) / 360),
          latitude,
        ]);
      }
    }
    const fit = () => {
      map.fitBounds(bounds, { padding, maxZoom, duration: 0 });
    };
    fit();
    map.on("resize", fit);
    return () => {
      map.off("resize", fit);
    };
  }, [map, isLoaded, routes, padding, maxZoom]);

  return null;
}

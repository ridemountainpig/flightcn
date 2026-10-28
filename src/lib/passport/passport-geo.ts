import {
  geoNaturalEarth1,
  geoPath,
  type GeoPermissibleObjects,
  type GeoProjection,
} from "d3-geo";

import type { AirportInfo } from "@/registry/flight-airports";
import {
  aggregateRoutes,
  type ResolvedFlight,
  type RouteSummary,
} from "@/registry/blocks/flight-passport/flight-passport-stats";

/**
 * Map geometry for the passport share images. The server draws the images
 * with it and the browser draws the passport video with it, so the video's
 * routes land exactly on the image's map.
 */

/** Portrait passport page, sized for feeds (4:5). */
export const CARD_SIZE = { width: 1080, height: 1350 };
/** Where the map sits on the passport page. */
export const CARD_MAP_BOX = { x: 40, y: 112, width: 1000, height: 500 };
/** Route and airport styling shared by the images and the video. */
export const MAP_STYLE = {
  routeOpacity: 0.92,
  dotFill: "#221d12",
  dotStroke: "#ffffff",
  dotStrokeWidth: 2.5,
} as const;

export const MAX_ROUTES = 200;
export const DEG = Math.PI / 180;

export type LngLat = [number, number];
export type Box = { x: number; y: number; width: number; height: number };
export type RankedAirport = { airport: AirportInfo; visits: number };

export function rankAirports(
  flights: readonly ResolvedFlight[],
): RankedAirport[] {
  const visits = new Map<string, RankedAirport>();
  for (const flight of flights) {
    for (const airport of [flight.from, flight.to]) {
      const entry = visits.get(airport.code);
      if (entry) entry.visits += 1;
      else visits.set(airport.code, { airport, visits: 1 });
    }
  }
  // Ties stay in first-seen order, matching the home airport in the stats.
  return [...visits.values()].sort((a, b) => b.visits - a.visits);
}

export function lngLat(airport: AirportInfo): LngLat {
  return [airport.longitude, airport.latitude];
}

/** Mean direction of the airports; the busiest one when they cancel out. */
export function centroid(ranked: readonly RankedAirport[]): LngLat {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const { airport } of ranked) {
    const phi = airport.latitude * DEG;
    const lambda = airport.longitude * DEG;
    x += Math.cos(phi) * Math.cos(lambda);
    y += Math.cos(phi) * Math.sin(lambda);
    z += Math.sin(phi);
  }
  if (Math.hypot(x, y, z) / Math.max(1, ranked.length) < 0.1) {
    return ranked[0] ? lngLat(ranked[0].airport) : [0, 0];
  }
  return [Math.atan2(y, x) / DEG, Math.atan2(z, Math.hypot(x, y)) / DEG];
}

/** Middle of the smallest longitude span that covers every airport. */
function centralMeridian(ranked: readonly RankedAirport[]) {
  const normalize = (value: number) =>
    ((((value + 180) % 360) + 360) % 360) - 180;
  const sorted = [
    ...new Set(ranked.map(({ airport }) => normalize(airport.longitude))),
  ].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  let gapIndex = sorted.length - 1;
  let gap = sorted[0] + 360 - sorted[sorted.length - 1];
  for (let index = 0; index < sorted.length - 1; index += 1) {
    if (sorted[index + 1] - sorted[index] > gap) {
      gap = sorted[index + 1] - sorted[index];
      gapIndex = index;
    }
  }
  const west = sorted[(gapIndex + 1) % sorted.length];
  let east = sorted[gapIndex];
  if (east < west) east += 360;
  return normalize((west + east) / 2);
}

export function routeGeometry(
  a: AirportInfo,
  b: AirportInfo,
): GeoPermissibleObjects {
  return { type: "LineString", coordinates: [lngLat(a), lngLat(b)] };
}

/** The busiest routes, quietest first so busy ones draw on top. */
export function routeWidths(
  flights: readonly ResolvedFlight[],
  base: number,
  extra: number,
) {
  const routes = aggregateRoutes(flights).slice(0, MAX_ROUTES).reverse();
  const maxCount = Math.max(1, ...routes.map((route) => route.count));
  return routes.map((route) => ({
    route,
    width: base + extra * Math.sqrt(route.count / maxCount),
  }));
}

export type FlatMapLayout = {
  projection: GeoProjection;
  routes: { route: RouteSummary; d: string; width: number }[];
  /** Quietest airport first, so the home airport draws on top. */
  dots: { code: string; x: number; y: number; r: number; home: boolean }[];
};

/**
 * The flights on a flat world map (Natural Earth projection) centered on
 * their longitudes, cropped to the band between 56°S and 76°N.
 */
export function layoutFlatMap(
  flights: readonly ResolvedFlight[],
  box: Box,
): FlatMapLayout {
  const ranked = rankAirports(flights);
  const meridian = centralMeridian(ranked);
  const band: GeoPermissibleObjects = {
    type: "MultiPoint",
    // The ends stay just inside ±180° of the meridian: rounding after the
    // rotation can push an exact 180° past the antimeridian, where it wraps
    // to the other edge and the fit misses the last 10° of the band.
    coordinates: Array.from(
      { length: 37 },
      (_, index) =>
        meridian + Math.max(-179.99, Math.min(179.99, -180 + index * 10)),
    ).flatMap((longitude) => [
      [longitude, -56],
      [longitude, 76],
    ]),
  };
  const projection = geoNaturalEarth1()
    .rotate([-meridian, 0])
    .fitExtent(
      [
        [box.x, box.y],
        [box.x + box.width, box.y + box.height],
      ],
      band,
    );
  const path = geoPath(projection);

  const routes = routeWidths(flights, 2.5, 4)
    .map(({ route, width }) => ({
      route,
      d: path(routeGeometry(route.a, route.b)) ?? "",
      width,
    }))
    .filter((route) => route.d);
  const maxVisits = Math.max(1, ranked[0]?.visits ?? 1);
  const home = ranked[0]?.airport.code;
  const dots = ranked
    .map(({ airport, visits }) => {
      const point = projection(lngLat(airport));
      return point
        ? {
            code: airport.code,
            x: Number(point[0].toFixed(1)),
            y: Number(point[1].toFixed(1)),
            r: 4.5 + 4.5 * Math.sqrt(visits / maxVisits),
            home: airport.code === home,
          }
        : null;
    })
    .filter((dot): dot is FlatMapLayout["dots"][number] => dot !== null)
    .reverse();

  return { projection, routes, dots };
}

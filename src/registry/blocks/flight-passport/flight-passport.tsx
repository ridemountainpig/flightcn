"use client";

import {
  ChevronDown,
  Pause,
  Plane,
  Play,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import {
  Popup,
  type FilterSpecification,
  type GeoJSONSource,
  type LayerSpecification,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Map, useMap } from "@/components/ui/map";
import {
  FlightAirport,
  generateArcGeometry,
  getAirportInfo,
  SingleWorldZoomLimit,
  type AirportInfo,
} from "@/components/ui/flight";
import {
  aggregateRoutes,
  computePassportStats,
  computeYearInReview,
  easeFlight,
  formatAroundEarth,
  formatDistance,
  formatFlightDate,
  formatInteger,
  formatMultiplier,
  listFlightYears,
  MONTH_NAMES,
  PLANE_ICON_PATH,
  resolveFlights,
  SAMPLE_PASSPORT_FLIGHTS,
  scheduleReplay,
  shortCountryName,
  type AirportLookup,
  type DistanceUnit,
  type PassportFlightInput,
  type PassportStats,
  type ResolvedFlight,
  type RouteSummary,
  type YearInReview,
} from "./flight-passport-stats";

export type PassportYear = number | "all";

export type FlightPassportProps = {
  /**
   * Flights to show. Defaults to a sample log. Pass a stable reference
   * (memoize it): a new array every render re-resolves the log and
   * restarts a running replay.
   */
  flights?: readonly PassportFlightInput[];
  /** Controlled year selection ("all" for lifetime). A year without flights shows all time. */
  year?: PassportYear;
  /** Initial year when uncontrolled (default "all"). */
  defaultYear?: PassportYear;
  onYearChange?: (year: PassportYear) => void;
  /** Distance unit (default "km"). */
  unit?: DistanceUnit;
  /**
   * Airport lookup for codes outside the built-in database. Pass a stable
   * reference; defaults to the built-in `getAirportInfo`.
   */
  lookupAirport?: AirportLookup;
  /** Color of the routes, the replay and the highlights (default "#c65d24"). */
  routeColor?: string;
  /** Replay a year's flights one by one when it is selected (default true). */
  autoPlay?: boolean;
  className?: string;
};

const DEFAULT_ROUTE_COLOR = "#c65d24";
const INK = "#1d241c";
const CONTEXT_ROUTE = "#8a8f86";
const ARC_POINTS = 64;
const MAX_LABELS = 12;
const TOP_COUNT = 5;
/** Arcs bulge toward the poles; capping them keeps polar routes from zooming the map out to the Arctic. */
const ARC_LATITUDE_LIMITS: [number, number] = [-55, 62];

/** How long a landed flight's trail and ping take to fade. */
const LANDING_FADE_MS = 600;
/** Replay progress reaches React state at most this often. */
const STEP_INTERVAL_MS = 100;
/** A longer gap between frames (a hidden tab) doesn't move the replay further. */
const MAX_FRAME_MS = 250;
/** Reveal time that shows every route and airport. */
const REVEAL_ALL = Number.MAX_SAFE_INTEGER;
/** With more years than this, the older ones move into a menu. */
const MAX_YEAR_BUTTONS = 5;
/** Phones fit fewer; past this, every year moves into one menu. */
const MAX_PHONE_YEAR_BUTTONS = 4;
/** Past this many bars, the chart labels every few bars and drops the counts. */
const MAX_LABELED_BARS = 16;
const PLANE_IMAGE_SIZE = 28;
const PLANE_IMAGE_PIXEL_RATIO = 2;

type LngLat = [number, number];
type ArcGeometry = ReturnType<typeof generateArcGeometry>;
type PassportFeature = {
  type: "Feature";
  geometry: ArcGeometry | { type: "Point"; coordinates: LngLat };
  properties: Record<string, string | number>;
};
type PassportFeatureCollection = {
  type: "FeatureCollection";
  features: PassportFeature[];
};
type CameraBounds = [[number, number], [number, number]];

const EMPTY_COLLECTION: PassportFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};
const WORLD_BOUNDS: CameraBounds = [
  [-180, -55],
  [180, 70],
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

function plural(count: number, word: string) {
  return `${formatInteger(count)} ${word}${count === 1 ? "" : "s"}`;
}

function normalizeLongitude(longitude: number) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

/**
 * Smallest longitude span covering every point, found by dropping the
 * widest empty gap. A Pacific network spans the date line instead of the
 * whole world. Returns null when no point is given.
 */
function longitudeSpan(longitudes: number[]): [number, number] | null {
  const sorted = [...new Set(longitudes.map(normalizeLongitude))].sort(
    (a, b) => a - b,
  );
  if (sorted.length === 0) return null;
  let gapIndex = sorted.length - 1;
  let gap = sorted[0] + 360 - sorted[sorted.length - 1];
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const next = sorted[index + 1] - sorted[index];
    if (next > gap) {
      gap = next;
      gapIndex = index;
    }
  }
  const west = sorted[(gapIndex + 1) % sorted.length];
  let east = sorted[gapIndex];
  if (east < west) east += 360;
  return [west, east];
}

function flattenGeometry(geometry: ArcGeometry): LngLat[] {
  return geometry.type === "LineString"
    ? geometry.coordinates
    : geometry.coordinates.flat();
}

function computeCameraBounds(
  airports: readonly AirportInfo[],
  arcs: readonly ArcGeometry[],
): CameraBounds | null {
  if (airports.length === 0) return null;
  const arcPoints = arcs.flatMap((arc) =>
    flattenGeometry(arc).filter((_, index) => index % 4 === 0),
  );
  const span = longitudeSpan([
    ...airports.map((airport) => airport.longitude),
    ...arcPoints.map(([longitude]) => longitude),
  ]);
  if (!span || span[1] - span[0] > 300) return WORLD_BOUNDS;

  const airportLatitudes = airports.map((airport) => airport.latitude);
  const arcLatitudes = arcPoints.map(([, latitude]) =>
    Math.min(
      ARC_LATITUDE_LIMITS[1],
      Math.max(ARC_LATITUDE_LIMITS[0], latitude),
    ),
  );
  const latitudes = [...airportLatitudes, ...arcLatitudes];
  return [
    [span[0], Math.min(...latitudes)],
    [span[1], Math.max(...latitudes)],
  ];
}

function routeKey(flight: ResolvedFlight) {
  return flight.from.code < flight.to.code
    ? `${flight.from.code}-${flight.to.code}`
    : `${flight.to.code}-${flight.from.code}`;
}

type ReplayLeg = {
  flight: ResolvedFlight;
  routeKey: string;
  /** Great-circle path from origin to destination, unwrapped across the date line. */
  path: LngLat[];
  /** Distance along the path at each point, so planes fly at a steady speed. */
  lengths: number[];
  /** Takeoff and landing, in ms from the start of the replay. */
  start: number;
  end: number;
};

type ReplayTimeline = { legs: ReplayLeg[]; duration: number };
type ReplayStatus = "playing" | "paused" | "done";
/** Replay progress as React state: the latest flight to take off and the replay clock. */
type ReplayStep = { run: number; leg: number; clock: number };

/** One continuous path from an arc, so a plane can fly across the date line. */
function unwrapPath(geometry: ArcGeometry): LngLat[] {
  const path: LngLat[] = [];
  for (const [longitude, latitude] of flattenGeometry(geometry)) {
    const previous = path[path.length - 1];
    let unwrapped = longitude;
    if (previous) {
      while (unwrapped - previous[0] > 180) unwrapped -= 360;
      while (unwrapped - previous[0] < -180) unwrapped += 360;
    }
    path.push([unwrapped, latitude]);
  }
  return path;
}

function pathLengths(path: readonly LngLat[]) {
  const lengths = [0];
  for (let index = 1; index < path.length; index += 1) {
    const [x0, y0] = path[index - 1];
    const [x1, y1] = path[index];
    const dx = (x1 - x0) * Math.cos(((y0 + y1) * Math.PI) / 360);
    lengths.push(lengths[index - 1] + Math.hypot(dx, y1 - y0));
  }
  return lengths;
}

/** Each flight in order with its path and its slot in the replay. */
function buildReplayTimeline(
  flights: readonly ResolvedFlight[],
  arcs: ReadonlyMap<string, ArcGeometry>,
): ReplayTimeline {
  const ordered = [...flights]
    .filter((flight) => arcs.has(routeKey(flight)))
    .sort((a, b) => a.order - b.order);
  const slots = scheduleReplay(ordered.map((flight) => flight.distanceKm));

  // Every flight on a route in the same direction shares one path.
  const paths = new globalThis.Map<
    string,
    { path: LngLat[]; lengths: number[] }
  >();
  const legs = ordered.map((flight, index): ReplayLeg => {
    const key = routeKey(flight);
    const direction = `${flight.from.code}>${flight.to.code}`;
    let shape = paths.get(direction);
    if (!shape) {
      // Route arcs run from the alphabetically first airport.
      const forward = unwrapPath(arcs.get(key)!);
      const path =
        flight.from.code < flight.to.code ? forward : [...forward].reverse();
      shape = { path, lengths: pathLengths(path) };
      paths.set(direction, shape);
    }
    return { flight, routeKey: key, ...shape, ...slots[index] };
  });
  const landed = legs.reduce((latest, leg) => Math.max(latest, leg.end), 0);
  return { legs, duration: legs.length > 0 ? landed + LANDING_FADE_MS : 0 };
}

/** Index of the latest flight to take off by `elapsed`, or -1 before the first. */
function latestLegIndex(legs: readonly ReplayLeg[], elapsed: number) {
  let low = 0;
  let high = legs.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (legs[middle].start <= elapsed) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}

function mercatorY(latitude: number) {
  const clamped = Math.max(-85, Math.min(85, latitude));
  return Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360));
}

/** Heading in degrees clockwise from north, as the segment looks on a Web Mercator map. */
function screenHeading(from: LngLat, to: LngLat) {
  const dx = ((to[0] - from[0]) * Math.PI) / 180;
  const dy = mercatorY(to[1]) - mercatorY(from[1]);
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

/** The part of a leg flown at `progress` (0–1), and where the plane is. */
function flownPath(leg: ReplayLeg, progress: number) {
  const { path, lengths } = leg;
  const target = progress * lengths[lengths.length - 1];
  let index = 1;
  while (index < path.length - 1 && lengths[index] < target) index += 1;
  const before = path[index - 1];
  const after = path[index];
  const span = lengths[index] - lengths[index - 1];
  const fraction =
    span > 0 ? Math.min(1, (target - lengths[index - 1]) / span) : 1;
  const plane: LngLat = [
    before[0] + (after[0] - before[0]) * fraction,
    before[1] + (after[1] - before[1]) * fraction,
  ];
  // The date line seam repeats a point; take the heading from the step before.
  const tail = span > 0 || index < 2 ? before : path[index - 2];
  return {
    coordinates: [...path.slice(0, index), plane],
    plane,
    heading: screenHeading(tail, after),
  };
}

/** Flights in the air at `elapsed`, plus the fading trails of ones that just landed. */
function buildReplayFrame(
  legs: readonly ReplayLeg[],
  elapsed: number,
): PassportFeatureCollection {
  const features: PassportFeature[] = [];
  for (const leg of legs) {
    if (leg.start > elapsed) break;
    const landedFor = elapsed - leg.end;
    if (landedFor >= LANDING_FADE_MS) continue;
    if (landedFor < 0) {
      const flown = flownPath(
        leg,
        easeFlight((elapsed - leg.start) / (leg.end - leg.start)),
      );
      features.push(
        {
          type: "Feature",
          geometry: { type: "LineString", coordinates: flown.coordinates },
          properties: { kind: "trail", fade: 1 },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: flown.plane },
          properties: { kind: "plane", heading: flown.heading },
        },
      );
      continue;
    }
    const fade = 1 - landedFor / LANDING_FADE_MS;
    features.push(
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates: leg.path },
        properties: { kind: "trail", fade },
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: leg.path[leg.path.length - 1] },
        properties: { kind: "ping", fade, radius: 5 + 13 * (1 - fade) },
      },
    );
  }
  return { type: "FeatureCollection", features };
}

type ScopeAirport = { airport: AirportInfo; visits: number; revealAt: number };

/**
 * Turns the lifetime route set and the replay legs in scope into map
 * features. `revealAt` is when a route or airport first appears in the
 * replay: a route when its first flight lands, an airport at its first
 * takeoff or landing.
 */
function buildMapData(
  lifetimeRoutes: readonly RouteSummary[],
  arcs: ReadonlyMap<string, ArcGeometry>,
  legs: readonly ReplayLeg[],
  yearMode: boolean,
  unit: DistanceUnit,
) {
  // `Map` is the map component in this file, so use the global collection.
  const scopeRoutes = new globalThis.Map<
    string,
    { count: number; revealAt: number }
  >();
  const scopeAirports = new globalThis.Map<string, ScopeAirport>();
  for (const leg of legs) {
    const route = scopeRoutes.get(leg.routeKey);
    if (route) {
      route.count += 1;
      route.revealAt = Math.min(route.revealAt, leg.end);
    } else {
      scopeRoutes.set(leg.routeKey, { count: 1, revealAt: leg.end });
    }
    const stops: [AirportInfo, number][] = [
      [leg.flight.from, leg.start],
      [leg.flight.to, leg.end],
    ];
    for (const [airport, revealAt] of stops) {
      const entry = scopeAirports.get(airport.code);
      if (entry) {
        entry.visits += 1;
        entry.revealAt = Math.min(entry.revealAt, revealAt);
      } else {
        scopeAirports.set(airport.code, { airport, visits: 1, revealAt });
      }
    }
  }

  const maxCount = Math.max(
    1,
    ...[...scopeRoutes.values()].map((r) => r.count),
  );
  const maxVisits = Math.max(
    1,
    ...[...scopeAirports.values()].map((a) => a.visits),
  );
  const features: PassportFeature[] = [];
  const scopeArcs: ArcGeometry[] = [];
  for (const route of lifetimeRoutes) {
    const geometry = arcs.get(route.key);
    if (!geometry) continue;
    const scope = scopeRoutes.get(route.key);
    if (scope) scopeArcs.push(geometry);
    const count = scope?.count ?? route.count;
    features.push({
      type: "Feature",
      geometry,
      properties: {
        kind: "route",
        inScope: scope ? 1 : 0,
        revealAt: scope?.revealAt ?? 0,
        width: scope ? 1.25 + 3.25 * Math.sqrt(scope.count / maxCount) : 1,
        label: `${route.a.code} – ${route.b.code} · ${plural(count, "flight")}${
          yearMode && !scope ? " all time" : ""
        } · ${formatDistance(route.distanceKm, unit)}`,
      },
    });
  }
  const rankedAirports = [...scopeAirports.values()].sort(
    (a, b) =>
      b.visits - a.visits || a.airport.code.localeCompare(b.airport.code, "en"),
  );
  for (const entry of rankedAirports) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [entry.airport.longitude, entry.airport.latitude],
      },
      properties: {
        kind: "airport",
        inScope: 1,
        revealAt: entry.revealAt,
        radius: 3 + 4 * Math.sqrt(entry.visits / maxVisits),
      },
    });
  }

  return {
    collection: {
      type: "FeatureCollection",
      features,
    } as PassportFeatureCollection,
    labels: rankedAirports.slice(0, MAX_LABELS),
    bounds: computeCameraBounds(
      rankedAirports.map((entry) => entry.airport),
      scopeArcs,
    ),
  };
}

function routeFilter(clock: number): FilterSpecification {
  return [
    "all",
    ["==", ["get", "kind"], "route"],
    ["==", ["get", "inScope"], 1],
    ["<=", ["get", "revealAt"], clock],
  ];
}

function airportFilter(clock: number): FilterSpecification {
  return [
    "all",
    ["==", ["get", "kind"], "airport"],
    ["<=", ["get", "revealAt"], clock],
  ];
}

const CONTEXT_FILTER: FilterSpecification = [
  "all",
  ["==", ["get", "kind"], "route"],
  ["==", ["get", "inScope"], 0],
];

function passportLayerIds(baseId: string) {
  return {
    source: baseId,
    replaySource: `${baseId}-replay`,
    context: `${baseId}-context`,
    routes: `${baseId}-routes`,
    glow: `${baseId}-glow`,
    trail: `${baseId}-trail`,
    airports: `${baseId}-airports`,
    ping: `${baseId}-ping`,
    plane: `${baseId}-plane`,
    planeImage: `${baseId}-plane-image`,
  };
}

type PassportLayerIds = ReturnType<typeof passportLayerIds>;

/**
 * MapLibre only reads hex, rgb() and hsl(), but apps often pass CSS
 * variables or oklch(). Resolves any CSS color through the page's styles
 * (from `scope`, so variables apply) and a canvas pixel, to rgba().
 */
function toMapColor(color: string, scope: HTMLElement) {
  const probe = document.createElement("span");
  probe.style.color = color;
  if (!probe.style.color) return DEFAULT_ROUTE_COLOR;
  probe.style.display = "none";
  scope.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  const context = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (!context) return DEFAULT_ROUTE_COLOR;
  // A color the canvas can't read leaves the default in place.
  context.fillStyle = DEFAULT_ROUTE_COLOR;
  context.fillStyle = resolved;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
  return `rgba(${red}, ${green}, ${blue}, ${(alpha / 255).toFixed(3)})`;
}

/** The replay plane, drawn in the route color with a white outline. */
function makePlaneImage(color: string) {
  const size = PLANE_IMAGE_SIZE * PLANE_IMAGE_PIXEL_RATIO;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return new ImageData(size, size);
  const path = new Path2D(PLANE_ICON_PATH);
  context.scale(size / 24, size / 24);
  context.lineJoin = "round";
  context.shadowColor = "rgba(15, 23, 42, 0.35)";
  context.shadowBlur = 1.4;
  context.shadowOffsetY = 0.6;
  context.strokeStyle = "#ffffff";
  context.lineWidth = 1.5;
  context.stroke(path);
  context.fillStyle = color;
  context.fill(path);
  return context.getImageData(0, 0, size, size);
}

/**
 * Two GeoJSON sources for every route, airport and replay frame, so long
 * logs stay fast: one for the passport, one redrawn each replay frame.
 */
function PassportRoutesLayer({
  ids,
  collection,
  clock,
  replaying,
  color,
}: {
  ids: PassportLayerIds;
  collection: PassportFeatureCollection;
  clock: number;
  replaying: boolean;
  color: string;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    for (const sourceId of [ids.source, ids.replaySource]) {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: "geojson", data: EMPTY_COLLECTION });
      }
    }
    // Bottom to top. Colors are set by the effect below.
    const layers: LayerSpecification[] = [
      {
        id: ids.context,
        type: "line",
        source: ids.source,
        filter: CONTEXT_FILTER,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": CONTEXT_ROUTE,
          "line-width": 1,
          "line-opacity": 0.4,
        },
      },
      {
        id: ids.routes,
        type: "line",
        source: ids.source,
        filter: routeFilter(REVEAL_ALL),
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": DEFAULT_ROUTE_COLOR,
          "line-width": ["get", "width"],
          "line-opacity": 0.85,
        },
      },
      {
        id: ids.glow,
        type: "line",
        source: ids.replaySource,
        filter: ["==", ["get", "kind"], "trail"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": DEFAULT_ROUTE_COLOR,
          "line-width": 8,
          "line-blur": 5,
          "line-opacity": ["*", 0.3, ["get", "fade"]],
        },
      },
      {
        id: ids.trail,
        type: "line",
        source: ids.replaySource,
        filter: ["==", ["get", "kind"], "trail"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": DEFAULT_ROUTE_COLOR,
          "line-width": 2.75,
          "line-opacity": ["get", "fade"],
        },
      },
      {
        id: ids.airports,
        type: "circle",
        source: ids.source,
        filter: airportFilter(REVEAL_ALL),
        paint: {
          "circle-color": INK,
          "circle-radius": ["get", "radius"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      },
      {
        id: ids.ping,
        type: "circle",
        source: ids.replaySource,
        filter: ["==", ["get", "kind"], "ping"],
        paint: {
          "circle-color": "rgba(0, 0, 0, 0)",
          "circle-radius": ["get", "radius"],
          "circle-stroke-color": DEFAULT_ROUTE_COLOR,
          "circle-stroke-width": 2,
          "circle-stroke-opacity": ["get", "fade"],
        },
      },
      {
        id: ids.plane,
        type: "symbol",
        source: ids.replaySource,
        filter: ["==", ["get", "kind"], "plane"],
        layout: {
          "icon-image": ids.planeImage,
          "icon-size": 1,
          "icon-rotate": ["get", "heading"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      },
    ];
    for (const layer of layers) {
      if (!map.getLayer(layer.id)) map.addLayer(layer);
    }
    return () => {
      try {
        for (const layer of [...layers].reverse()) {
          if (map.getLayer(layer.id)) map.removeLayer(layer.id);
        }
        for (const sourceId of [ids.replaySource, ids.source]) {
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        }
        if (map.hasImage(ids.planeImage)) map.removeImage(ids.planeImage);
      } catch {
        // The map or its style may already be disposed.
      }
    };
  }, [map, isLoaded, ids]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const source = map.getSource(ids.source) as GeoJSONSource | undefined;
    source?.setData(collection as Parameters<GeoJSONSource["setData"]>[0]);
  }, [map, isLoaded, ids, collection]);

  useEffect(() => {
    if (!map || !isLoaded || !map.getLayer(ids.routes)) return;
    map.setFilter(ids.routes, routeFilter(clock));
    map.setFilter(ids.airports, airportFilter(clock));
    // Landed routes step back so the flight in the air stands out.
    map.setPaintProperty(ids.routes, "line-opacity", replaying ? 0.55 : 0.85);
  }, [map, isLoaded, ids, clock, replaying]);

  useEffect(() => {
    if (!map || !isLoaded || !map.getLayer(ids.routes)) return;
    const mapColor = toMapColor(color, map.getContainer());
    for (const layerId of [ids.routes, ids.glow, ids.trail]) {
      map.setPaintProperty(layerId, "line-color", mapColor);
    }
    map.setPaintProperty(ids.ping, "circle-stroke-color", mapColor);
    const image = makePlaneImage(mapColor);
    if (map.hasImage(ids.planeImage)) {
      map.updateImage(ids.planeImage, image);
    } else {
      map.addImage(ids.planeImage, image, {
        pixelRatio: PLANE_IMAGE_PIXEL_RATIO,
      });
    }
  }, [map, isLoaded, ids, color]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    // mapcn's map styles strip the popup's own box, so the label brings one.
    const tooltip = document.createElement("div");
    tooltip.className =
      "pointer-events-none rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] whitespace-nowrap text-slate-700 shadow-sm";
    const popup = new Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 10,
    }).setDOMContent(tooltip);
    const onMove = (event: MapLayerMouseEvent) => {
      const label = event.features?.[0]?.properties?.label;
      if (typeof label !== "string") return;
      map.getCanvas().style.cursor = "pointer";
      tooltip.textContent = label;
      popup.setLngLat(event.lngLat).addTo(map);
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    };
    for (const layerId of [ids.routes, ids.context]) {
      map.on("mousemove", layerId, onMove);
      map.on("mouseleave", layerId, onLeave);
    }
    return () => {
      for (const layerId of [ids.routes, ids.context]) {
        map.off("mousemove", layerId, onMove);
        map.off("mouseleave", layerId, onLeave);
      }
      popup.remove();
    };
  }, [map, isLoaded, ids]);

  return null;
}

/**
 * Plays the replay: each flight's arc grows from origin to destination
 * behind a plane, then fades as it lands and its route appears below.
 * Frames go straight to the map; React only hears where the replay is at
 * most every STEP_INTERVAL_MS, however many flights are in the air.
 */
function PassportReplay({
  sourceId,
  timeline,
  run,
  status,
  color,
  onStep,
  onEnd,
}: {
  sourceId: string;
  timeline: ReplayTimeline;
  run: number;
  status: ReplayStatus;
  color: string;
  onStep: (step: ReplayStep) => void;
  onEnd: (run: number) => void;
}) {
  const { map, isLoaded } = useMap();
  const barRef = useRef<HTMLSpanElement>(null);
  const elapsedRef = useRef(0);
  // The last frame's time. It outlives effect restarts (new flights while
  // playing), so the clock keeps moving even if the parent re-renders often.
  const lastFrameRef = useRef<number | null>(null);
  const runRef = useRef(run);
  const callbacksRef = useRef({ onStep, onEnd });
  useEffect(() => {
    callbacksRef.current = { onStep, onEnd };
  });

  useEffect(() => {
    if (!map || !isLoaded) return;
    if (runRef.current !== run) {
      runRef.current = run;
      elapsedRef.current = 0;
      lastFrameRef.current = null;
    }
    const source = () => map.getSource(sourceId) as GeoJSONSource | undefined;
    if (status !== "playing") lastFrameRef.current = null;
    if (status === "done") {
      source()?.setData(
        EMPTY_COLLECTION as Parameters<GeoJSONSource["setData"]>[0],
      );
      return;
    }

    let reported = -Infinity;
    const draw = (report: boolean) => {
      const elapsed = elapsedRef.current;
      source()?.setData(
        buildReplayFrame(timeline.legs, elapsed) as Parameters<
          GeoJSONSource["setData"]
        >[0],
      );
      if (barRef.current) {
        const progress =
          timeline.duration > 0 ? elapsed / timeline.duration : 1;
        barRef.current.style.transform = `scaleX(${progress})`;
      }
      if (!report) return;
      if (elapsed - reported < STEP_INTERVAL_MS) return;
      reported = elapsed;
      callbacksRef.current.onStep({
        run,
        leg: latestLegIndex(timeline.legs, elapsed),
        clock: elapsed,
      });
    };
    draw(false);
    if (status === "paused") return;

    let frame = 0;
    const tick = (now: number) => {
      const previous = lastFrameRef.current;
      if (previous !== null) {
        elapsedRef.current = Math.min(
          timeline.duration,
          elapsedRef.current +
            Math.min(MAX_FRAME_MS, Math.max(0, now - previous)),
        );
      }
      lastFrameRef.current = now;
      draw(true);
      if (elapsedRef.current >= timeline.duration) {
        callbacksRef.current.onEnd(run);
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [map, isLoaded, sourceId, timeline, run, status]);

  if (status === "done") return null;
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-0.5 bg-slate-900/10"
    >
      <span
        ref={barRef}
        className="block h-full origin-left"
        style={{ backgroundColor: color, transform: "scaleX(0)" }}
      />
    </span>
  );
}

/** Fits the routes in scope on load, on resize, and when the scope changes. */
function PassportCamera({
  bounds,
  animate,
}: {
  bounds: CameraBounds | null;
  animate: boolean;
}) {
  const { map, isLoaded } = useMap();
  const boundsKey = bounds
    ? bounds
        .flat()
        .map((value) => value.toFixed(2))
        .join()
    : "";

  useEffect(() => {
    if (!map || !isLoaded || !bounds) return;
    const fit = (duration: number) => {
      map.fitBounds(bounds, {
        padding: { top: 56, bottom: 36, left: 36, right: 36 },
        maxZoom: 5,
        duration,
      });
    };
    fit(animate ? 900 : 0);
    const onResize = () => fit(0);
    map.on("resize", onResize);
    return () => {
      map.off("resize", onResize);
    };
    // boundsKey stands in for the bounds array, which is rebuilt each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, boundsKey]);

  return null;
}

type StatItem = { label: string; value: string; detail?: string };

function newPlaces(count: number, firstYearOnRecord: boolean) {
  return firstYearOnRecord || count === 0
    ? undefined
    : `+${formatInteger(count)} new`;
}

function buildStatItems(
  stats: PassportStats,
  review: YearInReview | null,
  unit: DistanceUnit,
): StatItem[] {
  const distance = {
    label: "Distance",
    value: formatDistance(stats.distanceKm, unit),
    detail: formatAroundEarth(stats.aroundEarth),
  };
  const hours = {
    label: "Time in the air",
    value: `≈ ${formatInteger(stats.hours)} h`,
    detail: "Estimated from distance",
  };
  if (!review) {
    return [
      {
        label: "Flights",
        value: formatInteger(stats.flights),
        detail:
          stats.perYear.length > 1
            ? `Across ${stats.perYear.length} years`
            : stats.domestic > 0
              ? `${formatInteger(stats.domestic)} domestic`
              : undefined,
      },
      distance,
      hours,
      {
        label: "Airports",
        value: formatInteger(stats.airportVisits.length),
        detail: stats.home ? `Home: ${stats.home.code}` : undefined,
      },
      {
        label: "Countries",
        value: formatInteger(stats.countries.length),
        detail:
          stats.toMoon >= 1
            ? `${formatMultiplier(stats.toMoon)} the distance to the Moon`
            : // Floored, so 99.6% doesn't read as all the way there.
              `${Math.floor(stats.toMoon * 100)}% of the way to the Moon`,
      },
    ];
  }

  const previous = review.previous;
  let flightsDetail = "First year on record";
  if (previous) {
    const delta = stats.flights - previous.flights;
    flightsDetail =
      previous.flights === 0
        ? `No flights in ${previous.year}`
        : delta === 0
          ? `Same as ${previous.year}`
          : `${delta > 0 ? "+" : "−"}${formatInteger(Math.abs(delta))} vs ${previous.year}`;
  }
  return [
    {
      label: "Flights",
      value: formatInteger(stats.flights),
      detail: flightsDetail,
    },
    distance,
    hours,
    {
      label: "Airports",
      value: formatInteger(stats.airportVisits.length),
      detail: newPlaces(review.newAirports.length, review.firstYearOnRecord),
    },
    {
      label: "Countries",
      value: formatInteger(stats.countries.length),
      detail: newPlaces(review.newCountries.length, review.firstYearOnRecord),
    },
  ];
}

type Highlight = { label: string; value: string; detail?: string };

function flightRoute(flight: ResolvedFlight) {
  return `${flight.from.code} → ${flight.to.code}`;
}

function buildHighlights(
  stats: PassportStats,
  review: YearInReview | null,
  unit: DistanceUnit,
): Highlight[] {
  const highlights: Highlight[] = [];
  if (stats.longest) {
    highlights.push({
      label: "Longest flight",
      value: flightRoute(stats.longest),
      detail: formatDistance(stats.longest.distanceKm, unit),
    });
  }
  const topRoute = stats.routes[0];
  if (topRoute && topRoute.count > 1) {
    highlights.push({
      label: "Most flown",
      value: `${topRoute.a.code} ⇄ ${topRoute.b.code}`,
      detail: plural(topRoute.count, "flight"),
    });
  }
  if (review) {
    if (review.busiestMonth) {
      highlights.push({
        label: "Busiest month",
        value: MONTH_NAMES[review.busiestMonth.month - 1],
        detail: plural(review.busiestMonth.flights, "flight"),
      });
    }
    if (review.topDestination) {
      highlights.push({
        label: "Top destination",
        value: review.topDestination.airport.code,
        detail: review.topDestination.airport.city,
      });
    }
    if (stats.first) {
      highlights.push({
        label: "First flight",
        value: flightRoute(stats.first),
        detail: formatFlightDate(stats.first.date),
      });
    }
    if (stats.last && stats.last !== stats.first) {
      highlights.push({
        label: "Last flight",
        value: flightRoute(stats.last),
        detail: formatFlightDate(stats.last.date),
      });
    }
    return highlights;
  }

  if (stats.home) {
    const visits = stats.airportVisits[0]?.visits ?? 0;
    highlights.push({
      label: "Home airport",
      value: stats.home.code,
      detail: `${stats.home.city} · ${plural(visits, "visit")}`,
    });
  }
  if (stats.first) {
    highlights.push({
      label: "First on record",
      value: flightRoute(stats.first),
      detail: formatFlightDate(stats.first.date),
    });
  }
  if (stats.flights > 0) {
    const international = stats.flights - stats.domestic;
    highlights.push({
      label: "International",
      value: `${Math.round((international / stats.flights) * 100)}%`,
      detail: `${formatInteger(international)} of ${plural(stats.flights, "flight")}`,
    });
  }
  return highlights;
}

/**
 * White cells that complete the last row of a `gap-px` grid at two and
 * three columns, so the gap color never shows through as an empty tile.
 */
function gridFillers(count: number, extraClass = "") {
  const twoColumns = (2 - (count % 2)) % 2;
  const threeColumns = (3 - (count % 3)) % 3;
  return [
    ...Array.from({ length: twoColumns }, (_, index) => (
      <div
        key={`fill-2-${index}`}
        aria-hidden="true"
        className="bg-white sm:hidden"
      />
    )),
    ...Array.from({ length: threeColumns }, (_, index) => (
      <div
        key={`fill-3-${index}`}
        aria-hidden="true"
        className={`hidden bg-white sm:block ${extraClass}`}
      />
    )),
  ];
}

/** Flights per year from the first year to the last, with the gaps as zeros. */
function everyYear(perYear: PassportStats["perYear"]) {
  if (perYear.length === 0) return [];
  const counts = new globalThis.Map(
    perYear.map((entry) => [entry.year, entry.flights]),
  );
  const first = Math.min(...counts.keys());
  const last = Math.max(...counts.keys());
  return Array.from({ length: last - first + 1 }, (_, index) => ({
    year: first + index,
    flights: counts.get(first + index) ?? 0,
  }));
}

const yearButtonClass = (active: boolean) =>
  `pressable shrink-0 rounded-md px-2.5 py-1 font-mono text-xs font-medium ${
    active ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"
  }`;

/** A year picker in the same style as the year buttons. */
function YearMenu({
  label,
  placeholder,
  years,
  value,
  onSelect,
  className,
}: {
  label: string;
  placeholder: string;
  years: readonly number[];
  /** The selected year when it is in this menu, else null. */
  value: PassportYear | null;
  onSelect: (year: number) => void;
  className: string;
}) {
  const active = value !== null;
  return (
    <span className={`relative shrink-0 ${className}`}>
      <select
        aria-label={label}
        value={active ? String(value) : ""}
        onChange={(event) => {
          if (event.target.value) onSelect(Number(event.target.value));
        }}
        className={`pressable cursor-pointer appearance-none rounded-md py-1 pr-6 pl-2.5 font-mono text-xs font-medium ${
          active
            ? "bg-slate-950 text-white"
            : "bg-white text-slate-600 hover:text-slate-950"
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        aria-hidden="true"
        className={`pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 ${
          active ? "text-white" : "text-slate-500"
        }`}
      />
    </span>
  );
}

const overlayButtonClass =
  "pressable inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-white";

/** "Mar 8" within a year, "Mar 2024" across years. */
function replayDate(flight: ResolvedFlight, withYear: boolean) {
  if (!flight.year || !flight.month) return "Undated";
  const month = MONTH_NAMES[flight.month - 1];
  if (withYear) return `${month} ${flight.year}`;
  return flight.date && flight.date.length > 7
    ? `${month} ${Number(flight.date.slice(8, 10))}`
    : month;
}

export function FlightPassport({
  flights = SAMPLE_PASSPORT_FLIGHTS,
  year: yearProp,
  defaultYear = "all",
  onYearChange,
  unit = "km",
  lookupAirport = getAirportInfo,
  routeColor = DEFAULT_ROUTE_COLOR,
  autoPlay = true,
  className = "",
}: FlightPassportProps) {
  const reducedMotion = usePrefersReducedMotion();
  const baseId = `flight-passport-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const layerIds = useMemo(() => passportLayerIds(baseId), [baseId]);
  const resolved = useMemo(
    () => resolveFlights(flights, lookupAirport),
    [flights, lookupAirport],
  );
  const years = useMemo(() => listFlightYears(resolved.flights), [resolved]);

  const [uncontrolledYear, setUncontrolledYear] =
    useState<PassportYear>(defaultYear);
  const requestedYear = yearProp ?? uncontrolledYear;
  const selectedYear: PassportYear =
    requestedYear !== "all" && years.includes(requestedYear)
      ? requestedYear
      : "all";
  const yearMode = selectedYear !== "all";

  // A replay starts whenever the selected year changes, but not when the
  // flights are edited. Adjusting state during render avoids an extra pass.
  const autoStatus = (year: PassportYear): ReplayStatus =>
    autoPlay && year !== "all" ? "playing" : "done";
  const [replay, setReplay] = useState(() => ({
    run: 0,
    status: autoStatus(selectedYear),
  }));
  const [replayYear, setReplayYear] = useState<PassportYear>(selectedYear);
  if (replayYear !== selectedYear) {
    setReplayYear(selectedYear);
    setReplay({ run: replay.run + 1, status: autoStatus(selectedYear) });
  }
  const [step, setStep] = useState<ReplayStep>({ run: 0, leg: -1, clock: 0 });

  const selectYear = (year: PassportYear) => {
    if (yearProp === undefined) setUncontrolledYear(year);
    onYearChange?.(year);
  };

  const lifetime = useMemo(
    () => computePassportStats(resolved.flights),
    [resolved],
  );
  const review = useMemo(
    () =>
      yearMode ? computeYearInReview(resolved.flights, selectedYear) : null,
    [resolved, selectedYear, yearMode],
  );
  const stats = review?.stats ?? lifetime;

  const lifetimeRoutes = useMemo(
    () => aggregateRoutes(resolved.flights),
    [resolved],
  );
  const arcs = useMemo(
    () =>
      new globalThis.Map(
        lifetimeRoutes.map((route) => [
          route.key,
          generateArcGeometry(
            [route.a.longitude, route.a.latitude],
            [route.b.longitude, route.b.latitude],
            ARC_POINTS,
          ),
        ]),
      ),
    [lifetimeRoutes],
  );
  const scopeFlights = useMemo(
    () =>
      yearMode
        ? resolved.flights.filter((flight) => flight.year === selectedYear)
        : resolved.flights,
    [resolved, selectedYear, yearMode],
  );
  const timeline = useMemo(
    () => buildReplayTimeline(scopeFlights, arcs),
    [scopeFlights, arcs],
  );
  const mapData = useMemo(
    () => buildMapData(lifetimeRoutes, arcs, timeline.legs, yearMode, unit),
    [lifetimeRoutes, arcs, timeline, yearMode, unit],
  );

  const status: ReplayStatus =
    reducedMotion || timeline.legs.length === 0 ? "done" : replay.status;
  const replaying = status !== "done";
  const paused = status === "paused";
  const progress =
    replaying && step.run === replay.run ? step : { leg: -1, clock: 0 };
  const clock = replaying ? progress.clock : REVEAL_ALL;
  // Before the first takeoff, the first flight is the one coming up.
  const currentLeg = replaying
    ? timeline.legs[Math.max(0, progress.leg)]
    : undefined;

  const startReplay = () =>
    setReplay({ run: replay.run + 1, status: "playing" });
  const togglePause = () =>
    setReplay({ ...replay, status: paused ? "playing" : "paused" });
  // Pause and Skip disappear when a replay stops; if one of them had focus,
  // it moves to the Replay button that takes their place.
  const controlsRef = useRef<HTMLDivElement>(null);
  const replayButtonRef = useRef<HTMLButtonElement>(null);
  const focusReplayButton = useRef(false);
  const skipReplay = () => {
    focusReplayButton.current = true;
    setReplay({ ...replay, status: "done" });
  };
  const endReplay = (run: number) => {
    if (controlsRef.current?.contains(document.activeElement)) {
      focusReplayButton.current = true;
    }
    setReplay((current) =>
      current.run === run ? { ...current, status: "done" } : current,
    );
  };
  useEffect(() => {
    if (status !== "done" || !focusReplayButton.current) return;
    focusReplayButton.current = false;
    replayButtonRef.current?.focus();
  }, [status]);

  const statItems = buildStatItems(stats, review, unit);
  const highlights = buildHighlights(stats, review, unit);
  const activeMonth = yearMode ? currentLeg?.flight.month : undefined;
  const activeYear = yearMode ? undefined : currentLeg?.flight.year;
  const bars = review
    ? review.months.map((month) => ({
        key: String(month.month),
        label: MONTH_NAMES[month.month - 1],
        value: month.flights,
        active: month.month === activeMonth,
        dimmed: activeMonth !== undefined && month.month > activeMonth,
      }))
    : everyYear(lifetime.perYear).map(({ year, flights: count }) => ({
        key: String(year),
        label: String(year),
        value: count,
        active: year === activeYear,
        dimmed: activeYear !== undefined && year > activeYear,
      }));
  const maxBar = Math.max(1, ...bars.map((bar) => bar.value));
  const crowdedBars = bars.length > MAX_LABELED_BARS;
  const labelStep = Math.ceil(bars.length / 12);
  const recentYears =
    years.length > MAX_YEAR_BUTTONS
      ? years.slice(0, MAX_YEAR_BUTTONS - 1)
      : years;
  const earlierYears = years.slice(recentYears.length);
  const earlierSelected =
    selectedYear !== "all" && earlierYears.includes(selectedYear);
  const phoneYearMenu = years.length > MAX_PHONE_YEAR_BUTTONS;
  const isEmpty = resolved.flights.length === 0;
  const heading = yearMode
    ? `${selectedYear}${review?.isCurrentYear ? " so far" : " in review"}`
    : "All time";
  const replayLabel = currentLeg
    ? `${replayDate(currentLeg.flight, !yearMode)} · ${flightRoute(currentLeg.flight)}`
    : yearMode
      ? String(selectedYear)
      : null;
  const accentChipStyle: CSSProperties = {
    borderColor: `color-mix(in srgb, ${routeColor} 30%, white)`,
    backgroundColor: `color-mix(in srgb, ${routeColor} 7%, white)`,
    color: `color-mix(in srgb, ${routeColor} 75%, black)`,
  };

  return (
    <div
      className={`w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white ${className}`}
      style={{ "--passport-accent": routeColor } as CSSProperties}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <p className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500 uppercase">
          <Plane size={13} aria-hidden="true" /> Flight passport · {heading}
        </p>
        {years.length > 0 ? (
          <div
            role="group"
            aria-label="Year"
            className="flex max-w-full gap-0.5 overflow-x-auto rounded-lg border border-slate-200 bg-white p-0.5"
          >
            <button
              type="button"
              aria-pressed={!yearMode}
              onClick={() => selectYear("all")}
              className={yearButtonClass(!yearMode)}
            >
              All time
            </button>
            {recentYears.map((year) => (
              <button
                key={year}
                type="button"
                aria-pressed={selectedYear === year}
                onClick={() => selectYear(year)}
                className={`${yearButtonClass(selectedYear === year)} ${
                  phoneYearMenu ? "max-sm:hidden" : ""
                }`}
              >
                {year}
              </button>
            ))}
            {earlierYears.length > 0 ? (
              <YearMenu
                label="Earlier years"
                placeholder="Earlier"
                years={earlierYears}
                value={earlierSelected ? selectedYear : null}
                onSelect={selectYear}
                className="max-sm:hidden"
              />
            ) : null}
            {phoneYearMenu ? (
              <YearMenu
                label="Year"
                placeholder="Year"
                years={years}
                value={yearMode ? selectedYear : null}
                onSelect={selectYear}
                className="sm:hidden"
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* On large screens the map fills the row, so it always ends level with the stats beside it. */}
        <div className="flex h-80 min-w-0 flex-col border-b border-slate-200 sm:h-96 lg:h-auto lg:min-h-[460px] lg:border-r lg:border-b-0">
          <div className="relative min-h-0 flex-1">
            <Map
              theme="light"
              center={[121, 25]}
              zoom={1.5}
              scrollZoom={false}
              renderWorldCopies
              attributionControl={false}
              className="h-full w-full"
            >
              <SingleWorldZoomLimit />
              <PassportRoutesLayer
                ids={layerIds}
                collection={mapData.collection}
                clock={clock}
                replaying={replaying}
                color={routeColor}
              />
              <PassportReplay
                sourceId={layerIds.replaySource}
                timeline={timeline}
                run={replay.run}
                status={status}
                color={routeColor}
                onStep={setStep}
                onEnd={endReplay}
              />
              <PassportCamera
                bounds={mapData.bounds}
                animate={!reducedMotion}
              />
              {mapData.labels
                .filter((entry) => entry.revealAt <= clock)
                .map((entry) => (
                  <FlightAirport
                    key={entry.airport.code}
                    longitude={entry.airport.longitude}
                    latitude={entry.airport.latitude}
                    name={entry.airport.code}
                    showLabel
                    markerContent={<span className="block size-3" />}
                    labelClassName="font-mono text-[10px] font-semibold text-slate-900"
                  />
                ))}
            </Map>
            {!isEmpty ? (
              <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                <div
                  ref={controlsRef}
                  className="pointer-events-auto flex shrink-0 gap-1.5"
                >
                  {reducedMotion ? null : replaying ? (
                    <>
                      <button
                        type="button"
                        onClick={togglePause}
                        aria-label={paused ? "Resume replay" : "Pause replay"}
                        className={overlayButtonClass}
                      >
                        {paused ? (
                          <Play size={12} aria-hidden="true" />
                        ) : (
                          <Pause size={12} aria-hidden="true" />
                        )}
                        <span className="hidden sm:inline">
                          {paused ? "Resume" : "Pause"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={skipReplay}
                        aria-label="Skip replay"
                        className={overlayButtonClass}
                      >
                        <SkipForward size={12} aria-hidden="true" />
                        <span className="hidden sm:inline">Skip</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      ref={replayButtonRef}
                      onClick={startReplay}
                      className={overlayButtonClass}
                    >
                      <RotateCcw size={12} aria-hidden="true" />
                      {yearMode
                        ? `Replay ${selectedYear}`
                        : "Replay all flights"}
                    </button>
                  )}
                </div>
                {replayLabel ? (
                  <span className="min-w-0 truncate rounded-md border border-slate-200 bg-white/95 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700 tabular-nums shadow-sm backdrop-blur">
                    {replayLabel}
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="absolute inset-x-0 bottom-4 text-center text-sm text-slate-500">
                Add flights to draw your map.
              </p>
            )}
          </div>
          {/* The basemap's credit, beside the map rather than on it. */}
          <p className="px-3 py-1 text-right text-[10px] leading-4 text-slate-500">
            ©{" "}
            <a
              href="https://carto.com/attributions"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-950"
            >
              CARTO
            </a>{" "}
            ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-950"
            >
              OpenStreetMap
            </a>{" "}
            contributors
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-3 lg:grid-cols-1 lg:content-start lg:gap-0 lg:bg-white">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="bg-white px-4 py-3.5 lg:border-t lg:border-slate-200 lg:px-5 lg:first:border-t-0"
            >
              <dt className="text-[10px] tracking-widest text-slate-500 uppercase">
                {item.label}
              </dt>
              <dd className="mt-1 font-mono text-xl text-slate-950 tabular-nums">
                {item.value}
              </dd>
              {item.detail ? (
                <dd className="mt-0.5 text-xs text-slate-500">{item.detail}</dd>
              ) : null}
            </div>
          ))}
          {gridFillers(statItems.length, "lg:hidden")}
        </dl>
      </div>

      {bars.length > 0 ? (
        <section
          aria-label={review ? "Flights per month" : "Flights per year"}
          className="border-t border-slate-200 px-4 py-4 sm:px-5"
        >
          <p className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">
            {review ? "Flights per month" : "Flights per year"}
          </p>
          <ol
            className={`mt-3 flex h-28 items-end ${
              crowdedBars ? "gap-px sm:gap-0.5" : "gap-1 sm:gap-1.5"
            }`}
          >
            {bars.map((bar, index) => {
              // Crowded charts label every few bars, counting back from the latest.
              const labeled =
                !crowdedBars || (bars.length - 1 - index) % labelStep === 0;
              const height = `${Math.max(4, (bar.value / maxBar) * 100)}%`;
              const barClass = `w-full rounded-t-sm transition-colors ${
                bar.active
                  ? "bg-[var(--passport-accent)]"
                  : bar.value > 0
                    ? "bg-slate-400"
                    : "bg-slate-200"
              } ${bar.dimmed ? "opacity-30" : ""}`;
              return (
                <li
                  key={bar.key}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                >
                  <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                    {!crowdedBars && bar.value > 0 ? bar.value : ""}
                  </span>
                  {/* Months, and years without flights, have nothing to open. */}
                  {review || bar.value === 0 ? (
                    <span
                      className={barClass}
                      style={{ height }}
                      aria-hidden="true"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => selectYear(Number(bar.key))}
                      aria-label={`Show ${bar.label}`}
                      title={`${bar.label}: ${plural(bar.value, "flight")}`}
                      className={`${barClass} pressable hover:bg-[var(--passport-accent)]`}
                      style={{ height }}
                    />
                  )}
                  <span
                    className={`font-mono text-[10px] text-slate-500 ${
                      labeled ? "" : "invisible"
                    }`}
                  >
                    {bar.label}
                  </span>
                  <span className="sr-only">{plural(bar.value, "flight")}</span>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {highlights.length > 0 ? (
        <section
          aria-label="Highlights"
          className="grid grid-cols-2 gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-3"
        >
          {highlights.map((highlight) => (
            <div
              key={highlight.label}
              className="min-w-0 bg-white px-4 py-3 sm:px-5"
            >
              <p className="text-[10px] tracking-widest text-slate-500 uppercase">
                {highlight.label}
              </p>
              <p className="mt-1 truncate font-mono text-sm font-medium text-slate-950">
                {highlight.value}
              </p>
              {highlight.detail ? (
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {highlight.detail}
                </p>
              ) : null}
            </div>
          ))}
          {gridFillers(highlights.length)}
        </section>
      ) : null}

      {review && !review.firstYearOnRecord && review.newAirports.length > 0 ? (
        <section
          aria-label="New this year"
          className="border-t border-slate-200 px-4 py-4 sm:px-5"
        >
          <p className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">
            New this year
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {review.newAirports.map((airport) => (
              <li
                key={airport.code}
                title={`${airport.city}, ${shortCountryName(airport.country)}`}
                className="rounded-md border px-2 py-0.5 font-mono text-xs"
                style={accentChipStyle}
              >
                {airport.code}
              </li>
            ))}
            {review.newCountries.map((country) => (
              <li
                key={country}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
              >
                {shortCountryName(country)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!isEmpty ? (
        <section className="grid grid-cols-1 gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-3">
          <TopList
            title="Top airports"
            rows={stats.airportVisits.slice(0, TOP_COUNT).map((entry) => ({
              key: entry.airport.code,
              name: entry.airport.code,
              detail: entry.airport.city,
              value: entry.visits,
            }))}
          />
          <TopList
            title="Top routes"
            rows={stats.routes.slice(0, TOP_COUNT).map((route) => ({
              key: route.key,
              name: `${route.a.code} ⇄ ${route.b.code}`,
              detail: formatDistance(route.distanceKm, unit),
              value: route.count,
            }))}
          />
          <TopList
            title="Top countries"
            rows={stats.countries.slice(0, TOP_COUNT).map((entry) => ({
              key: entry.country,
              name: shortCountryName(entry.country),
              value: entry.flights,
            }))}
          />
        </section>
      ) : null}

      <Footnote
        unknown={resolved.unknown.map((entry) => entry.code)}
        undated={yearMode ? lifetime.undated : 0}
      />
    </div>
  );
}

function TopList({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; name: string; detail?: string; value: number }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="min-w-0 bg-white px-4 py-4 sm:px-5">
      <p className="font-mono text-[10px] tracking-widest text-slate-500 uppercase">
        {title}
      </p>
      <ol className="mt-2 space-y-2">
        {rows.map((row) => (
          <li key={row.key} className="min-w-0">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="min-w-0 truncate">
                <span className="font-mono font-medium text-slate-950">
                  {row.name}
                </span>
                {row.detail ? (
                  <span className="ml-1.5 text-slate-500">{row.detail}</span>
                ) : null}
              </span>
              <span className="shrink-0 font-mono text-slate-600 tabular-nums">
                {row.value}
              </span>
            </div>
            <span className="mt-1 block h-1 rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full bg-slate-400"
                style={{ width: `${(row.value / max) * 100}%` }}
              />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Footnote({
  unknown,
  undated,
}: {
  unknown: string[];
  undated: number;
}) {
  if (unknown.length === 0 && undated === 0) return null;
  return (
    <p className="border-t border-slate-200 px-4 py-3 text-[11px] leading-5 text-slate-500 sm:px-5">
      {unknown.length > 0
        ? `Skipped flights with unknown airports: ${unknown.slice(0, 8).join(", ")}${
            unknown.length > 8 ? ` and ${unknown.length - 8} more` : ""
          }. `
        : ""}
      {undated > 0
        ? `${plural(undated, "undated flight")} only count toward All time.`
        : ""}
    </p>
  );
}

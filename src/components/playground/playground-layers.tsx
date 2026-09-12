"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  AircraftTrail,
  FlightAirport,
  FlightFlow,
  FlightMultiRoute,
  FlightNetwork,
  FlightRange,
  FlightRoute,
  FlightRouteLabel,
  FlightTracker,
  generateArcCoordinates,
} from "@/registry/flight";
import { resolveAirport } from "@/registry/flight-airports-utils";
import { AirportCodeInput, AirportField } from "./playground-airport-inputs";
import {
  ColorRow,
  FixedColorRow,
  SegmentedRow,
  SliderRow,
  TextRow,
  ToggleRow,
} from "./playground-inputs";
import { Plus, X } from "lucide-react";

type LineStyle = "solid" | "dash" | "dot";

export type LayerRenderContext = {
  /** false when the visitor prefers reduced motion */
  allowMotion: boolean;
  /** true when the preview map uses the dark basemap */
  isDarkMap: boolean;
};

/* ------------------------------------------------------------------ */
/* Layer prop shapes                                                   */
/* ------------------------------------------------------------------ */

export type RouteLayerProps = {
  from: string;
  to: string;
  tripType: "one-way" | "round-trip";
  showAirports: boolean;
  showLabel: boolean;
  aircraftMode: "animated" | "manual" | "off";
  duration: number;
  progress: number;
  iconSize: number;
  width: number;
  opacity: number;
  lineStyle: LineStyle;
  /** "" = auto (theme default) */
  color: string;
};

export type MultiRouteLayerProps = {
  waypoints: string[];
  showAirports: boolean;
  showLabel: boolean;
  animate: boolean;
  duration: number;
  lineStyle: LineStyle;
  color: string;
};

export type TrackerLayerProps = {
  from: string;
  to: string;
  progress: number;
  completedColor: string;
  remainingColor: string;
  width: number;
  showAirports: boolean;
  showLabel: boolean;
  showInfo: boolean;
  altitude: number;
  speed: number;
  iconSize: number;
};

export type RouteLabelLayerProps = {
  from: string;
  to: string;
  label: string;
  mode: "route" | "aircraft";
  size: "sm" | "md" | "lg";
  position: number;
  animate: boolean;
  duration: number;
};

export type WeightedRoute = { from: string; to: string; value: number };

export type NetworkLayerProps = {
  routes: WeightedRoute[];
  color: string;
  highlightColor: string;
  showLabels: boolean;
};

export type FlowLayerProps = {
  routes: WeightedRoute[];
  color: string;
  showRoutes: boolean;
  aircraftCount: number;
  aircraftSize: number;
  duration: number;
};

export type RangeLayerProps = {
  origin: string;
  maxDistance: number;
  outlineWidth: number;
  showOrigin: boolean;
  showLabel: boolean;
};

export type TrailLayerProps = {
  /** "sample" renders the built-in descent track; "draw" uses drawnPoints. */
  pathMode: "sample" | "draw";
  /** Waypoints clicked on the map ([longitude, latitude], may be unwrapped). */
  drawnPoints: [number, number][];
  /** True while map clicks are being captured as new waypoints. */
  drawing: boolean;
  /** Animate the aircraft along the path (loops). */
  playing: boolean;
  /** Playback position 0-1 when not playing; 1 shows the full trail. */
  progress: number;
  /** Playback loop duration in milliseconds. */
  duration: number;
  altitudePalette: "none" | "aviation" | "warm";
  color: string;
  width: number;
  endOpacity: number;
  showGlow: boolean;
  showAircraft: boolean;
  iconSize: number;
};

export type AirportLayerProps = {
  code: string;
  showLabel: boolean;
  labelPosition: "top" | "bottom";
};

export type PlaygroundLayer =
  | {
      id: string;
      type: "flight-route";
      visible: boolean;
      props: RouteLayerProps;
    }
  | {
      id: string;
      type: "flight-multi-route";
      visible: boolean;
      props: MultiRouteLayerProps;
    }
  | {
      id: string;
      type: "flight-tracker";
      visible: boolean;
      props: TrackerLayerProps;
    }
  | {
      id: string;
      type: "flight-route-label";
      visible: boolean;
      props: RouteLabelLayerProps;
    }
  | {
      id: string;
      type: "flight-network";
      visible: boolean;
      props: NetworkLayerProps;
    }
  | { id: string; type: "flight-flow"; visible: boolean; props: FlowLayerProps }
  | {
      id: string;
      type: "flight-range";
      visible: boolean;
      props: RangeLayerProps;
    }
  | {
      id: string;
      type: "aircraft-trail";
      visible: boolean;
      props: TrailLayerProps;
    }
  | {
      id: string;
      type: "flight-airport";
      visible: boolean;
      props: AirportLayerProps;
    };

export type PlaygroundLayerType = PlaygroundLayer["type"];

/* ------------------------------------------------------------------ */
/* Palette + defaults                                                  */
/* ------------------------------------------------------------------ */

export const LAYER_PALETTE: {
  type: PlaygroundLayerType;
  name: string;
  description: string;
}[] = [
  {
    type: "flight-route",
    name: "FlightRoute",
    description: "Single route with optional flight animation",
  },
  {
    type: "flight-multi-route",
    name: "FlightMultiRoute",
    description: "Multi-leg journey through waypoints",
  },
  {
    type: "flight-tracker",
    name: "FlightTracker",
    description: "Live-style progress with an info card",
  },
  {
    type: "flight-route-label",
    name: "FlightRouteLabel",
    description: "Text annotation on a route or aircraft",
  },
  {
    type: "flight-network",
    name: "FlightNetwork",
    description: "Weighted hub network with highlighting",
  },
  {
    type: "flight-flow",
    name: "FlightFlow",
    description: "Animated traffic across many routes",
  },
  {
    type: "flight-range",
    name: "FlightRange",
    description: "Distance range bands around an airport",
  },
  {
    type: "aircraft-trail",
    name: "AircraftTrail",
    description: "Flown track colored by altitude",
  },
  {
    type: "flight-airport",
    name: "FlightAirport",
    description: "Standalone airport marker",
  },
];

const TRAIL_POSITIONS = [
  { longitude: 139.78, latitude: 35.55, altitude: 200 },
  { longitude: 138.7, latitude: 34.72, altitude: 7200 },
  { longitude: 137.2, latitude: 33.85, altitude: 14800 },
  { longitude: 135.4, latitude: 32.95, altitude: 23600 },
  { longitude: 133.5, latitude: 32.08, altitude: 31800 },
  { longitude: 131.5, latitude: 31.2, altitude: 37000 },
  { longitude: 129.5, latitude: 30.25, altitude: 39000 },
  { longitude: 128.6, latitude: 29.55, altitude: 38500 },
  { longitude: 127.95, latitude: 28.85, altitude: 35000 },
  { longitude: 127.45, latitude: 28.15, altitude: 31000 },
  { longitude: 126.9, latitude: 27.45, altitude: 27000 },
] as const;

const TRAIL_ALTITUDE_COLOR_PALETTES = {
  aviation: [
    { altitude: 0, color: "#22c55e" },
    { altitude: 10000, color: "#06b6d4" },
    { altitude: 24000, color: "#2563eb" },
    { altitude: 39000, color: "#7c3aed" },
  ],
  warm: [
    { altitude: 0, color: "#22c55e" },
    { altitude: 18000, color: "#f59e0b" },
    { altitude: 39000, color: "#ef4444" },
  ],
} as const;

const RANGE_BAND_PRESET = [
  { ratio: 0.25, color: "#bfdbfe", opacity: 0.08 },
  { ratio: 0.56, color: "#60a5fa", opacity: 0.055 },
  { ratio: 1, color: "#2563eb", opacity: 0.035 },
] as const;

function rangeBands(maxDistance: number) {
  return RANGE_BAND_PRESET.map((band) => ({
    distance: Math.round((band.ratio * maxDistance) / 50) * 50,
    color: band.color,
    opacity: band.opacity,
  }));
}

const DEFAULT_LAYER_PROPS: {
  [Type in PlaygroundLayerType]: Extract<
    PlaygroundLayer,
    { type: Type }
  >["props"];
} = {
  "flight-route": {
    from: "TPE",
    to: "HND",
    tripType: "one-way",
    showAirports: true,
    showLabel: true,
    aircraftMode: "animated",
    duration: 6000,
    progress: 0.6,
    iconSize: 24,
    width: 2,
    opacity: 0.7,
    lineStyle: "solid",
    color: "",
  },
  "flight-multi-route": {
    waypoints: ["TPE", "DXB", "ZRH", "JFK"],
    showAirports: true,
    showLabel: true,
    animate: true,
    duration: 9000,
    lineStyle: "solid",
    color: "",
  },
  "flight-tracker": {
    from: "TPE",
    to: "LAX",
    progress: 0.62,
    completedColor: "#0f172a",
    remainingColor: "#94a3b8",
    width: 3,
    showAirports: true,
    showLabel: true,
    showInfo: true,
    altitude: 36000,
    speed: 880,
    iconSize: 26,
  },
  "flight-route-label": {
    from: "TPE",
    to: "HND",
    label: "CI 220",
    mode: "route",
    size: "md",
    position: 0.5,
    animate: true,
    duration: 7200,
  },
  "flight-network": {
    routes: [
      { from: "TPE", to: "HND", value: 18 },
      { from: "TPE", to: "SIN", value: 11 },
      { from: "TPE", to: "BKK", value: 8 },
      { from: "TPE", to: "HKG", value: 14 },
    ],
    color: "#64748b",
    highlightColor: "#0f172a",
    showLabels: true,
  },
  "flight-flow": {
    routes: [
      { from: "HND", to: "TPE", value: 14 },
      { from: "ICN", to: "TPE", value: 8 },
      { from: "HKG", to: "TPE", value: 11 },
      { from: "BKK", to: "TPE", value: 7 },
    ],
    color: "#f59e0b",
    showRoutes: true,
    aircraftCount: 24,
    aircraftSize: 18,
    duration: 12000,
  },
  "flight-range": {
    origin: "TPE",
    maxDistance: 3200,
    outlineWidth: 1.5,
    showOrigin: true,
    showLabel: true,
  },
  "aircraft-trail": {
    pathMode: "sample",
    drawnPoints: [],
    drawing: false,
    playing: false,
    progress: 1,
    duration: 8000,
    altitudePalette: "aviation",
    color: "#0f172a",
    width: 2.5,
    endOpacity: 1,
    showGlow: true,
    showAircraft: true,
    iconSize: 24,
  },
  "flight-airport": {
    code: "TPE",
    showLabel: true,
    labelPosition: "top",
  },
};

let layerCounter = 0;

export function createLayer(type: PlaygroundLayerType): PlaygroundLayer {
  layerCounter += 1;
  return {
    id: `layer-${Date.now().toString(36)}-${layerCounter}`,
    type,
    visible: true,
    props: structuredClone(DEFAULT_LAYER_PROPS[type]),
  } as PlaygroundLayer;
}

export function duplicateLayer(layer: PlaygroundLayer): PlaygroundLayer {
  layerCounter += 1;
  return {
    ...layer,
    id: `layer-${Date.now().toString(36)}-${layerCounter}`,
    props: structuredClone(layer.props),
  } as PlaygroundLayer;
}

export function layerName(type: PlaygroundLayerType): string {
  return LAYER_PALETTE.find((entry) => entry.type === type)?.name ?? type;
}

export function layerSummary(layer: PlaygroundLayer): string {
  switch (layer.type) {
    case "flight-route":
      return `${layer.props.from} → ${layer.props.to}`;
    case "flight-multi-route":
      return layer.props.waypoints.join(" → ");
    case "flight-tracker":
      return `${layer.props.from} → ${layer.props.to} · ${Math.round(layer.props.progress * 100)}%`;
    case "flight-route-label":
      return `${layer.props.from} → ${layer.props.to} · "${layer.props.label}"`;
    case "flight-network":
      return `${layer.props.routes.length} routes`;
    case "flight-flow":
      return `${layer.props.routes.length} routes · ${layer.props.aircraftCount} aircraft`;
    case "flight-range":
      return `${layer.props.origin} · ${layer.props.maxDistance.toLocaleString("en-US")} km`;
    case "aircraft-trail":
      return layer.props.pathMode === "draw"
        ? `${layer.props.drawnPoints.length} drawn points`
        : "HND descent sample";
    case "flight-airport":
      return layer.props.code;
  }
}

/* ------------------------------------------------------------------ */
/* Map rendering                                                       */
/* ------------------------------------------------------------------ */

function themedMarker(isDarkMap: boolean) {
  return (
    <div
      className={
        isDarkMap
          ? "relative h-4 w-4 rounded-full border-2 border-neutral-700 bg-neutral-100 shadow-lg"
          : "relative h-4 w-4 rounded-full border-2 border-white bg-neutral-950 shadow-lg"
      }
    />
  );
}

function themedLabelClassName(isDarkMap: boolean) {
  return isDarkMap ? "text-neutral-100" : "text-neutral-950";
}

function resolveAutoColor(color: string, isDarkMap: boolean) {
  return color || (isDarkMap ? "#e8e8e8" : "#0a0a0a");
}

export function renderLayer(
  layer: PlaygroundLayer,
  ctx: LayerRenderContext,
): ReactNode {
  if (!layer.visible) return null;
  const iconClassName = ctx.isDarkMap
    ? undefined
    : "drop-shadow-[0_1px_2px_rgba(15,23,42,0.85)]";

  switch (layer.type) {
    case "flight-route": {
      const p = layer.props;
      const animate =
        p.aircraftMode === "off"
          ? false
          : p.aircraftMode === "manual" || !ctx.allowMotion
            ? { progress: p.progress, iconSize: p.iconSize, iconClassName }
            : { duration: p.duration, iconSize: p.iconSize, iconClassName };
      return (
        <FlightRoute
          from={p.from}
          to={p.to}
          tripType={p.tripType}
          color={resolveAutoColor(p.color, ctx.isDarkMap)}
          width={p.width}
          opacity={p.opacity}
          lineStyle={p.lineStyle}
          showAirports={p.showAirports}
          showLabel={p.showLabel}
          labelClassName={themedLabelClassName(ctx.isDarkMap)}
          markerContent={themedMarker(ctx.isDarkMap)}
          animate={animate}
        />
      );
    }
    case "flight-multi-route": {
      const p = layer.props;
      return (
        <FlightMultiRoute
          waypoints={p.waypoints}
          color={resolveAutoColor(p.color, ctx.isDarkMap)}
          lineStyle={p.lineStyle}
          showAirports={p.showAirports}
          showLabel={p.showLabel}
          labelClassName={themedLabelClassName(ctx.isDarkMap)}
          markerContent={themedMarker(ctx.isDarkMap)}
          animate={
            p.animate && ctx.allowMotion
              ? { duration: p.duration, iconClassName }
              : false
          }
        />
      );
    }
    case "flight-tracker": {
      const p = layer.props;
      return (
        <FlightTracker
          from={p.from}
          to={p.to}
          progress={p.progress}
          completedColor={p.completedColor}
          remainingColor={p.remainingColor}
          width={p.width}
          showAirports={p.showAirports}
          showLabel={p.showLabel}
          showInfo={p.showInfo}
          altitude={p.altitude}
          speed={p.speed}
          iconSize={p.iconSize}
        />
      );
    }
    case "flight-route-label": {
      const p = layer.props;
      return (
        <FlightRouteLabel
          from={p.from}
          to={p.to}
          mode={p.mode}
          size={p.size}
          position={p.position}
          animate={
            p.mode === "aircraft" && p.animate && ctx.allowMotion
              ? { duration: p.duration }
              : false
          }
        >
          {p.label}
        </FlightRouteLabel>
      );
    }
    case "flight-network": {
      const p = layer.props;
      return (
        <FlightNetwork
          routes={p.routes}
          color={p.color}
          highlightColor={p.highlightColor}
          showLabels={p.showLabels}
        />
      );
    }
    case "flight-flow": {
      const p = layer.props;
      return (
        <FlightFlow
          routes={p.routes}
          color={p.color}
          showRoutes={p.showRoutes}
          aircraftCount={p.aircraftCount}
          aircraftSize={p.aircraftSize}
          duration={p.duration}
          animate={ctx.allowMotion}
        />
      );
    }
    case "flight-range": {
      const p = layer.props;
      return (
        <FlightRange
          origin={p.origin}
          ranges={rangeBands(p.maxDistance)}
          outlineWidth={p.outlineWidth}
          showOrigin={p.showOrigin}
          showLabel={p.showLabel}
        />
      );
    }
    case "aircraft-trail":
      return (
        <AircraftTrailLayerPreview
          key={layer.id}
          props={layer.props}
          ctx={ctx}
        />
      );
    case "flight-airport": {
      const p = layer.props;
      return (
        <FlightAirport
          code={p.code}
          showLabel={p.showLabel}
          labelPosition={p.labelPosition}
          labelClassName={themedLabelClassName(ctx.isDarkMap)}
          markerContent={themedMarker(ctx.isDarkMap)}
        />
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* Aircraft trail path helpers + playback preview                      */
/* ------------------------------------------------------------------ */

type TrailPathPoint = { longitude: number; latitude: number; altitude: number };

/** Climb → cruise → descend profile so altitude palettes light up drawn paths. */
function trailAltitudeProfile(t: number): number {
  const cruise = 38000;
  if (t < 0.25) return Math.round((cruise * (t / 0.25)) / 100) * 100;
  if (t > 0.8) return Math.round((cruise * ((1 - t) / 0.2)) / 100) * 100;
  return cruise;
}

function pathDistances(points: readonly [number, number][]): number[] {
  const cumulative = [0];
  for (let index = 1; index < points.length; index += 1) {
    const [lngA, latA] = points[index - 1];
    const [lngB, latB] = points[index];
    const scale = Math.max(
      0.15,
      Math.cos((((latA + latB) / 2) * Math.PI) / 180),
    );
    cumulative.push(
      cumulative[index - 1] + Math.hypot((lngB - lngA) * scale, latB - latA),
    );
  }
  return cumulative;
}

/**
 * Resample a hand-drawn polyline into evenly spaced positions with a synthetic
 * altitude profile. Even spacing keeps playback speed constant along the path.
 */
export function resampleDrawnPath(
  points: readonly [number, number][],
  samples = 120,
): TrailPathPoint[] {
  if (points.length < 2) return [];
  const cumulative = pathDistances(points);
  const total = cumulative[cumulative.length - 1];
  if (total <= Number.EPSILON) return [];

  const resampled: TrailPathPoint[] = [];
  let segment = 0;
  for (let index = 0; index < samples; index += 1) {
    const t = index / (samples - 1);
    const target = t * total;
    while (segment < points.length - 2 && cumulative[segment + 1] < target) {
      segment += 1;
    }
    const span = cumulative[segment + 1] - cumulative[segment];
    const local =
      span > Number.EPSILON ? (target - cumulative[segment]) / span : 0;
    const [lngA, latA] = points[segment];
    const [lngB, latB] = points[segment + 1];
    resampled.push({
      longitude: lngA + (lngB - lngA) * local,
      latitude: latA + (latB - latA) * local,
      altitude: trailAltitudeProfile(t),
    });
  }
  return resampled;
}

/** Split a path at playback progress into flown and planned (dashed) parts. */
function splitTrailPath(
  path: readonly TrailPathPoint[],
  progress: number,
): { flown: TrailPathPoint[]; planned: TrailPathPoint[] } {
  if (path.length < 2) return { flown: [...path], planned: [] };
  const clamped = Math.max(0, Math.min(1, progress));
  if (clamped >= 1) return { flown: [...path], planned: [] };

  const scaled = clamped * (path.length - 1);
  const index = Math.min(Math.floor(scaled), path.length - 2);
  const local = scaled - index;
  const current = path[index];
  const next = path[index + 1];
  const head: TrailPathPoint = {
    longitude: current.longitude + (next.longitude - current.longitude) * local,
    latitude: current.latitude + (next.latitude - current.latitude) * local,
    altitude: current.altitude + (next.altitude - current.altitude) * local,
  };
  return {
    flown: [...path.slice(0, index + 1), head],
    planned: [head, ...path.slice(index + 1)],
  };
}

/** Drawn waypoints as copy-paste positions: raw points + profile altitudes. */
function drawnSnippetPositions(
  points: readonly [number, number][],
): TrailPathPoint[] {
  if (points.length < 2) return [];
  const cumulative = pathDistances(points);
  const total = cumulative[cumulative.length - 1];
  return points.map((point, index) => ({
    longitude: Number(point[0].toFixed(3)),
    latitude: Number(point[1].toFixed(3)),
    altitude: trailAltitudeProfile(
      total > Number.EPSILON ? cumulative[index] / total : 0,
    ),
  }));
}

export function trailLayerPath(props: TrailLayerProps): TrailPathPoint[] {
  if (props.pathMode === "draw") {
    return resampleDrawnPath(props.drawnPoints);
  }
  return TRAIL_POSITIONS.map((position) => ({ ...position }));
}

function AircraftTrailLayerPreview({
  props: p,
  ctx,
}: {
  props: TrailLayerProps;
  ctx: LayerRenderContext;
}) {
  const path = useMemo(() => trailLayerPath(p), [p]);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const isPlaying = p.playing && ctx.allowMotion && !p.drawing;
  useEffect(() => {
    if (!isPlaying) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      setAnimatedProgress(((now - start) % p.duration) / p.duration);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, p.duration]);

  if (path.length < 1) return null;

  // While drawing, show the whole path as the dashed planned route with the
  // aircraft waiting at the start.
  const progress = p.drawing ? 0 : isPlaying ? animatedProgress : p.progress;
  const { flown, planned } = splitTrailPath(path, progress);

  // Reverse the planned path (destination → aircraft) so the dash phase is
  // anchored at the fixed destination end and the dashes stay visually
  // static while the aircraft flies, instead of crawling every frame.
  const reversedPlanned = [...planned].reverse();

  return (
    <AircraftTrail
      positions={flown.length > 0 ? flown : [path[0]]}
      plannedPositions={reversedPlanned}
      color={p.color}
      altitudeColorStops={
        p.altitudePalette === "none"
          ? undefined
          : TRAIL_ALTITUDE_COLOR_PALETTES[p.altitudePalette]
      }
      width={p.width}
      endOpacity={p.endOpacity}
      showGlow={p.showGlow}
      showAircraft={p.showAircraft}
      iconSize={p.iconSize}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Camera bounds                                                       */
/* ------------------------------------------------------------------ */

function safeArc(from: string, to: string): [number, number][] {
  try {
    return generateArcCoordinates(resolveAirport(from), resolveAirport(to), 32);
  } catch {
    return [];
  }
}

function safePoint(code: string): [number, number][] {
  try {
    return [resolveAirport(code)];
  } catch {
    return [];
  }
}

export function layerBoundsPoints(layer: PlaygroundLayer): [number, number][] {
  if (!layer.visible) return [];
  switch (layer.type) {
    case "flight-route":
      return safeArc(layer.props.from, layer.props.to);
    case "flight-multi-route": {
      const points: [number, number][] = [];
      const { waypoints } = layer.props;
      for (let index = 0; index < waypoints.length - 1; index += 1) {
        points.push(...safeArc(waypoints[index], waypoints[index + 1]));
      }
      return points;
    }
    case "flight-tracker":
    case "flight-route-label":
      return safeArc(layer.props.from, layer.props.to);
    case "flight-network":
    case "flight-flow": {
      const points: [number, number][] = [];
      for (const route of layer.props.routes) {
        points.push(...safeArc(route.from, route.to));
      }
      return points;
    }
    case "flight-range": {
      const [origin] = safePoint(layer.props.origin);
      if (!origin) return [];
      const deltaLat = layer.props.maxDistance / 111;
      const cosLat = Math.max(0.2, Math.cos((origin[1] * Math.PI) / 180));
      const deltaLng = layer.props.maxDistance / (111 * cosLat);
      return [
        [origin[0] - deltaLng, origin[1]],
        [origin[0] + deltaLng, origin[1]],
        [origin[0], Math.max(-85, origin[1] - deltaLat)],
        [origin[0], Math.min(85, origin[1] + deltaLat)],
      ];
    }
    case "aircraft-trail":
      if (layer.props.pathMode === "draw") {
        return layer.props.drawnPoints.map((point) => [point[0], point[1]]);
      }
      return TRAIL_POSITIONS.map((position) => [
        position.longitude,
        position.latitude,
      ]);
    case "flight-airport":
      return safePoint(layer.props.code);
  }
}

/* ------------------------------------------------------------------ */
/* Snippet generation                                                  */
/* ------------------------------------------------------------------ */

/** Emit `<Name\n  prop\n/>` lines from a tag name and prop strings. */
function jsxLines(
  name: string,
  props: (string | null)[],
  children?: string,
): string[] {
  const kept = props
    .filter((prop): prop is string => prop !== null)
    // Multiline props (arrays) carry embedded newlines; indent every line.
    .flatMap((prop) => prop.split("\n").map((line) => `  ${line}`));
  if (children !== undefined) {
    return [`<${name}`, ...kept, `>`, `  ${children}`, `</${name}>`];
  }
  return [`<${name}`, ...kept, `/>`];
}

function weightedRoutesLiteral(routes: readonly WeightedRoute[]): string[] {
  return [
    `routes={[`,
    ...routes.map(
      (route) =>
        `  { from: "${route.from}", to: "${route.to}", value: ${route.value} },`,
    ),
    `]}`,
  ];
}

/** Multi-line prop: returned as a single string with \n, re-indented later. */
function multilineProp(lines: string[]): string {
  return lines.join("\n");
}

export function layerSnippetLines(layer: PlaygroundLayer): string[] {
  switch (layer.type) {
    case "flight-route": {
      const p = layer.props;
      const iconSizePart = p.iconSize !== 24 ? `iconSize: ${p.iconSize}` : null;
      let animateProp: string | null = null;
      if (p.aircraftMode === "animated") {
        const parts = [
          p.duration !== 4000 ? `duration: ${p.duration}` : null,
          iconSizePart,
        ].filter(Boolean);
        animateProp =
          parts.length === 0 ? "animate" : `animate={{ ${parts.join(", ")} }}`;
      } else if (p.aircraftMode === "manual") {
        const parts = [`progress: ${p.progress}`, iconSizePart].filter(Boolean);
        animateProp = `animate={{ ${parts.join(", ")} }}`;
      }
      return jsxLines("FlightRoute", [
        `from="${p.from}"`,
        `to="${p.to}"`,
        p.tripType === "round-trip" ? `tripType="round-trip"` : null,
        p.showAirports ? "showAirports" : null,
        p.showAirports && p.showLabel ? "showLabel" : null,
        p.width !== 2 ? `width={${p.width}}` : null,
        p.opacity !== 0.7 ? `opacity={${p.opacity}}` : null,
        p.lineStyle !== "solid" ? `lineStyle="${p.lineStyle}"` : null,
        p.color ? `color="${p.color}"` : null,
        animateProp,
      ]);
    }
    case "flight-multi-route": {
      const p = layer.props;
      return jsxLines("FlightMultiRoute", [
        `waypoints={[${p.waypoints.map((waypoint) => `"${waypoint}"`).join(", ")}]}`,
        p.showAirports ? "showAirports" : null,
        p.showAirports && p.showLabel ? "showLabel" : null,
        p.lineStyle !== "solid" ? `lineStyle="${p.lineStyle}"` : null,
        p.color ? `color="${p.color}"` : null,
        p.animate ? `animate={{ duration: ${p.duration} }}` : null,
      ]);
    }
    case "flight-tracker": {
      const p = layer.props;
      return jsxLines("FlightTracker", [
        `from="${p.from}"`,
        `to="${p.to}"`,
        `progress={${p.progress}}`,
        p.completedColor !== "#0f172a"
          ? `completedColor="${p.completedColor}"`
          : null,
        p.remainingColor !== "#94a3b8"
          ? `remainingColor="${p.remainingColor}"`
          : null,
        p.width !== 3 ? `width={${p.width}}` : null,
        !p.showAirports ? "showAirports={false}" : null,
        !p.showLabel ? "showLabel={false}" : null,
        !p.showInfo ? "showInfo={false}" : null,
        p.showInfo ? `altitude={${p.altitude}}` : null,
        p.showInfo ? `speed={${p.speed}}` : null,
        p.iconSize !== 26 ? `iconSize={${p.iconSize}}` : null,
      ]);
    }
    case "flight-route-label": {
      const p = layer.props;
      return jsxLines(
        "FlightRouteLabel",
        [
          `from="${p.from}"`,
          `to="${p.to}"`,
          p.mode !== "route" ? `mode="${p.mode}"` : null,
          p.size !== "md" ? `size="${p.size}"` : null,
          p.position !== 0.5 ? `position={${p.position}}` : null,
          p.mode === "aircraft" && p.animate
            ? `animate={{ duration: ${p.duration} }}`
            : null,
        ],
        p.label,
      );
    }
    case "flight-network": {
      const p = layer.props;
      return jsxLines("FlightNetwork", [
        multilineProp(weightedRoutesLiteral(p.routes)),
        p.color !== "#64748b" ? `color="${p.color}"` : null,
        p.highlightColor !== "#0f172a"
          ? `highlightColor="${p.highlightColor}"`
          : null,
        !p.showLabels ? "showLabels={false}" : null,
      ]);
    }
    case "flight-flow": {
      const p = layer.props;
      return jsxLines("FlightFlow", [
        multilineProp(weightedRoutesLiteral(p.routes)),
        p.color !== "#f59e0b" ? `color="${p.color}"` : null,
        p.showRoutes ? "showRoutes" : null,
        p.aircraftCount !== 24 ? `aircraftCount={${p.aircraftCount}}` : null,
        p.aircraftSize !== 18 ? `aircraftSize={${p.aircraftSize}}` : null,
        p.duration !== 12000 ? `duration={${p.duration}}` : null,
      ]);
    }
    case "flight-range": {
      const p = layer.props;
      const bands = rangeBands(p.maxDistance);
      return jsxLines("FlightRange", [
        `origin="${p.origin}"`,
        multilineProp([
          `ranges={[`,
          ...bands.map(
            (band) =>
              `  { distance: ${band.distance}, color: "${band.color}", opacity: ${band.opacity} },`,
          ),
          `]}`,
        ]),
        p.outlineWidth !== 1.5 ? `outlineWidth={${p.outlineWidth}}` : null,
        !p.showOrigin ? "showOrigin={false}" : null,
        !p.showLabel ? "showLabel={false}" : null,
      ]);
    }
    case "aircraft-trail": {
      const p = layer.props;
      const snippetPositions =
        p.pathMode === "draw"
          ? drawnSnippetPositions(p.drawnPoints)
          : TRAIL_POSITIONS;
      return jsxLines("AircraftTrail", [
        multilineProp([
          `positions={[`,
          ...snippetPositions.map(
            (position) =>
              `  { longitude: ${position.longitude}, latitude: ${position.latitude}, altitude: ${position.altitude} },`,
          ),
          `]}`,
        ]),
        p.altitudePalette !== "none"
          ? multilineProp([
              `altitudeColorStops={[`,
              ...TRAIL_ALTITUDE_COLOR_PALETTES[p.altitudePalette].map(
                (stop) =>
                  `  { altitude: ${stop.altitude}, color: "${stop.color}" },`,
              ),
              `]}`,
            ])
          : p.color !== "#0f172a"
            ? `color="${p.color}"`
            : null,
        p.width !== 2.5 ? `width={${p.width}}` : null,
        p.endOpacity !== 1 ? `endOpacity={${p.endOpacity}}` : null,
        !p.showGlow ? "showGlow={false}" : null,
        !p.showAircraft ? "showAircraft={false}" : null,
        p.iconSize !== 24 ? `iconSize={${p.iconSize}}` : null,
      ]);
    }
    case "flight-airport": {
      const p = layer.props;
      return jsxLines("FlightAirport", [
        `code="${p.code}"`,
        p.showLabel ? "showLabel" : null,
        p.labelPosition !== "top" ? `labelPosition="${p.labelPosition}"` : null,
      ]);
    }
  }
}

export function layerComponentName(layer: PlaygroundLayer): string {
  return layerName(layer.type);
}

/* ------------------------------------------------------------------ */
/* Per-layer controls                                                  */
/* ------------------------------------------------------------------ */

function WeightedRoutesEditor({
  routes,
  onChange,
}: {
  routes: WeightedRoute[];
  onChange: (routes: WeightedRoute[]) => void;
}) {
  const updateRoute = (index: number, next: Partial<WeightedRoute>) => {
    onChange(
      routes.map((route, routeIndex) =>
        routeIndex === index ? { ...route, ...next } : route,
      ),
    );
  };

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1fr_1fr_3.5rem_1.5rem] gap-1.5 text-[10px] font-medium text-slate-400">
        <span>From</span>
        <span>To</span>
        <span>Value</span>
        <span />
      </div>
      {routes.map((route, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_1fr_3.5rem_1.5rem] items-center gap-1.5"
        >
          <AirportCodeInput
            value={route.from}
            ariaLabel={`Route ${index + 1} origin`}
            onChange={(code) => updateRoute(index, { from: code })}
            className="w-full !px-2 !py-1 !text-xs"
          />
          <AirportCodeInput
            value={route.to}
            ariaLabel={`Route ${index + 1} destination`}
            onChange={(code) => updateRoute(index, { to: code })}
            className="w-full !px-2 !py-1 !text-xs"
          />
          <input
            type="number"
            min={1}
            max={99}
            value={route.value}
            aria-label={`Route ${index + 1} value`}
            onChange={(event) =>
              updateRoute(index, {
                value: Math.max(1, Number(event.currentTarget.value) || 1),
              })
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-950"
          />
          <button
            type="button"
            aria-label={`Remove route ${index + 1}`}
            disabled={routes.length <= 2}
            onClick={() =>
              onChange(routes.filter((_, routeIndex) => routeIndex !== index))
            }
            className="pressable flex size-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={routes.length >= 8}
        onClick={() =>
          onChange([...routes, { from: "TPE", to: "NRT", value: 5 }])
        }
        className="pressable inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus size={12} /> Add route
      </button>
    </div>
  );
}

export function LayerControls({
  layer,
  onChange,
}: {
  layer: PlaygroundLayer;
  onChange: (layer: PlaygroundLayer) => void;
}) {
  switch (layer.type) {
    case "flight-route": {
      const p = layer.props;
      const set = (next: Partial<RouteLayerProps>) =>
        onChange({ ...layer, props: { ...p, ...next } });
      return (
        <div className="space-y-2.5">
          <div className="flex items-start gap-2">
            <AirportField
              label="From"
              value={p.from}
              blockedCodes={[p.to]}
              onChange={(code) => set({ from: code })}
            />
            <AirportField
              label="To"
              value={p.to}
              blockedCodes={[p.from]}
              onChange={(code) => set({ to: code })}
            />
          </div>
          <SegmentedRow
            label="Trip Type"
            value={p.tripType}
            options={["one-way", "round-trip"]}
            onChange={(tripType) => set({ tripType })}
          />
          <ToggleRow
            label="Show Airports"
            checked={p.showAirports}
            onChange={(showAirports) => set({ showAirports })}
          />
          <ToggleRow
            label="Show Labels"
            checked={p.showLabel}
            disabled={!p.showAirports}
            onChange={(showLabel) => set({ showLabel })}
          />
          <SegmentedRow
            label="Aircraft"
            value={p.aircraftMode}
            options={["animated", "manual", "off"]}
            onChange={(aircraftMode) => set({ aircraftMode })}
          />
          <SliderRow
            label="Duration (ms)"
            value={p.duration}
            min={1000}
            max={20000}
            step={500}
            disabled={p.aircraftMode !== "animated"}
            onChange={(duration) => set({ duration })}
          />
          <SliderRow
            label="Progress"
            value={p.progress}
            min={0}
            max={1}
            step={0.01}
            disabled={p.aircraftMode !== "manual"}
            format={(progress) => `${Math.round(progress * 100)}%`}
            onChange={(progress) => set({ progress })}
          />
          <SliderRow
            label="Width"
            value={p.width}
            min={0.5}
            max={8}
            step={0.5}
            onChange={(width) => set({ width })}
          />
          <SliderRow
            label="Opacity"
            value={p.opacity}
            min={0.1}
            max={1}
            step={0.05}
            format={(opacity) => opacity.toFixed(2)}
            onChange={(opacity) => set({ opacity })}
          />
          <SegmentedRow
            label="Line Style"
            value={p.lineStyle}
            options={["solid", "dash", "dot"]}
            onChange={(lineStyle) => set({ lineStyle })}
          />
          <ColorRow
            label="Color"
            value={p.color}
            onChange={(color) => set({ color })}
          />
        </div>
      );
    }
    case "flight-multi-route": {
      const p = layer.props;
      const set = (next: Partial<MultiRouteLayerProps>) =>
        onChange({ ...layer, props: { ...p, ...next } });
      return (
        <div className="space-y-2.5">
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium text-slate-400">
              Waypoints
            </span>
            {p.waypoints.map((waypoint, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="w-4 font-mono text-[10px] text-slate-400">
                  {index + 1}
                </span>
                <AirportCodeInput
                  value={waypoint}
                  ariaLabel={`Waypoint ${index + 1}`}
                  blockedCodes={[
                    p.waypoints[index - 1],
                    p.waypoints[index + 1],
                  ].filter(Boolean)}
                  onChange={(code) =>
                    set({
                      waypoints: p.waypoints.map((existing, waypointIndex) =>
                        waypointIndex === index ? code : existing,
                      ),
                    })
                  }
                  className="flex-1 !py-1"
                />
                <button
                  type="button"
                  aria-label={`Remove waypoint ${index + 1}`}
                  disabled={p.waypoints.length <= 2}
                  onClick={() =>
                    set({
                      waypoints: p.waypoints.filter(
                        (_, waypointIndex) => waypointIndex !== index,
                      ),
                    })
                  }
                  className="pressable flex size-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={p.waypoints.length >= 6}
              onClick={() => set({ waypoints: [...p.waypoints, "HND"] })}
              className="pressable inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus size={12} /> Add waypoint
            </button>
          </div>
          <ToggleRow
            label="Show Airports"
            checked={p.showAirports}
            onChange={(showAirports) => set({ showAirports })}
          />
          <ToggleRow
            label="Show Labels"
            checked={p.showLabel}
            disabled={!p.showAirports}
            onChange={(showLabel) => set({ showLabel })}
          />
          <ToggleRow
            label="Animate"
            checked={p.animate}
            onChange={(animate) => set({ animate })}
          />
          <SliderRow
            label="Duration (ms)"
            value={p.duration}
            min={2000}
            max={30000}
            step={500}
            disabled={!p.animate}
            onChange={(duration) => set({ duration })}
          />
          <SegmentedRow
            label="Line Style"
            value={p.lineStyle}
            options={["solid", "dash", "dot"]}
            onChange={(lineStyle) => set({ lineStyle })}
          />
          <ColorRow
            label="Color"
            value={p.color}
            onChange={(color) => set({ color })}
          />
        </div>
      );
    }
    case "flight-tracker": {
      const p = layer.props;
      const set = (next: Partial<TrackerLayerProps>) =>
        onChange({ ...layer, props: { ...p, ...next } });
      return (
        <div className="space-y-2.5">
          <div className="flex items-start gap-2">
            <AirportField
              label="From"
              value={p.from}
              blockedCodes={[p.to]}
              onChange={(code) => set({ from: code })}
            />
            <AirportField
              label="To"
              value={p.to}
              blockedCodes={[p.from]}
              onChange={(code) => set({ to: code })}
            />
          </div>
          <SliderRow
            label="Progress"
            value={p.progress}
            min={0}
            max={1}
            step={0.01}
            format={(progress) => `${Math.round(progress * 100)}%`}
            onChange={(progress) => set({ progress })}
          />
          <FixedColorRow
            label="Completed"
            value={p.completedColor}
            onChange={(completedColor) => set({ completedColor })}
          />
          <FixedColorRow
            label="Remaining"
            value={p.remainingColor}
            onChange={(remainingColor) => set({ remainingColor })}
          />
          <SliderRow
            label="Width"
            value={p.width}
            min={1}
            max={8}
            step={0.5}
            onChange={(width) => set({ width })}
          />
          <ToggleRow
            label="Show Airports"
            checked={p.showAirports}
            onChange={(showAirports) => set({ showAirports })}
          />
          <ToggleRow
            label="Show Labels"
            checked={p.showLabel}
            disabled={!p.showAirports}
            onChange={(showLabel) => set({ showLabel })}
          />
          <ToggleRow
            label="Info Card"
            checked={p.showInfo}
            onChange={(showInfo) => set({ showInfo })}
          />
          <SliderRow
            label="Altitude (ft)"
            value={p.altitude}
            min={0}
            max={45000}
            step={500}
            disabled={!p.showInfo}
            format={(altitude) => altitude.toLocaleString("en-US")}
            onChange={(altitude) => set({ altitude })}
          />
          <SliderRow
            label="Speed (km/h)"
            value={p.speed}
            min={0}
            max={1100}
            step={10}
            disabled={!p.showInfo}
            onChange={(speed) => set({ speed })}
          />
          <SliderRow
            label="Icon Size (px)"
            value={p.iconSize}
            min={12}
            max={48}
            step={2}
            onChange={(iconSize) => set({ iconSize })}
          />
        </div>
      );
    }
    case "flight-route-label": {
      const p = layer.props;
      const set = (next: Partial<RouteLabelLayerProps>) =>
        onChange({ ...layer, props: { ...p, ...next } });
      return (
        <div className="space-y-2.5">
          <div className="flex items-start gap-2">
            <AirportField
              label="From"
              value={p.from}
              blockedCodes={[p.to]}
              onChange={(code) => set({ from: code })}
            />
            <AirportField
              label="To"
              value={p.to}
              blockedCodes={[p.from]}
              onChange={(code) => set({ to: code })}
            />
          </div>
          <TextRow
            label="Label"
            value={p.label}
            placeholder="CI 220"
            onChange={(label) => set({ label })}
          />
          <SegmentedRow
            label="Mode"
            value={p.mode}
            options={["route", "aircraft"]}
            onChange={(mode) => set({ mode })}
          />
          <SegmentedRow
            label="Size"
            value={p.size}
            options={["sm", "md", "lg"]}
            onChange={(size) => set({ size })}
          />
          <SliderRow
            label="Position"
            value={p.position}
            min={0}
            max={1}
            step={0.01}
            format={(position) => `${Math.round(position * 100)}%`}
            onChange={(position) => set({ position })}
          />
          <ToggleRow
            label="Animate"
            checked={p.animate}
            disabled={p.mode !== "aircraft"}
            onChange={(animate) => set({ animate })}
          />
          <SliderRow
            label="Duration (ms)"
            value={p.duration}
            min={2000}
            max={20000}
            step={400}
            disabled={p.mode !== "aircraft" || !p.animate}
            onChange={(duration) => set({ duration })}
          />
        </div>
      );
    }
    case "flight-network": {
      const p = layer.props;
      const set = (next: Partial<NetworkLayerProps>) =>
        onChange({ ...layer, props: { ...p, ...next } });
      return (
        <div className="space-y-2.5">
          <WeightedRoutesEditor
            routes={p.routes}
            onChange={(routes) => set({ routes })}
          />
          <FixedColorRow
            label="Route Color"
            value={p.color}
            onChange={(color) => set({ color })}
          />
          <FixedColorRow
            label="Highlight"
            value={p.highlightColor}
            onChange={(highlightColor) => set({ highlightColor })}
          />
          <ToggleRow
            label="Show Labels"
            checked={p.showLabels}
            onChange={(showLabels) => set({ showLabels })}
          />
          <p className="text-[10px] leading-4 text-slate-400">
            Hover an airport node on the map to highlight its routes.
          </p>
        </div>
      );
    }
    case "flight-flow": {
      const p = layer.props;
      const set = (next: Partial<FlowLayerProps>) =>
        onChange({ ...layer, props: { ...p, ...next } });
      return (
        <div className="space-y-2.5">
          <WeightedRoutesEditor
            routes={p.routes}
            onChange={(routes) => set({ routes })}
          />
          <FixedColorRow
            label="Aircraft Color"
            value={p.color}
            onChange={(color) => set({ color })}
          />
          <ToggleRow
            label="Show Routes"
            checked={p.showRoutes}
            onChange={(showRoutes) => set({ showRoutes })}
          />
          <SliderRow
            label="Aircraft Count"
            value={p.aircraftCount}
            min={4}
            max={80}
            step={2}
            onChange={(aircraftCount) => set({ aircraftCount })}
          />
          <SliderRow
            label="Aircraft Size (px)"
            value={p.aircraftSize}
            min={8}
            max={36}
            step={2}
            onChange={(aircraftSize) => set({ aircraftSize })}
          />
          <SliderRow
            label="Duration (ms)"
            value={p.duration}
            min={4000}
            max={30000}
            step={1000}
            onChange={(duration) => set({ duration })}
          />
        </div>
      );
    }
    case "flight-range": {
      const p = layer.props;
      const set = (next: Partial<RangeLayerProps>) =>
        onChange({ ...layer, props: { ...p, ...next } });
      return (
        <div className="space-y-2.5">
          <div className="flex items-start gap-2">
            <AirportField
              label="Origin"
              value={p.origin}
              onChange={(code) => set({ origin: code })}
            />
          </div>
          <SliderRow
            label="Max Range (km)"
            value={p.maxDistance}
            min={500}
            max={12000}
            step={100}
            format={(distance) => distance.toLocaleString("en-US")}
            onChange={(maxDistance) => set({ maxDistance })}
          />
          <SliderRow
            label="Outline Width"
            value={p.outlineWidth}
            min={0.5}
            max={5}
            step={0.5}
            onChange={(outlineWidth) => set({ outlineWidth })}
          />
          <ToggleRow
            label="Show Origin"
            checked={p.showOrigin}
            onChange={(showOrigin) => set({ showOrigin })}
          />
          <ToggleRow
            label="Show Labels"
            checked={p.showLabel}
            onChange={(showLabel) => set({ showLabel })}
          />
        </div>
      );
    }
    case "aircraft-trail": {
      const p = layer.props;
      const set = (next: Partial<TrailLayerProps>) =>
        onChange({ ...layer, props: { ...p, ...next } });
      return (
        <div className="space-y-2.5">
          <SegmentedRow
            label="Path"
            value={p.pathMode}
            options={["sample", "draw"]}
            onChange={(pathMode) =>
              set({
                pathMode,
                // Arm drawing right away when switching to an empty canvas.
                drawing: pathMode === "draw" && p.drawnPoints.length < 2,
              })
            }
          />
          {p.pathMode === "draw" ? (
            <>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-pressed={p.drawing}
                  onClick={() =>
                    set(
                      p.drawing
                        ? {
                            drawing: false,
                            // Fly the freshly drawn route right away.
                            playing: p.drawnPoints.length >= 2,
                          }
                        : { drawing: true, playing: false },
                    )
                  }
                  className={`pressable rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                    p.drawing
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p.drawing ? "Finish drawing" : "Draw on map"}
                </button>
                <button
                  type="button"
                  disabled={p.drawnPoints.length === 0}
                  onClick={() =>
                    set({ drawnPoints: p.drawnPoints.slice(0, -1) })
                  }
                  className="pressable rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"
                >
                  Undo
                </button>
                <button
                  type="button"
                  disabled={p.drawnPoints.length === 0}
                  onClick={() =>
                    set({ drawnPoints: [], drawing: true, playing: false })
                  }
                  className="pressable rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
              <p className="text-[10px] leading-4 text-slate-400">
                {p.drawing
                  ? "Click the map to add waypoints — the route previews as a dashed line. Finish to fly it."
                  : `${p.drawnPoints.length} waypoints drawn.`}
              </p>
            </>
          ) : (
            <p className="text-[10px] leading-4 text-slate-400">
              Sample descent track into HND — switch Path to “draw” to sketch
              your own route on the map.
            </p>
          )}
          <ToggleRow
            label="Fly the Route"
            checked={p.playing}
            disabled={p.drawing}
            onChange={(playing) => set({ playing })}
          />
          <SliderRow
            label="Flight Duration (ms)"
            value={p.duration}
            min={2000}
            max={30000}
            step={500}
            disabled={!p.playing || p.drawing}
            onChange={(duration) => set({ duration })}
          />
          <SliderRow
            label="Progress"
            value={p.progress}
            min={0}
            max={1}
            step={0.01}
            disabled={p.playing || p.drawing}
            format={(progress) => `${Math.round(progress * 100)}%`}
            onChange={(progress) => set({ progress })}
          />
          <SegmentedRow
            label="Altitude Palette"
            value={p.altitudePalette}
            options={["none", "aviation", "warm"]}
            onChange={(altitudePalette) => set({ altitudePalette })}
          />
          <FixedColorRow
            label="Color"
            value={p.color}
            onChange={(color) => set({ color })}
          />
          <SliderRow
            label="Width"
            value={p.width}
            min={1}
            max={8}
            step={0.5}
            onChange={(width) => set({ width })}
          />
          <SliderRow
            label="End Opacity"
            value={p.endOpacity}
            min={0.2}
            max={1}
            step={0.05}
            format={(endOpacity) => endOpacity.toFixed(2)}
            onChange={(endOpacity) => set({ endOpacity })}
          />
          <ToggleRow
            label="Glow"
            checked={p.showGlow}
            onChange={(showGlow) => set({ showGlow })}
          />
          <ToggleRow
            label="Show Aircraft"
            checked={p.showAircraft}
            onChange={(showAircraft) => set({ showAircraft })}
          />
          <SliderRow
            label="Icon Size (px)"
            value={p.iconSize}
            min={12}
            max={48}
            step={2}
            onChange={(iconSize) => set({ iconSize })}
          />
        </div>
      );
    }
    case "flight-airport": {
      const p = layer.props;
      const set = (next: Partial<AirportLayerProps>) =>
        onChange({ ...layer, props: { ...p, ...next } });
      return (
        <div className="space-y-2.5">
          <div className="flex items-start gap-2">
            <AirportField
              label="Airport"
              value={p.code}
              onChange={(code) => set({ code })}
            />
          </div>
          <ToggleRow
            label="Show Label"
            checked={p.showLabel}
            onChange={(showLabel) => set({ showLabel })}
          />
          <SegmentedRow
            label="Label Position"
            value={p.labelPosition}
            options={["top", "bottom"]}
            disabled={!p.showLabel}
            onChange={(labelPosition) => set({ labelPosition })}
          />
        </div>
      );
    }
  }
}

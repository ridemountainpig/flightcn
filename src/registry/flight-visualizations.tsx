"use client";

import bearing from "@turf/bearing";
import greatCircle from "@turf/great-circle";
import MapLibreGL from "maplibre-gl";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  MapMarker,
  MarkerContent,
  MarkerLabel,
  useMap,
} from "@/components/ui/map";

import type { AirportRef } from "./flight-airports";
import { resolveAirport } from "./flight-airports-utils";

type Coordinates = [number, number];
type RouteGeometry =
  | { type: "LineString"; coordinates: Coordinates[] }
  | { type: "MultiLineString"; coordinates: Coordinates[][] };

type GeoJsonFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry:
    | RouteGeometry
    | { type: "Point"; coordinates: Coordinates }
    | { type: "Polygon"; coordinates: Coordinates[][] };
};

type GeoJsonCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

type OverlayLayer = {
  id: string;
  source: string;
  type: "line" | "circle" | "symbol" | "fill";
  minzoom?: number;
  maxzoom?: number;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
  filter?: MapLibreGL.FilterSpecification;
};

type OverlayImageResource = {
  id: string;
  signature: string;
  create: () => ImageData;
  pixelRatio?: number;
};

const EMPTY_COLLECTION: GeoJsonCollection = {
  type: "FeatureCollection",
  features: [],
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function colorWithAlpha(color: string, alpha: number) {
  const normalized = color.trim();
  const shortHex = /^#([\da-f])([\da-f])([\da-f])$/i.exec(normalized);
  const longHex = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(normalized);
  const channels = shortHex
    ? shortHex.slice(1).map((channel) => Number.parseInt(channel + channel, 16))
    : longHex
      ? longHex.slice(1).map((channel) => Number.parseInt(channel, 16))
      : [15, 23, 42];
  return `rgba(${channels[0]},${channels[1]},${channels[2]},${clamp(alpha)})`;
}

function normalizeLongitude(longitude: number) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function resolveRef(ref: AirportRef): Coordinates | null {
  try {
    return resolveAirport(ref);
  } catch (error) {
    console.warn(error);
    return null;
  }
}

function normalizeRefKey(ref: AirportRef) {
  return typeof ref === "string"
    ? `code:${ref.toUpperCase()}`
    : `coordinate:${ref[0]},${ref[1]}`;
}

function resolveRefKey(key: string): Coordinates | null {
  if (key.startsWith("code:")) return resolveRef(key.slice(5));
  const [longitude, latitude] = key.slice(11).split(",").map(Number);
  return resolveRef([longitude, latitude]);
}

function routeLabel(ref: AirportRef) {
  if (typeof ref === "string") return ref.toUpperCase();
  return `${ref[1].toFixed(2)}°, ${ref[0].toFixed(2)}°`;
}

function makeArcGeometry(
  from: Coordinates,
  to: Coordinates,
  npoints = 100,
): RouteGeometry {
  if (from[0] === to[0] && from[1] === to[1]) {
    return { type: "LineString", coordinates: [from, to] };
  }

  try {
    const geometry = greatCircle(from, to, { npoints }).geometry;
    if (geometry.type === "MultiLineString") {
      return {
        type: "MultiLineString",
        coordinates: geometry.coordinates as Coordinates[][],
      };
    }
    return {
      type: "LineString",
      coordinates: geometry.coordinates as Coordinates[],
    };
  } catch {
    return { type: "LineString", coordinates: [from, to] };
  }
}

function flattenGeometry(geometry: RouteGeometry): Coordinates[] {
  const segments =
    geometry.type === "LineString"
      ? [geometry.coordinates]
      : geometry.coordinates;
  const result: Coordinates[] = [];

  for (const segment of segments) {
    for (const coordinate of segment) {
      if (result.length === 0) {
        result.push(coordinate);
        continue;
      }

      const previous = result[result.length - 1];
      let longitude = coordinate[0];
      while (longitude - previous[0] > 180) longitude -= 360;
      while (longitude - previous[0] < -180) longitude += 360;
      result.push([longitude, coordinate[1]]);
    }
  }

  return result;
}

function makeArcCoordinates(from: Coordinates, to: Coordinates, npoints = 100) {
  return flattenGeometry(makeArcGeometry(from, to, npoints));
}

function positionAlong(
  coordinates: Coordinates[],
  progress: number,
): { coordinate: Coordinates; heading: number } {
  if (coordinates.length === 0) {
    return { coordinate: [0, 0], heading: 0 };
  }
  if (coordinates.length === 1) {
    return {
      coordinate: [normalizeLongitude(coordinates[0][0]), coordinates[0][1]],
      heading: 0,
    };
  }

  const scaled = clamp(progress) * (coordinates.length - 1);
  const index = Math.min(Math.floor(scaled), coordinates.length - 2);
  const localProgress = scaled - index;
  const current = coordinates[index];
  const next = coordinates[index + 1];
  const coordinate: Coordinates = [
    normalizeLongitude(current[0] + (next[0] - current[0]) * localProgress),
    current[1] + (next[1] - current[1]) * localProgress,
  ];
  const heading = bearing(
    [normalizeLongitude(current[0]), current[1]],
    [normalizeLongitude(next[0]), next[1]],
  );

  return { coordinate, heading };
}

function coordinatesToGeometry(coordinates: Coordinates[]): RouteGeometry {
  if (coordinates.length < 2) {
    return {
      type: "LineString",
      coordinates:
        coordinates.length === 1 ? [coordinates[0], coordinates[0]] : [],
    };
  }

  const segments: Coordinates[][] = [[]];
  for (const coordinate of coordinates) {
    const normalized: Coordinates = [
      normalizeLongitude(coordinate[0]),
      coordinate[1],
    ];
    const segment = segments[segments.length - 1];
    const previous = segment[segment.length - 1];
    if (previous && Math.abs(normalized[0] - previous[0]) > 180) {
      segments.push([normalized]);
    } else {
      segment.push(normalized);
    }
  }

  const validSegments = segments.filter((segment) => segment.length >= 2);
  if (validSegments.length <= 1) {
    return {
      type: "LineString",
      coordinates: validSegments[0] ?? coordinates.slice(0, 2),
    };
  }
  return { type: "MultiLineString", coordinates: validSegments };
}

function splitArc(
  coordinates: Coordinates[],
  progress: number,
): { completed: RouteGeometry; remaining: RouteGeometry } {
  const scaled = clamp(progress) * Math.max(0, coordinates.length - 1);
  const index = Math.min(
    Math.floor(scaled),
    Math.max(0, coordinates.length - 2),
  );
  const current = coordinates[index] ?? coordinates[0] ?? [0, 0];
  const next = coordinates[index + 1] ?? current;
  const local = scaled - index;
  const splitPoint: Coordinates = [
    current[0] + (next[0] - current[0]) * local,
    current[1] + (next[1] - current[1]) * local,
  ];

  const completed = [...coordinates.slice(0, index + 1), splitPoint];
  const remaining = [splitPoint, ...coordinates.slice(index + 1)];
  return {
    completed: coordinatesToGeometry(completed),
    remaining: coordinatesToGeometry(remaining),
  };
}

function useGeoJsonOverlay(
  sourceId: string,
  data: GeoJsonCollection,
  layers: readonly OverlayLayer[],
  sourceOptions?: Partial<MapLibreGL.GeoJSONSourceSpecification>,
  imageResource?: OverlayImageResource,
) {
  const { map, isLoaded } = useMap();
  const layerIds = layers.map((layer) => layer.id).join("|");
  const imageId = imageResource?.id;
  const imagePixelRatio = imageResource?.pixelRatio;

  useEffect(() => {
    if (!map || !isLoaded || map.getSource(sourceId)) return;

    if (imageResource && !map.hasImage(imageResource.id)) {
      map.addImage(imageResource.id, imageResource.create(), {
        pixelRatio: imageResource.pixelRatio,
      });
    }
    map.addSource(sourceId, {
      type: "geojson",
      data: data as MapLibreGL.GeoJSONSourceSpecification["data"],
      ...sourceOptions,
    });
    for (const layer of layers) {
      map.addLayer(layer as unknown as MapLibreGL.AddLayerObject);
    }

    return () => {
      try {
        for (const layerId of layerIds.split("|").reverse()) {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        if (imageId && map.hasImage(imageId)) map.removeImage(imageId);
      } catch {
        // The map or its style may already be disposed.
      }
    };
    // Layer definitions are updated by the effects below without remounting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, sourceId, layerIds, imageId, imagePixelRatio]);

  useEffect(() => {
    if (!map || !isLoaded || !imageResource) return;
    const image = imageResource.create();
    if (map.hasImage(imageResource.id)) {
      map.updateImage(imageResource.id, image);
    } else {
      map.addImage(imageResource.id, image, {
        pixelRatio: imageResource.pixelRatio,
      });
    }
    // The signature intentionally controls image regeneration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageResource?.signature, isLoaded, map]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
    source?.setData(data as MapLibreGL.GeoJSONSourceSpecification["data"]);
  }, [data, isLoaded, map, sourceId]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    for (const layer of layers) {
      if (!map.getLayer(layer.id)) continue;
      if (layer.paint) {
        for (const [property, value] of Object.entries(layer.paint)) {
          map.setPaintProperty(layer.id, property, value);
        }
      }
      if (layer.layout) {
        for (const [property, value] of Object.entries(layer.layout)) {
          map.setLayoutProperty(layer.id, property, value);
        }
      }
      if (layer.filter) map.setFilter(layer.id, layer.filter);
    }
  }, [isLoaded, layers, map]);
}

function PlaneGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 2.5c.75 0 1.35.6 1.35 1.35v5.1l6.1 3.65v1.75l-6.1-1.85v4.2l2.1 1.55v1.35L12 18.7l-3.45.9v-1.35l2.1-1.55v-4.2l-6.1 1.85V12.6l6.1-3.65v-5.1c0-.75.6-1.35 1.35-1.35Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EndpointMarker({
  refValue,
  showLabel,
}: {
  refValue: AirportRef;
  showLabel: boolean;
}) {
  const coordinates = resolveRef(refValue);
  if (!coordinates) return null;
  return (
    <MapMarker longitude={coordinates[0]} latitude={coordinates[1]}>
      <MarkerContent>
        <div className="size-3 rounded-full border-2 border-white bg-slate-950 shadow-md" />
        {showLabel ? <MarkerLabel>{routeLabel(refValue)}</MarkerLabel> : null}
      </MarkerContent>
    </MapMarker>
  );
}

export type FlightTrackerProps = {
  from: AirportRef;
  to: AirportRef;
  /** Controlled flight progress from 0 to 1. */
  progress: number;
  id?: string;
  completedColor?: string;
  remainingColor?: string;
  width?: number;
  showAirports?: boolean;
  showLabel?: boolean;
  altitude?: number;
  speed?: number;
  showInfo?: boolean;
  /** Custom content shown in the aircraft info card beside progress. */
  children?: ReactNode;
  icon?: ReactNode;
  iconSize?: number;
  npoints?: number;
};

/** A controlled, single-flight progress overlay with completed/remaining paths. */
function FlightTracker({
  from,
  to,
  progress,
  id: propId,
  completedColor = "#0f172a",
  remainingColor = "#94a3b8",
  width = 3,
  showAirports = true,
  showLabel = true,
  altitude,
  speed,
  showInfo = true,
  children,
  icon,
  iconSize = 26,
  npoints = 140,
}: FlightTrackerProps) {
  const autoId = useId();
  const id = propId ?? autoId;
  const sourceId = `flight-tracker-source-${id}`;
  const layerId = `flight-tracker-layer-${id}`;
  const fromKey = normalizeRefKey(from);
  const toKey = normalizeRefKey(to);
  const fromCoordinates = useMemo(() => resolveRefKey(fromKey), [fromKey]);
  const toCoordinates = useMemo(() => resolveRefKey(toKey), [toKey]);
  const coordinates = useMemo(
    () =>
      fromCoordinates && toCoordinates
        ? makeArcCoordinates(fromCoordinates, toCoordinates, npoints)
        : [],
    [fromCoordinates, toCoordinates, npoints],
  );
  const safeProgress = clamp(progress);
  const position = useMemo(
    () => positionAlong(coordinates, safeProgress),
    [coordinates, safeProgress],
  );
  const data = useMemo<GeoJsonCollection>(() => {
    if (coordinates.length < 2) return EMPTY_COLLECTION;
    const arc = splitArc(coordinates, safeProgress);
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { segment: "remaining" },
          geometry: arc.remaining,
        },
        {
          type: "Feature",
          properties: { segment: "completed" },
          geometry: arc.completed,
        },
      ],
    };
  }, [coordinates, safeProgress]);
  const layers = useMemo<OverlayLayer[]>(
    () => [
      {
        id: layerId,
        source: sourceId,
        type: "line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": [
            "match",
            ["get", "segment"],
            "completed",
            completedColor,
            remainingColor,
          ],
          "line-opacity": ["match", ["get", "segment"], "completed", 1, 0.5],
          "line-width": width,
        },
      },
    ],
    [completedColor, layerId, remainingColor, sourceId, width],
  );

  useGeoJsonOverlay(sourceId, data, layers);
  if (!fromCoordinates || !toCoordinates || coordinates.length < 2) return null;

  return (
    <>
      {showAirports ? (
        <>
          <EndpointMarker refValue={from} showLabel={showLabel} />
          <EndpointMarker refValue={to} showLabel={showLabel} />
        </>
      ) : null}
      <MapMarker
        longitude={position.coordinate[0]}
        latitude={position.coordinate[1]}
      >
        <MarkerContent className="cursor-default">
          <div
            className="text-slate-950 drop-shadow-[0_2px_3px_rgba(255,255,255,0.95)]"
            style={{ transform: `rotate(${position.heading}deg)` }}
          >
            {icon ?? <PlaneGlyph size={iconSize} />}
          </div>
          {showInfo ? (
            <div className="absolute top-full left-1/2 mt-2 min-w-40 -translate-x-1/2 rounded-xl border border-black/10 bg-white/95 px-3 py-2 text-[10px] whitespace-nowrap text-slate-600 shadow-lg backdrop-blur">
              <div className="flex items-center justify-between gap-3 font-semibold text-slate-950">
                <div>
                  {children ?? `${routeLabel(from)} → ${routeLabel(to)}`}
                </div>
                <span>{Math.round(safeProgress * 100)}%</span>
              </div>
              {altitude !== undefined || speed !== undefined ? (
                <div className="mt-1 flex items-center gap-2">
                  {altitude !== undefined ? (
                    <span>{altitude.toLocaleString()} ft</span>
                  ) : null}
                  {speed !== undefined ? <span>{speed} kt</span> : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </MarkerContent>
      </MapMarker>
    </>
  );
}

export type FlightRouteLabelSize = "sm" | "md" | "lg";
export type FlightRouteLabelMode = "route" | "aircraft";
export type FlightRouteLabelPosition = "top" | "right" | "bottom" | "left";

export type FlightRouteLabelAnimateConfig = {
  /** Milliseconds for a complete route traversal (default: 7200). */
  duration?: number;
  /** Restart at the beginning after reaching the destination (default: true). */
  loop?: boolean;
};

const FLIGHT_ROUTE_LABEL_SIZE_CLASSES: Record<FlightRouteLabelSize, string> = {
  sm: "rounded px-1.5 py-0.5 text-[9px]",
  md: "rounded-md px-2 py-1 text-[10px]",
  lg: "rounded-lg px-3 py-1.5 text-xs",
};

const FLIGHT_ROUTE_LABEL_POSITION_CLASSES: Record<
  FlightRouteLabelPosition,
  string
> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  right: "top-1/2 left-full ml-2 -translate-y-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "top-1/2 right-full mr-2 -translate-y-1/2",
};

export type FlightRouteLabelProps = {
  from: AirportRef;
  to: AirportRef;
  children: ReactNode;
  /** Fixed route annotation or an aircraft-following label (default: "route"). */
  mode?: FlightRouteLabelMode;
  position?: number;
  rotate?: boolean;
  offset?: [number, number];
  /** Controls the label type scale and spacing (default: "md"). */
  size?: FlightRouteLabelSize;
  /** Label placement around the aircraft in aircraft mode (default: "right"). */
  labelPosition?: FlightRouteLabelPosition;
  /** Enables aircraft movement; only used in aircraft mode. */
  animate?: boolean | FlightRouteLabelAnimateConfig;
  /** Custom aircraft icon; only used in aircraft mode. */
  icon?: ReactNode;
  /** Aircraft icon size in pixels (default: 22). */
  iconSize?: number;
  className?: string;
  npoints?: number;
};

function FlightRouteLabelCard({
  children,
  size,
  className,
}: {
  children: ReactNode;
  size: FlightRouteLabelSize;
  className?: string;
}) {
  return (
    <div
      className={`border border-black/10 bg-white/94 font-semibold whitespace-nowrap text-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.12)] backdrop-blur ${FLIGHT_ROUTE_LABEL_SIZE_CLASSES[size]} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function MovingFlightRouteLabel({
  coordinates,
  children,
  position,
  offset,
  size,
  labelPosition,
  animate,
  icon,
  iconSize,
  className,
}: {
  coordinates: Coordinates[];
  children: ReactNode;
  position: number;
  offset: [number, number];
  size: FlightRouteLabelSize;
  labelPosition: FlightRouteLabelPosition;
  animate?: boolean | FlightRouteLabelAnimateConfig;
  icon?: ReactNode;
  iconSize: number;
  className?: string;
}) {
  const { map } = useMap();
  const markerRef = useRef<MapLibreGL.Marker | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [markerElement, setMarkerElement] = useState<HTMLDivElement | null>(
    null,
  );
  const isAnimated = Boolean(animate);
  const duration =
    typeof animate === "object"
      ? Math.max(250, animate.duration ?? 7200)
      : 7200;
  const loop = typeof animate === "object" ? (animate.loop ?? true) : true;
  const startProgress = clamp(position) >= 1 ? 0 : clamp(position);
  const initialHeading = positionAlong(
    coordinates,
    isAnimated ? startProgress : clamp(position),
  ).heading;

  const updateMarker = useCallback(
    (progress: number) => {
      const marker = markerRef.current;
      if (!marker || coordinates.length < 2) return;
      const current = positionAlong(coordinates, progress);
      marker.setLngLat(current.coordinate);
      if (planeRef.current) {
        planeRef.current.style.transform = `rotate(${current.heading}deg)`;
      }
    },
    [coordinates],
  );

  useEffect(() => {
    if (!map || coordinates.length < 2) return;
    let mounted = true;
    const element = document.createElement("div");
    const initial = positionAlong(coordinates, 0);
    const marker = new MapLibreGL.Marker({
      element,
      anchor: "center",
      rotationAlignment: "map",
      pitchAlignment: "map",
    })
      .setLngLat(initial.coordinate)
      .addTo(map);

    markerRef.current = marker;
    queueMicrotask(() => {
      if (mounted) setMarkerElement(element);
    });

    return () => {
      mounted = false;
      marker.remove();
      markerRef.current = null;
      planeRef.current = null;
    };
  }, [coordinates, map]);

  useEffect(() => {
    if (isAnimated) return;
    updateMarker(clamp(position));
  }, [isAnimated, position, updateMarker]);

  useEffect(() => {
    if (!isAnimated || coordinates.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      updateMarker(startProgress);
      return;
    }

    const startedAt = performance.now();
    const remainingSpan = Math.max(0.000001, 1 - startProgress);
    const update = (now: number) => {
      const elapsedProgress = (now - startedAt) / duration;
      const rawProgress = startProgress + elapsedProgress;
      if (rawProgress >= 1 && !loop) {
        updateMarker(1);
        return;
      }
      const progress = loop
        ? startProgress + ((rawProgress - startProgress) % remainingSpan)
        : rawProgress;
      updateMarker(progress);
      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [coordinates, duration, isAnimated, loop, startProgress, updateMarker]);

  if (coordinates.length < 2 || !markerElement) return null;
  return createPortal(
    <div
      className="relative flex items-center justify-center text-slate-950"
      style={{ width: iconSize, height: iconSize }}
    >
      <div
        ref={planeRef}
        className="flex items-center justify-center drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)] will-change-transform"
        style={{
          width: iconSize,
          height: iconSize,
          transform: `rotate(${initialHeading}deg)`,
        }}
      >
        {icon ?? <PlaneGlyph size={iconSize} />}
      </div>
      <div
        className={`absolute ${FLIGHT_ROUTE_LABEL_POSITION_CLASSES[labelPosition]}`}
      >
        <div style={{ transform: `translate(${offset[0]}px, ${offset[1]}px)` }}>
          <FlightRouteLabelCard size={size} className={className}>
            {children}
          </FlightRouteLabelCard>
        </div>
      </div>
    </div>,
    markerElement,
  );
}

/** Places a fixed route annotation or a label that follows an aircraft. */
function FlightRouteLabel({
  from,
  to,
  children,
  mode = "route",
  position = 0.5,
  rotate = false,
  offset = [0, 0],
  size = "md",
  labelPosition = "right",
  animate,
  icon,
  iconSize = 22,
  className,
  npoints = 100,
}: FlightRouteLabelProps) {
  const fromKey = normalizeRefKey(from);
  const toKey = normalizeRefKey(to);
  const coordinates = useMemo(() => {
    const fromCoordinates = resolveRefKey(fromKey);
    const toCoordinates = resolveRefKey(toKey);
    return fromCoordinates && toCoordinates
      ? makeArcCoordinates(fromCoordinates, toCoordinates, npoints)
      : [];
  }, [fromKey, npoints, toKey]);
  const routePosition = useMemo(
    () =>
      coordinates.length >= 2 ? positionAlong(coordinates, position) : null,
    [coordinates, position],
  );

  if (mode === "aircraft") {
    return (
      <MovingFlightRouteLabel
        coordinates={coordinates}
        position={position}
        offset={offset}
        size={size}
        labelPosition={labelPosition}
        animate={animate}
        icon={icon}
        iconSize={iconSize}
        className={className}
      >
        {children}
      </MovingFlightRouteLabel>
    );
  }

  if (!routePosition) return null;
  return (
    <MapMarker
      longitude={routePosition.coordinate[0]}
      latitude={routePosition.coordinate[1]}
      offset={offset}
      rotation={rotate ? routePosition.heading - 90 : 0}
      rotationAlignment="map"
    >
      <MarkerContent className="cursor-default">
        <FlightRouteLabelCard size={size} className={className}>
          {children}
        </FlightRouteLabelCard>
      </MarkerContent>
    </MapMarker>
  );
}

export type FlightNetworkRoute = {
  /** Route origin as an IATA code or [longitude, latitude]. */
  from: AirportRef;
  /** Route destination as an IATA code or [longitude, latitude]. */
  to: AirportRef;
  /**
   * Relative non-negative route weight (default: 1). Higher values produce a
   * thicker route and contribute more to the size of both connected nodes.
   */
  value?: number;
};

export type FlightNetworkProps = {
  /** Weighted origin/destination routes used to size routes and airport nodes. */
  routes: readonly FlightNetworkRoute[];
  id?: string;
  color?: string;
  highlightColor?: string;
  minRouteWidth?: number;
  maxRouteWidth?: number;
  minNodeSize?: number;
  maxNodeSize?: number;
  showLabels?: boolean;
  selectedAirport?: string | null;
  onAirportSelect?: (airport: string | null) => void;
  npoints?: number;
};

/** Weighted route network with linked-route highlighting on airport focus. */
function FlightNetwork({
  routes,
  id: propId,
  color = "#64748b",
  highlightColor = "#0f172a",
  minRouteWidth = 0.75,
  maxRouteWidth = 2.75,
  minNodeSize = 3,
  maxNodeSize = 7.5,
  showLabels = true,
  selectedAirport,
  onAirportSelect,
  npoints = 100,
}: FlightNetworkProps) {
  const autoId = useId();
  const id = propId ?? autoId;
  const sourceId = `flight-network-source-${id}`;
  const routeLayerId = `flight-network-routes-${id}`;
  const nodeLayerId = `flight-network-nodes-${id}`;
  const labelLayerId = `flight-network-labels-${id}`;
  const [hoveredAirport, setHoveredAirport] = useState<string | null>(null);
  const focus = hoveredAirport ?? selectedAirport ?? null;
  const routeSignature = JSON.stringify(routes);
  const networkData = useMemo(() => {
    const nodeValues = new Map<
      string,
      { coordinate: Coordinates; value: number }
    >();
    const routeFeatures: GeoJsonFeature[] = [];

    for (const route of routes) {
      const fromCoordinates = resolveRef(route.from);
      const toCoordinates = resolveRef(route.to);
      if (!fromCoordinates || !toCoordinates) continue;
      const from = routeLabel(route.from);
      const to = routeLabel(route.to);
      const value = Math.max(0, route.value ?? 1);
      routeFeatures.push({
        type: "Feature",
        properties: {
          kind: "route",
          from,
          to,
          value,
          focused: focus !== null,
          active: focus !== null && (focus === from || focus === to),
        },
        geometry: makeArcGeometry(fromCoordinates, toCoordinates, npoints),
      });
      for (const [key, coordinate] of [
        [from, fromCoordinates],
        [to, toCoordinates],
      ] as const) {
        const current = nodeValues.get(key);
        nodeValues.set(key, {
          coordinate,
          value: (current?.value ?? 0) + value,
        });
      }
    }

    const nodeFeatures: GeoJsonFeature[] = Array.from(nodeValues).map(
      ([key, node]) => ({
        type: "Feature",
        properties: {
          kind: "airport",
          key,
          label: key,
          value: node.value,
          focused: focus !== null,
          active: focus === key,
        },
        geometry: { type: "Point", coordinates: node.coordinate },
      }),
    );
    return {
      collection: {
        type: "FeatureCollection",
        features: [...routeFeatures, ...nodeFeatures],
      } satisfies GeoJsonCollection,
      maxRouteValue: Math.max(
        1,
        ...routeFeatures.map((feature) => Number(feature.properties.value)),
      ),
      maxNodeValue: Math.max(
        1,
        ...nodeFeatures.map((feature) => Number(feature.properties.value)),
      ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSignature, focus, npoints]);
  const data = networkData.collection;
  const maxValue = networkData.maxRouteValue;
  const nodeMaxValue = networkData.maxNodeValue;
  const layers = useMemo<OverlayLayer[]>(
    () => [
      {
        id: routeLayerId,
        source: sourceId,
        type: "line",
        filter: ["==", ["get", "kind"], "route"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": [
            "case",
            ["all", ["get", "focused"], ["get", "active"]],
            highlightColor,
            color,
          ],
          "line-opacity": [
            "case",
            ["!", ["get", "focused"]],
            0.46,
            ["get", "active"],
            0.95,
            0.08,
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["sqrt", ["get", "value"]],
            0,
            minRouteWidth,
            Math.sqrt(maxValue),
            maxRouteWidth,
          ],
        },
      },
      {
        id: nodeLayerId,
        source: sourceId,
        type: "circle",
        filter: ["==", ["get", "kind"], "airport"],
        paint: {
          "circle-color": [
            "case",
            ["all", ["get", "focused"], ["get", "active"]],
            highlightColor,
            color,
          ],
          "circle-opacity": [
            "case",
            ["!", ["get", "focused"]],
            0.95,
            ["get", "active"],
            1,
            0.2,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["sqrt", ["get", "value"]],
            0,
            minNodeSize,
            Math.sqrt(nodeMaxValue),
            maxNodeSize,
          ],
        },
      },
      {
        id: labelLayerId,
        source: sourceId,
        type: "symbol",
        filter: ["==", ["get", "kind"], "airport"],
        layout: {
          visibility: showLabels ? "visible" : "none",
          "text-field": ["get", "label"],
          "text-size": 9.5,
          "text-offset": [0, 1.15],
          "text-anchor": "top",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.25,
        },
      },
    ],
    [
      color,
      highlightColor,
      labelLayerId,
      maxRouteWidth,
      maxValue,
      minNodeSize,
      minRouteWidth,
      nodeLayerId,
      nodeMaxValue,
      maxNodeSize,
      routeLayerId,
      showLabels,
      sourceId,
    ],
  );
  const { map, isLoaded } = useMap();
  useGeoJsonOverlay(sourceId, data, layers);

  useEffect(() => {
    if (!map || !isLoaded || !map.getLayer(nodeLayerId)) return;
    const onEnter = (event: MapLibreGL.MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = "pointer";
      const key = event.features?.[0]?.properties?.key;
      setHoveredAirport(typeof key === "string" ? key : null);
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
      setHoveredAirport(null);
    };
    const onClick = (event: MapLibreGL.MapLayerMouseEvent) => {
      const key = event.features?.[0]?.properties?.key;
      onAirportSelect?.(typeof key === "string" ? key : null);
    };
    map.on("mouseenter", nodeLayerId, onEnter);
    map.on("mouseleave", nodeLayerId, onLeave);
    map.on("click", nodeLayerId, onClick);
    return () => {
      map.off("mouseenter", nodeLayerId, onEnter);
      map.off("mouseleave", nodeLayerId, onLeave);
      map.off("click", nodeLayerId, onClick);
    };
  }, [isLoaded, map, nodeLayerId, onAirportSelect]);

  return null;
}

export type FlightRangeBand = {
  distance: number;
  color?: string;
  opacity?: number;
};

export type FlightRangeProps = {
  origin: AirportRef;
  ranges: readonly FlightRangeBand[];
  id?: string;
  outlineWidth?: number;
  showOrigin?: boolean;
  showLabel?: boolean;
  steps?: number;
};

function geodesicCircle(
  center: Coordinates,
  distanceKm: number,
  steps: number,
): Coordinates[] {
  const angularDistance = distanceKm / 6371;
  const latitude = (center[1] * Math.PI) / 180;
  const longitude = (center[0] * Math.PI) / 180;
  const coordinates: Coordinates[] = [];

  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    const destinationLatitude = Math.asin(
      Math.sin(latitude) * Math.cos(angularDistance) +
        Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(angle),
    );
    const destinationLongitude =
      longitude +
      Math.atan2(
        Math.sin(angle) * Math.sin(angularDistance) * Math.cos(latitude),
        Math.cos(angularDistance) -
          Math.sin(latitude) * Math.sin(destinationLatitude),
      );
    coordinates.push([
      normalizeLongitude((destinationLongitude * 180) / Math.PI),
      (destinationLatitude * 180) / Math.PI,
    ]);
  }
  return coordinates;
}

/** True geodesic range bands measured in kilometres from an airport or point. */
function FlightRange({
  origin,
  ranges,
  id: propId,
  outlineWidth = 1.5,
  showOrigin = true,
  showLabel = true,
  steps = 128,
}: FlightRangeProps) {
  const autoId = useId();
  const id = propId ?? autoId;
  const sourceId = `flight-range-source-${id}`;
  const fillLayerId = `flight-range-fill-${id}`;
  const outlineLayerId = `flight-range-outline-${id}`;
  const originKey = normalizeRefKey(origin);
  const originCoordinates = useMemo(
    () => resolveRefKey(originKey),
    [originKey],
  );
  const rangeSignature = JSON.stringify(ranges);
  const data = useMemo<GeoJsonCollection>(() => {
    if (!originCoordinates) return EMPTY_COLLECTION;
    const sorted = [...ranges].sort((a, b) => b.distance - a.distance);
    return {
      type: "FeatureCollection",
      features: sorted.map((range, index) => ({
        type: "Feature",
        properties: {
          color: range.color ?? ["#cbd5e1", "#94a3b8", "#475569"][index % 3],
          opacity: range.opacity ?? 0.065,
          distance: range.distance,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            geodesicCircle(originCoordinates, range.distance, steps),
          ],
        },
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originCoordinates, rangeSignature, steps]);
  const layers = useMemo<OverlayLayer[]>(
    () => [
      {
        id: fillLayerId,
        source: sourceId,
        type: "fill",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": ["get", "opacity"],
        },
      },
      {
        id: outlineLayerId,
        source: sourceId,
        type: "line",
        paint: {
          "line-color": ["get", "color"],
          "line-opacity": 0.72,
          "line-width": outlineWidth,
        },
      },
    ],
    [fillLayerId, outlineLayerId, outlineWidth, sourceId],
  );
  useGeoJsonOverlay(sourceId, data, layers);

  return showOrigin && originCoordinates ? (
    <EndpointMarker refValue={origin} showLabel={showLabel} />
  ) : null;
}

export type AircraftTrailPosition = {
  longitude: number;
  latitude: number;
  timestamp?: number | string;
  /** Altitude value used by `altitudeColorStops` (typically feet). */
  altitude?: number;
};

export type AircraftTrailAltitudeColorStop = {
  altitude: number;
  color: string;
};

export type AircraftTrailProps = {
  positions: readonly AircraftTrailPosition[];
  /** Optional destination used to generate a dashed great-circle continuation. */
  to?: AirportRef;
  /**
   * Explicit future route positions. When provided, these take precedence over
   * the generated `to` route and are connected to the latest observed point.
   */
  plannedPositions?: readonly AircraftTrailPosition[];
  id?: string;
  color?: string;
  /**
   * Maps recorded position altitudes to a smooth route gradient. Stops are
   * sorted by altitude; missing altitude samples are interpolated from their
   * nearest known neighbours.
   */
  altitudeColorStops?: readonly AircraftTrailAltitudeColorStop[];
  width?: number;
  startOpacity?: number;
  endOpacity?: number;
  /** Adds a soft halo beneath the recorded track (default: true). */
  showGlow?: boolean;
  showAircraft?: boolean;
  icon?: ReactNode;
  iconSize?: number;
  plannedColor?: string;
  plannedWidth?: number;
  plannedOpacity?: number;
  plannedDashArray?: readonly [number, number];
  /** Lateral bend for an automatically generated destination route. */
  plannedCurvature?: number;
  npoints?: number;
};

const DEFAULT_AIRCRAFT_TRAIL_DASH_ARRAY = [2, 2] as const;

function coordinateDistance(a: Coordinates, b: Coordinates) {
  const toRadians = Math.PI / 180;
  const latitudeA = a[1] * toRadians;
  const latitudeB = b[1] * toRadians;
  const latitudeDelta = (b[1] - a[1]) * toRadians;
  const longitudeDelta = (b[0] - a[0]) * toRadians;
  const sinLatitude = Math.sin(latitudeDelta / 2);
  const sinLongitude = Math.sin(longitudeDelta / 2);
  const haversine =
    sinLatitude * sinLatitude +
    Math.cos(latitudeA) * Math.cos(latitudeB) * sinLongitude * sinLongitude;
  const safeHaversine = clamp(haversine);
  return 2 * Math.atan2(Math.sqrt(safeHaversine), Math.sqrt(1 - safeHaversine));
}

function pathProgressValues(coordinates: readonly Coordinates[]) {
  if (coordinates.length <= 1) return coordinates.map(() => 0);
  const progress = new Array<number>(coordinates.length).fill(0);
  let totalDistance = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    totalDistance += coordinateDistance(
      coordinates[index - 1],
      coordinates[index],
    );
    progress[index] = totalDistance;
  }
  if (totalDistance <= Number.EPSILON) {
    return progress.map((_, index) => index / (coordinates.length - 1));
  }
  for (let index = 1; index < progress.length; index += 1) {
    progress[index] /= totalDistance;
  }
  return progress;
}

function curvePlannedCoordinates(
  coordinates: readonly Coordinates[],
  curvature: number,
): Coordinates[] {
  if (coordinates.length < 3 || Math.abs(curvature) <= Number.EPSILON) {
    return [...coordinates];
  }

  const start = coordinates[0];
  const end = coordinates[coordinates.length - 1];
  const referenceLatitude = ((start[1] + end[1]) / 2) * (Math.PI / 180);
  const longitudeScale = Math.max(0.15, Math.cos(referenceLatitude));
  const deltaX = (end[0] - start[0]) * longitudeScale;
  const deltaY = end[1] - start[1];
  const distance = Math.hypot(deltaX, deltaY);
  if (distance <= Number.EPSILON) return [...coordinates];

  const normalX = -deltaY / distance;
  const normalY = deltaX / distance;
  const bend = clamp(curvature, -0.5, 0.5);
  const progress = pathProgressValues(coordinates);
  return coordinates.map((coordinate, index) => {
    if (index === 0 || index === coordinates.length - 1) return coordinate;
    const offset = distance * bend * Math.sin(Math.PI * progress[index]);
    const pointLongitudeScale = Math.max(
      0.15,
      Math.cos(coordinate[1] * (Math.PI / 180)),
    );
    return [
      coordinate[0] + (normalX * offset) / pointLongitudeScale,
      coordinate[1] + normalY * offset,
    ];
  });
}

function resolveTrailAltitudes(
  positions: readonly AircraftTrailPosition[],
  progress: readonly number[],
) {
  const knownIndexes: number[] = [];
  for (let index = 0; index < positions.length; index += 1) {
    if (Number.isFinite(positions[index].altitude)) knownIndexes.push(index);
  }
  if (knownIndexes.length === 0) return null;

  const resolved = new Array<number>(positions.length);
  let nextKnownPointer = 0;
  for (let index = 0; index < positions.length; index += 1) {
    const altitude = positions[index].altitude;
    if (Number.isFinite(altitude)) {
      resolved[index] = altitude as number;
      if (knownIndexes[nextKnownPointer] === index) nextKnownPointer += 1;
      continue;
    }

    const previousIndex = knownIndexes[Math.max(0, nextKnownPointer - 1)];
    const nextIndex =
      knownIndexes[Math.min(knownIndexes.length - 1, nextKnownPointer)];
    if (previousIndex === nextIndex || index < previousIndex) {
      resolved[index] = positions[nextIndex].altitude as number;
      continue;
    }
    if (index > nextIndex) {
      resolved[index] = positions[previousIndex].altitude as number;
      continue;
    }

    const span = progress[nextIndex] - progress[previousIndex];
    const ratio =
      span > Number.EPSILON
        ? (progress[index] - progress[previousIndex]) / span
        : (index - previousIndex) / (nextIndex - previousIndex);
    const previousAltitude = positions[previousIndex].altitude as number;
    const nextAltitude = positions[nextIndex].altitude as number;
    resolved[index] =
      previousAltitude + (nextAltitude - previousAltitude) * clamp(ratio);
  }
  return resolved;
}

function altitudeColorExpression(
  altitude: number,
  stops: readonly AircraftTrailAltitudeColorStop[],
): unknown {
  if (stops.length === 1) return stops[0].color;
  const expression: unknown[] = ["interpolate", ["linear"], altitude];
  for (const stop of stops) expression.push(stop.altitude, stop.color);
  return expression;
}

function colorOpacityExpression(color: unknown, opacity: number) {
  return [
    "rgba",
    ["at", 0, ["to-rgba", color]],
    ["at", 1, ["to-rgba", color]],
    ["at", 2, ["to-rgba", color]],
    clamp(opacity),
  ];
}

function normalizeAltitudeColorStops(
  colorStops: readonly AircraftTrailAltitudeColorStop[],
) {
  const validStops = [...colorStops]
    .filter(
      (stop) => Number.isFinite(stop.altitude) && stop.color.trim().length > 0,
    )
    .sort((a, b) => a.altitude - b.altitude);
  const sortedStops: AircraftTrailAltitudeColorStop[] = [];
  for (const stop of validStops) {
    const previous = sortedStops[sortedStops.length - 1];
    if (previous?.altitude === stop.altitude) {
      previous.color = stop.color;
    } else {
      sortedStops.push({ ...stop });
    }
  }
  return sortedStops;
}

function makeAltitudeTrailGradient(
  positions: readonly AircraftTrailPosition[],
  coordinates: readonly Coordinates[],
  colorStops: readonly AircraftTrailAltitudeColorStop[],
  startOpacity: number,
  endOpacity: number,
): unknown[] | null {
  if (positions.length < 2 || positions.length !== coordinates.length)
    return null;
  const sortedStops = normalizeAltitudeColorStops(colorStops);
  if (sortedStops.length === 0) return null;

  const progress = pathProgressValues(coordinates);
  const altitudes = resolveTrailAltitudes(positions, progress);
  if (!altitudes) return null;

  const samples: { progress: number; color: unknown }[] = [];
  for (let index = 0; index < positions.length; index += 1) {
    const sampleProgress = clamp(progress[index]);
    const opacity =
      clamp(startOpacity) +
      (clamp(endOpacity) - clamp(startOpacity)) * sampleProgress;
    const color = colorOpacityExpression(
      altitudeColorExpression(altitudes[index], sortedStops),
      opacity,
    );
    const previous = samples[samples.length - 1];
    if (previous && sampleProgress <= previous.progress + Number.EPSILON) {
      previous.color = color;
    } else {
      samples.push({ progress: sampleProgress, color });
    }
  }
  if (samples.length < 2) return null;
  samples[0].progress = 0;
  samples[samples.length - 1].progress = 1;

  const gradient: unknown[] = ["interpolate", ["linear"], ["line-progress"]];
  for (const sample of samples) gradient.push(sample.progress, sample.color);
  return gradient;
}

/** Renders the actual recorded aircraft path with a recent-position emphasis. */
function AircraftTrail({
  positions,
  to,
  plannedPositions,
  id: propId,
  color = "#0f172a",
  altitudeColorStops,
  width = 2.5,
  startOpacity = 0.04,
  endOpacity = 1,
  showGlow = true,
  showAircraft = true,
  icon,
  iconSize = 24,
  plannedColor,
  plannedWidth,
  plannedOpacity = 0.62,
  plannedDashArray = DEFAULT_AIRCRAFT_TRAIL_DASH_ARRAY,
  plannedCurvature = 0.14,
  npoints = 72,
}: AircraftTrailProps) {
  const autoId = useId();
  const id = propId ?? autoId;
  const sourceId = `aircraft-trail-source-${id}`;
  const glowLayerId = `aircraft-trail-glow-${id}`;
  const layerId = `aircraft-trail-layer-${id}`;
  const plannedSourceId = `aircraft-trail-planned-source-${id}`;
  const plannedLayerId = `aircraft-trail-planned-layer-${id}`;
  const signature = JSON.stringify(positions);
  const altitudeColorStopsSignature = JSON.stringify(altitudeColorStops ?? []);
  const plannedSignature = JSON.stringify(plannedPositions ?? []);
  const toKey = to ? normalizeRefKey(to) : null;
  const coordinates = useMemo<Coordinates[]>(
    () => positions.map((point) => [point.longitude, point.latitude]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature],
  );
  const data = useMemo<GeoJsonCollection>(
    () => ({
      type: "FeatureCollection",
      features:
        coordinates.length >= 2
          ? [
              {
                type: "Feature",
                properties: {},
                geometry: coordinatesToGeometry(coordinates),
              },
            ]
          : [],
    }),
    [coordinates],
  );
  const transparentColor = colorWithAlpha(color, clamp(startOpacity));
  const glowStartColor = colorWithAlpha(color, 0);
  const glowEndColor = colorWithAlpha(color, 0.2);
  const altitudeGradients = useMemo(() => {
    if (!altitudeColorStops || altitudeColorStops.length === 0) return null;
    return {
      trail: makeAltitudeTrailGradient(
        positions,
        coordinates,
        altitudeColorStops,
        startOpacity,
        endOpacity,
      ),
      glow: makeAltitudeTrailGradient(
        positions,
        coordinates,
        altitudeColorStops,
        0,
        0.2,
      ),
    };
    // Value signatures intentionally avoid recalculating for equivalent arrays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    altitudeColorStopsSignature,
    coordinates,
    endOpacity,
    signature,
    startOpacity,
  ]);
  const hasAltitudeGradient = Boolean(altitudeGradients?.trail);
  const layers = useMemo<OverlayLayer[]>(
    () => [
      {
        id: glowLayerId,
        source: sourceId,
        type: "line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-width": width + 5,
          "line-gradient": altitudeGradients?.glow ?? [
            "interpolate",
            ["linear"],
            ["line-progress"],
            0,
            glowStartColor,
            1,
            glowEndColor,
          ],
          "line-opacity": showGlow ? 1 : 0,
          "line-blur": 3,
        },
      },
      {
        id: layerId,
        source: sourceId,
        type: "line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-width": width,
          "line-gradient": altitudeGradients?.trail ?? [
            "interpolate",
            ["linear"],
            ["line-progress"],
            0,
            transparentColor,
            1,
            color,
          ],
          "line-opacity": hasAltitudeGradient ? 1 : endOpacity,
        },
      },
    ],
    [
      color,
      altitudeGradients,
      endOpacity,
      glowEndColor,
      glowLayerId,
      glowStartColor,
      layerId,
      hasAltitudeGradient,
      showGlow,
      sourceId,
      transparentColor,
      width,
    ],
  );
  useGeoJsonOverlay(sourceId, data, layers, { lineMetrics: true });

  const latestPosition = coordinates[coordinates.length - 1];
  const plannedCoordinates = useMemo<Coordinates[]>(() => {
    if (!latestPosition) return [];

    if (plannedPositions && plannedPositions.length > 0) {
      const futureCoordinates = plannedPositions.map(
        (point): Coordinates => [point.longitude, point.latitude],
      );
      const first = futureCoordinates[0];
      const startsAtLatestPosition =
        Math.abs(first[0] - latestPosition[0]) < 0.000001 &&
        Math.abs(first[1] - latestPosition[1]) < 0.000001;
      return startsAtLatestPosition
        ? futureCoordinates
        : [latestPosition, ...futureCoordinates];
    }

    if (!toKey) return [];
    const destination = resolveRefKey(toKey);
    return destination
      ? curvePlannedCoordinates(
          makeArcCoordinates(latestPosition, destination, npoints),
          plannedCurvature,
        )
      : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestPosition, npoints, plannedCurvature, plannedSignature, toKey]);
  const plannedData = useMemo<GeoJsonCollection>(
    () => ({
      type: "FeatureCollection",
      features:
        plannedCoordinates.length >= 2
          ? [
              {
                type: "Feature",
                properties: {},
                geometry: coordinatesToGeometry(plannedCoordinates),
              },
            ]
          : [],
    }),
    [plannedCoordinates],
  );
  const resolvedPlannedColor = plannedColor ?? color;
  const resolvedPlannedWidth = plannedWidth ?? Math.max(1, width * 0.82);
  const plannedLayers = useMemo<OverlayLayer[]>(
    () => [
      {
        id: plannedLayerId,
        source: plannedSourceId,
        type: "line",
        layout: { "line-cap": "butt", "line-join": "round" },
        paint: {
          "line-color": resolvedPlannedColor,
          "line-width": resolvedPlannedWidth,
          "line-opacity": clamp(plannedOpacity),
          "line-dasharray": [plannedDashArray[0], plannedDashArray[1]],
        },
      },
    ],
    [
      plannedDashArray,
      plannedLayerId,
      plannedOpacity,
      plannedSourceId,
      resolvedPlannedColor,
      resolvedPlannedWidth,
    ],
  );
  useGeoJsonOverlay(plannedSourceId, plannedData, plannedLayers);

  const heading = useMemo(() => {
    if (coordinates.length < 2) return 0;
    return bearing(
      coordinates[coordinates.length - 2],
      coordinates[coordinates.length - 1],
    );
  }, [coordinates]);
  if (!showAircraft || !latestPosition) return null;
  return (
    <MapMarker longitude={latestPosition[0]} latitude={latestPosition[1]}>
      <MarkerContent>
        <div
          className="text-slate-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]"
          style={{ transform: `rotate(${heading}deg)` }}
        >
          {icon ?? <PlaneGlyph size={iconSize} />}
        </div>
      </MarkerContent>
    </MapMarker>
  );
}

const FLIGHT_FLOW_AIRCRAFT_IMAGE_SIZE = 32;
const FLIGHT_FLOW_AIRCRAFT_IMAGE_PIXEL_RATIO = 3;

function makeFlightFlowAircraftImage(color: string) {
  const canvas = document.createElement("canvas");
  const canvasSize =
    FLIGHT_FLOW_AIRCRAFT_IMAGE_SIZE * FLIGHT_FLOW_AIRCRAFT_IMAGE_PIXEL_RATIO;
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const context = canvas.getContext("2d");
  if (!context) return new ImageData(canvasSize, canvasSize);

  const path = new Path2D(
    "M12 2.5c.75 0 1.35.6 1.35 1.35v5.1l6.1 3.65v1.75l-6.1-1.85v4.2l2.1 1.55v1.35L12 18.7l-3.45.9v-1.35l2.1-1.55v-4.2l-6.1 1.85V12.6l6.1-3.65v-5.1c0-.75.6-1.35 1.35-1.35Z",
  );
  context.scale(canvasSize / 24, canvasSize / 24);
  context.lineJoin = "round";
  context.shadowColor = "rgba(15, 23, 42, 0.38)";
  context.shadowBlur = 1.4;
  context.shadowOffsetY = 0.6;
  context.strokeStyle = "rgba(255, 255, 255, 0.96)";
  context.lineWidth = 1.25;
  context.stroke(path);
  context.fillStyle = color;
  context.fill(path);
  return context.getImageData(0, 0, canvasSize, canvasSize);
}

export type FlightFlowRoute = FlightNetworkRoute & {
  /** Exact aircraft count for this route; overrides weighted distribution. */
  aircraftCount?: number;
};

export type FlightFlowProps = {
  routes: readonly FlightFlowRoute[];
  id?: string;
  /** Aircraft icon color. */
  color?: string;
  /** Whether to show the optional guide routes beneath the aircraft. */
  showRoutes?: boolean;
  routeColor?: string;
  routeOpacity?: number;
  routeWidth?: number;
  /** Animate aircraft along each route; false keeps them evenly distributed. */
  animate?: boolean;
  /** Approximate total aircraft count distributed by route value. */
  aircraftCount?: number;
  /** Aircraft icon size in pixels. */
  aircraftSize?: number;
  /** @deprecated Use `aircraftCount` instead. */
  particleCount?: number;
  /** @deprecated Use `aircraftSize` instead. */
  particleSize?: number;
  /** @deprecated Particle tails are no longer rendered. */
  tailLength?: number;
  duration?: number;
  npoints?: number;
};

/** Renders weighted aircraft traffic in animated or static mode. */
function FlightFlow({
  routes,
  id: propId,
  color = "#f59e0b",
  showRoutes = false,
  routeColor = "#94a3b8",
  routeOpacity = 0.16,
  routeWidth = 1,
  animate = true,
  aircraftCount,
  aircraftSize,
  particleCount,
  particleSize,
  duration = 12000,
  npoints = 100,
}: FlightFlowProps) {
  const autoId = useId();
  const id = propId ?? autoId;
  const routeSourceId = `flight-flow-routes-source-${id}`;
  const routeLayerId = `flight-flow-routes-layer-${id}`;
  const aircraftSourceId = `flight-flow-aircraft-source-${id}`;
  const aircraftLayerId = `flight-flow-aircraft-layer-${id}`;
  const aircraftImageId = `flight-flow-aircraft-image-${id}`;
  const resolvedAircraftCount = Math.round(
    clamp(aircraftCount ?? particleCount ?? 24, 1, 200),
  );
  const resolvedAircraftSize = clamp(
    aircraftSize ?? (particleSize ? particleSize * 7 : 18),
    8,
    48,
  );
  const signature = JSON.stringify(routes);
  const samples = useMemo(() => {
    const resolved: {
      coordinates: Coordinates[];
      value: number;
      aircraftCount: number | null;
    }[] = [];
    for (const route of routes) {
      const from = resolveRef(route.from);
      const to = resolveRef(route.to);
      if (!from || !to) continue;
      resolved.push({
        coordinates: makeArcCoordinates(from, to, npoints),
        value: Math.max(0, route.value ?? 1),
        aircraftCount: Number.isFinite(route.aircraftCount)
          ? Math.round(clamp(route.aircraftCount ?? 0, 0, 200))
          : null,
      });
    }
    return resolved;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, npoints]);
  const maxSampleValue = useMemo(
    () => Math.max(1, ...samples.map((sample) => sample.value)),
    [samples],
  );
  const routeData = useMemo<GeoJsonCollection>(
    () => ({
      type: "FeatureCollection",
      features: samples.map((sample) => ({
        type: "Feature",
        properties: { value: sample.value },
        geometry: coordinatesToGeometry(sample.coordinates),
      })),
    }),
    [samples],
  );
  const routeLayers = useMemo<OverlayLayer[]>(
    () => [
      {
        id: routeLayerId,
        source: routeSourceId,
        type: "line",
        layout: { "line-cap": "round" },
        paint: {
          "line-color": routeColor,
          "line-opacity": showRoutes ? routeOpacity : 0,
          "line-width": [
            "interpolate",
            ["linear"],
            ["sqrt", ["get", "value"]],
            0,
            routeWidth * 0.65,
            Math.sqrt(maxSampleValue),
            routeWidth * 1.35,
          ],
        },
      },
    ],
    [
      maxSampleValue,
      routeLayerId,
      routeColor,
      routeOpacity,
      routeSourceId,
      routeWidth,
      showRoutes,
    ],
  );
  useGeoJsonOverlay(routeSourceId, routeData, routeLayers);

  const trafficSamples = useMemo(() => {
    let totalWeight = 0;
    for (const sample of samples) {
      if (sample.aircraftCount === null) totalWeight += sample.value;
    }
    const resolved: { coordinates: Coordinates[]; count: number }[] = [];
    for (const sample of samples) {
      const count =
        sample.aircraftCount ??
        (totalWeight > 0 && sample.value > 0
          ? Math.max(
              1,
              Math.round(resolvedAircraftCount * (sample.value / totalWeight)),
            )
          : 0);
      if (count > 0) resolved.push({ coordinates: sample.coordinates, count });
    }
    return resolved;
  }, [resolvedAircraftCount, samples]);
  const makeAircraftData = useCallback(
    (elapsed: number, moving: boolean): GeoJsonCollection => {
      const features: GeoJsonFeature[] = [];
      for (
        let routeIndex = 0;
        routeIndex < trafficSamples.length;
        routeIndex += 1
      ) {
        const sample = trafficSamples[routeIndex];
        const routeDuration =
          Math.max(1000, duration) * (0.92 + (routeIndex % 4) * 0.06);
        for (
          let aircraftIndex = 0;
          aircraftIndex < sample.count;
          aircraftIndex += 1
        ) {
          const initialProgress =
            (aircraftIndex + 0.5) / sample.count + routeIndex * 0.071;
          const progress =
            (initialProgress + (moving ? elapsed / routeDuration : 0)) % 1;
          const position = positionAlong(sample.coordinates, progress);
          features.push({
            type: "Feature",
            properties: { heading: position.heading },
            geometry: { type: "Point", coordinates: position.coordinate },
          });
        }
      }
      return { type: "FeatureCollection", features };
    },
    [duration, trafficSamples],
  );
  const initialAircraftData = useMemo(
    () => makeAircraftData(0, false),
    [makeAircraftData],
  );
  const aircraftImage = useMemo<OverlayImageResource>(
    () => ({
      id: aircraftImageId,
      signature: color,
      create: () => makeFlightFlowAircraftImage(color),
      pixelRatio: FLIGHT_FLOW_AIRCRAFT_IMAGE_PIXEL_RATIO,
    }),
    [aircraftImageId, color],
  );
  const aircraftLayers = useMemo<OverlayLayer[]>(
    () => [
      {
        id: aircraftLayerId,
        source: aircraftSourceId,
        type: "symbol",
        layout: {
          "icon-image": aircraftImageId,
          "icon-size": resolvedAircraftSize / FLIGHT_FLOW_AIRCRAFT_IMAGE_SIZE,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-rotate": ["get", "heading"],
          "icon-rotation-alignment": "map",
          "icon-pitch-alignment": "map",
        },
        paint: {
          "icon-opacity": 0.96,
        },
      },
    ],
    [aircraftImageId, aircraftLayerId, aircraftSourceId, resolvedAircraftSize],
  );
  useGeoJsonOverlay(
    aircraftSourceId,
    initialAircraftData,
    aircraftLayers,
    undefined,
    aircraftImage,
  );

  const { map, isLoaded } = useMap();
  const frameRef = useRef<number | null>(null);
  const updateAircraft = useCallback(
    (elapsed: number, moving: boolean) => {
      if (!map || trafficSamples.length === 0) return;
      const source = map.getSource(
        aircraftSourceId,
      ) as MapLibreGL.GeoJSONSource;
      source?.setData(
        makeAircraftData(
          elapsed,
          moving,
        ) as MapLibreGL.GeoJSONSourceSpecification["data"],
      );
    },
    [aircraftSourceId, makeAircraftData, map, trafficSamples.length],
  );

  useEffect(() => {
    if (!map || !isLoaded) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!animate || reducedMotion) {
      updateAircraft(0, false);
      return;
    }
    const startedAt = performance.now();
    let lastUpdate = 0;
    const tick = (now: number) => {
      if (now - lastUpdate >= 1000 / 30) {
        updateAircraft(now - startedAt, true);
        lastUpdate = now;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [animate, isLoaded, map, updateAircraft]);

  return null;
}

export {
  FlightTracker,
  FlightRouteLabel,
  FlightNetwork,
  FlightRange,
  AircraftTrail,
  FlightFlow,
};

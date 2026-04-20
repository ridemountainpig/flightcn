"use client";

import MapLibreGL from "maplibre-gl";
import { memo, startTransition, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { useMap } from "@/components/ui/map";

type Coordinate = [number, number];
type ScreenPoint = { x: number; y: number };

type SatelliteMapTheme = "light" | "dark";

function getDocumentTheme(): SatelliteMapTheme | null {
  if (typeof document === "undefined") return null;
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.classList.contains("light")) return "light";
  return null;
}

function getSystemTheme(): SatelliteMapTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useSatelliteMapTheme(): SatelliteMapTheme {
  const [theme, setTheme] = useState<SatelliteMapTheme>(
    () => getDocumentTheme() ?? getSystemTheme(),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const docTheme = getDocumentTheme();
      if (docTheme) setTheme(docTheme);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = (e: MediaQueryListEvent) => {
      if (!getDocumentTheme()) setTheme(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", onSystem);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", onSystem);
    };
  }, []);

  return theme;
}

const SATELLITE_ORBIT_COLOR_LIGHT = "#0a0a0a";
const SATELLITE_ORBIT_COLOR_DARK = "#e8e8e8";
const SATELLITE_ORBIT_GLOW_COLOR_LIGHT = "rgba(15, 23, 42, 0.18)";
const SATELLITE_ORBIT_GLOW_COLOR_DARK = "rgba(125, 211, 252, 0.35)";
const SATELLITE_GROUND_TRACK_COLOR_LIGHT = "rgba(15, 23, 42, 0.22)";
const SATELLITE_GROUND_TRACK_COLOR_DARK = "rgba(96, 165, 250, 0.28)";
const SATELLITE_DOT_COLOR_LIGHT = "#0a0a0a";
const SATELLITE_DOT_COLOR_DARK = "#f8fafc";
const SATELLITE_PANEL_COLOR_LIGHT = "#374151";
const SATELLITE_PANEL_COLOR_DARK = "#38bdf8";
const SATELLITE_CONNECTOR_COLOR_LIGHT = "rgba(15, 23, 42, 0.4)";
const SATELLITE_CONNECTOR_COLOR_DARK = "rgba(148, 163, 184, 0.45)";
const VIEWPORT_EVENTS = ["move", "resize"] as const;
const DEFAULT_SATELLITE_ICON_VIEW_BOX = "-12 -12 24 24";

type ResolvedSatelliteIconSvg = {
  innerMarkup: string;
  viewBox: string;
};

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeLongitude(longitude: number) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function angularDistanceDegrees(a: Coordinate, b: Coordinate) {
  const [lngA, latA] = a.map(degreesToRadians) as Coordinate;
  const [lngB, latB] = b.map(degreesToRadians) as Coordinate;

  const cosine =
    Math.sin(latA) * Math.sin(latB) +
    Math.cos(latA) * Math.cos(latB) * Math.cos(lngA - lngB);

  return radiansToDegrees(Math.acos(clamp(cosine, -1, 1)));
}

function orbitPointFromPhase(
  phase: number,
  inclination: number,
  ascendingNode: number,
): Coordinate {
  const inclinationRad = degreesToRadians(inclination);
  const latitude = radiansToDegrees(
    Math.asin(Math.sin(inclinationRad) * Math.sin(phase)),
  );
  const longitude = normalizeLongitude(
    ascendingNode +
      radiansToDegrees(
        Math.atan2(Math.cos(inclinationRad) * Math.sin(phase), Math.cos(phase)),
      ),
  );

  return [longitude, latitude];
}

function buildOrbitCoordinates(
  samples: number,
  inclination: number,
  ascendingNode: number,
): Coordinate[] {
  return Array.from({ length: samples + 1 }, (_, index) => {
    const phase = (index / samples) * Math.PI * 2;
    return orbitPointFromPhase(phase, inclination, ascendingNode);
  });
}

function splitVisibleSegments(
  points: Coordinate[],
  isVisible: (point: Coordinate) => boolean,
) {
  const basePoints = points.slice(0, -1);
  const segments: Coordinate[][] = [];
  let current: Coordinate[] = [];

  for (const point of basePoints) {
    if (isVisible(point)) {
      current.push(point);
      continue;
    }

    if (current.length > 1) {
      segments.push(current);
    }
    current = [];
  }

  if (current.length > 1) {
    segments.push(current);
  }

  if (
    segments.length > 1 &&
    isVisible(basePoints[0]) &&
    isVisible(basePoints[basePoints.length - 1])
  ) {
    const first = segments[0];
    const last = segments[segments.length - 1];
    segments[0] = [...last, ...first];
    segments.pop();
  }

  return segments;
}

function estimateGlobeScreenRadius(
  map: MapLibreGL.Map,
  center: Coordinate,
): number {
  const pCenter = map.project(center);

  for (const delta of [20, -20, 30, -30]) {
    const refLat = clamp(center[1] + delta, -85, 85);
    const actualAngle = Math.abs(refLat - center[1]);
    if (actualAngle < 5) continue;

    const pRef = map.project([center[0], refLat]);
    const dist = Math.hypot(pRef.x - pCenter.x, pRef.y - pCenter.y);
    const sinAngle = Math.sin(degreesToRadians(actualAngle));
    if (sinAngle < 0.01) continue;

    return Math.max(dist / sinAngle, 50);
  }

  return 300;
}

function elevatePoint(
  point: ScreenPoint,
  center: ScreenPoint,
  altitudePx: number,
  globeRadius: number,
): ScreenPoint {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const scale = altitudePx / Math.max(globeRadius, 1);

  return {
    x: point.x + dx * scale,
    y: point.y + dy * scale,
  };
}

function pointsToPath(points: ScreenPoint[]) {
  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
}

function satelliteRotation(from: ScreenPoint, to: ScreenPoint) {
  return radiansToDegrees(Math.atan2(to.y - from.y, to.x - from.x)) + 90;
}

export type SatelliteAnimationConfig = {
  duration?: number;
};

export type LineStyle = "solid" | "dash" | "dot";

function lineStyleToDashArray(style: LineStyle): string | undefined {
  switch (style) {
    case "dash":
      return "5 6";
    case "dot":
      return "1.5 5";
    case "solid":
      return undefined;
  }
}

function sanitizeSvgTree(element: Element) {
  const blockedTags = new Set(["script", "foreignobject"]);

  for (const attributeName of element.getAttributeNames()) {
    const normalizedName = attributeName.toLowerCase();
    const attributeValue = element.getAttribute(attributeName);

    if (normalizedName.startsWith("on")) {
      element.removeAttribute(attributeName);
      continue;
    }

    if (
      (normalizedName === "href" || normalizedName === "xlink:href") &&
      attributeValue?.trim().toLowerCase().startsWith("javascript:")
    ) {
      element.removeAttribute(attributeName);
    }
  }

  for (const child of [...element.children]) {
    const tagName = child.tagName.toLowerCase();
    if (blockedTags.has(tagName)) {
      child.remove();
      continue;
    }

    sanitizeSvgTree(child);
  }
}

function resolveSatelliteIconSvg(
  satelliteIconSvg?: string,
): ResolvedSatelliteIconSvg | null {
  const trimmedSvg = satelliteIconSvg?.trim();
  if (!trimmedSvg || typeof DOMParser === "undefined") {
    return null;
  }

  const wrappedSvg = trimmedSvg.startsWith("<svg")
    ? trimmedSvg
    : `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${trimmedSvg}</svg>`;

  try {
    const parser = new DOMParser();
    const document = parser.parseFromString(wrappedSvg, "image/svg+xml");
    const svg = document.documentElement;

    if (svg.tagName.toLowerCase() !== "svg") {
      return null;
    }

    if (svg.querySelector("parsererror")) {
      return null;
    }

    sanitizeSvgTree(svg);

    return {
      innerMarkup: svg.innerHTML,
      viewBox: svg.getAttribute("viewBox") || DEFAULT_SATELLITE_ICON_VIEW_BOX,
    };
  } catch {
    return null;
  }
}

function DefaultSatelliteIcon({
  satelliteDotColor,
  satellitePanelColor,
  satelliteConnectorColor,
}: {
  satelliteDotColor: string;
  satellitePanelColor: string;
  satelliteConnectorColor: string;
}) {
  return (
    <>
      <rect
        x="-11"
        y="-3.2"
        width="6.8"
        height="6.4"
        rx="1.2"
        fill={satellitePanelColor}
        opacity="0.92"
      />
      <rect
        x="4.2"
        y="-3.2"
        width="6.8"
        height="6.4"
        rx="1.2"
        fill={satellitePanelColor}
        opacity="0.92"
      />
      <rect
        x="-4.2"
        y="-4.4"
        width="8.4"
        height="8.8"
        rx="1.8"
        fill={satelliteDotColor}
      />
      <circle
        cx="0"
        cy="0"
        r="1.6"
        fill={satelliteConnectorColor}
        opacity="0.7"
      />
      <path
        d="M 0 -7.2 L 0 -11.6"
        stroke={satelliteDotColor}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </>
  );
}

export type SatelliteOrbitProps = {
  inclination?: number;
  ascendingNode?: number;
  duration?: number;
  samples?: number;
  altitudePx?: number;
  orbitColor?: string;
  orbitGlowColor?: string;
  groundTrackColor?: string;
  satelliteConnectorColor?: string;
  /**
   * Custom satellite icon as an SVG string.
   * Accepts a full `<svg ...>...</svg>` or raw SVG children markup.
   * Uses the default icon when omitted or invalid. Trusted markup only.
   */
  satelliteIconSvg?: string;
  /**
   * Rotation offset in degrees applied on top of the computed orbit tangent.
   * Useful when the custom SVG's "forward" direction does not point up.
   */
  satelliteIconRotationOffset?: number;
  orbitWidth?: number;
  groundTrackWidth?: number;
  showGlow?: boolean;
  showConnector?: boolean;
  orbitLineStyle?: LineStyle;
  groundTrackLineStyle?: LineStyle;
  connectorLineStyle?: LineStyle;
  animate?: boolean | SatelliteAnimationConfig;
  name?: string;
  showLabel?: boolean;
  labelPosition?: "top" | "bottom" | "left" | "right";
};

type ResolvedSatelliteColors = {
  orbitColor: string;
  orbitGlowColor: string;
  groundTrackColor: string;
  satelliteDotColor: string;
  satellitePanelColor: string;
  satelliteConnectorColor: string;
};

type OrbitFrame = {
  globeCenter: ScreenPoint;
  globeRadius: number;
  viewportCenter: Coordinate;
  groundPaths: string[];
  orbitPaths: string[];
};

type SatelliteOrbitInnerProps = Omit<
  SatelliteOrbitProps,
  | "orbitColor"
  | "orbitGlowColor"
  | "groundTrackColor"
  | "satelliteConnectorColor"
> &
  ResolvedSatelliteColors;

export type SatelliteOrbitData = {
  inclination?: number;
  ascendingNode?: number;
  orbitColor?: string;
  orbitGlowColor?: string;
  groundTrackColor?: string;
  orbitWidth?: number;
  groundTrackWidth?: number;
  orbitLineStyle?: LineStyle;
  groundTrackLineStyle?: LineStyle;
  name?: string;
};

export type SatelliteOrbitsProps = {
  orbits: readonly SatelliteOrbitData[];
  duration?: number;
  samples?: number;
  altitudePx?: number;
  satelliteConnectorColor?: string;
  satelliteIconSvg?: string;
  /**
   * Rotation offset in degrees applied on top of the computed orbit tangent.
   * Useful when the custom SVG's "forward" direction does not point up.
   */
  satelliteIconRotationOffset?: number;
  showGlow?: boolean;
  showConnector?: boolean;
  connectorLineStyle?: LineStyle;
  animate?: boolean | SatelliteAnimationConfig;
  showLabel?: boolean;
  labelPosition?: "top" | "bottom" | "left" | "right";
};

function resolveOrbitColors(
  mapTheme: SatelliteMapTheme,
  {
    orbitColor,
    orbitGlowColor,
    groundTrackColor,
    satelliteConnectorColor,
  }: Partial<
    Omit<ResolvedSatelliteColors, "satelliteDotColor" | "satellitePanelColor">
  >,
): ResolvedSatelliteColors {
  return {
    orbitColor:
      orbitColor ??
      (mapTheme === "dark"
        ? SATELLITE_ORBIT_COLOR_DARK
        : SATELLITE_ORBIT_COLOR_LIGHT),
    orbitGlowColor:
      orbitGlowColor ??
      (mapTheme === "dark"
        ? SATELLITE_ORBIT_GLOW_COLOR_DARK
        : SATELLITE_ORBIT_GLOW_COLOR_LIGHT),
    groundTrackColor:
      groundTrackColor ??
      (mapTheme === "dark"
        ? SATELLITE_GROUND_TRACK_COLOR_DARK
        : SATELLITE_GROUND_TRACK_COLOR_LIGHT),
    satelliteDotColor:
      mapTheme === "dark"
        ? SATELLITE_DOT_COLOR_DARK
        : SATELLITE_DOT_COLOR_LIGHT,
    satellitePanelColor:
      mapTheme === "dark"
        ? SATELLITE_PANEL_COLOR_DARK
        : SATELLITE_PANEL_COLOR_LIGHT,
    satelliteConnectorColor:
      satelliteConnectorColor ??
      (mapTheme === "dark"
        ? SATELLITE_CONNECTOR_COLOR_DARK
        : SATELLITE_CONNECTOR_COLOR_LIGHT),
  };
}

function isOrbitPointVisible(
  viewportCenter: Coordinate,
  point: Coordinate,
): boolean {
  return angularDistanceDegrees(viewportCenter, point) < 88;
}

function buildOrbitFrame(
  map: MapLibreGL.Map,
  orbitCoordinates: Coordinate[],
  altitudePx: number,
): OrbitFrame {
  const mapCenter = map.getCenter();
  const viewportCenter: Coordinate = [mapCenter.lng, mapCenter.lat];
  const globeCenter = map.project(viewportCenter);
  const globeRadius = estimateGlobeScreenRadius(map, viewportCenter);
  const isVisible = (point: Coordinate) =>
    isOrbitPointVisible(viewportCenter, point);
  const visibleSegments = splitVisibleSegments(orbitCoordinates, isVisible);

  const groundPaths: string[] = [];
  const orbitPaths: string[] = [];

  for (const segment of visibleSegments) {
    const groundPoints: ScreenPoint[] = [];
    const elevatedPoints: ScreenPoint[] = [];

    for (const point of segment) {
      const projectedPoint = map.project(point);
      groundPoints.push(projectedPoint);
      elevatedPoints.push(
        elevatePoint(projectedPoint, globeCenter, altitudePx, globeRadius),
      );
    }

    groundPaths.push(pointsToPath(groundPoints));
    orbitPaths.push(pointsToPath(elevatedPoints));
  }

  return {
    globeCenter,
    globeRadius,
    viewportCenter,
    groundPaths,
    orbitPaths,
  };
}

const LABEL_OFFSETS: Record<string, { x: number; y: number }> = {
  top: { x: 0, y: -20 },
  bottom: { x: 0, y: 20 },
  left: { x: -16, y: 0 },
  right: { x: 16, y: 0 },
};

const LABEL_TEXT_ANCHORS: Record<string, "start" | "middle" | "end"> = {
  top: "middle",
  bottom: "middle",
  left: "end",
  right: "start",
};

const SatelliteMarker = memo(function SatelliteMarker({
  satellitePoint,
  satelliteSurfacePoint,
  satelliteAngle,
  orbitGlowColor,
  satelliteDotColor,
  satellitePanelColor,
  satelliteConnectorColor,
  satelliteIconSvg,
  satelliteIconRotationOffset = 0,
  showGlow,
  showConnector,
  connectorLineStyle,
  name,
  showLabel,
  labelPosition = "right",
}: {
  satellitePoint: ScreenPoint;
  satelliteSurfacePoint: ScreenPoint;
  satelliteAngle: number;
  orbitGlowColor: string;
  satelliteDotColor: string;
  satellitePanelColor: string;
  satelliteConnectorColor: string;
  satelliteIconSvg?: string;
  satelliteIconRotationOffset?: number;
  showGlow: boolean;
  showConnector: boolean;
  connectorLineStyle: LineStyle;
  name?: string;
  showLabel?: boolean;
  labelPosition?: "top" | "bottom" | "left" | "right";
}) {
  const labelOffset = LABEL_OFFSETS[labelPosition];
  const textAnchor = LABEL_TEXT_ANCHORS[labelPosition];
  const resolvedSatelliteIconSvg = useMemo(
    () => resolveSatelliteIconSvg(satelliteIconSvg),
    [satelliteIconSvg],
  );

  return (
    <>
      {showConnector && (
        <line
          x1={satelliteSurfacePoint.x}
          y1={satelliteSurfacePoint.y}
          x2={satellitePoint.x}
          y2={satellitePoint.y}
          stroke={satelliteConnectorColor}
          strokeWidth="1"
          strokeDasharray={lineStyleToDashArray(connectorLineStyle)}
          strokeLinecap="round"
        />
      )}
      {showGlow && (
        <circle
          cx={satellitePoint.x}
          cy={satellitePoint.y}
          r="16"
          fill={orbitGlowColor}
        />
      )}
      <g
        transform={`translate(${satellitePoint.x} ${satellitePoint.y}) rotate(${satelliteAngle + satelliteIconRotationOffset})`}
      >
        {resolvedSatelliteIconSvg ? (
          <svg
            x="-12"
            y="-12"
            width="24"
            height="24"
            viewBox={resolvedSatelliteIconSvg.viewBox}
            overflow="visible"
            dangerouslySetInnerHTML={{
              __html: resolvedSatelliteIconSvg.innerMarkup,
            }}
          />
        ) : (
          <DefaultSatelliteIcon
            satelliteDotColor={satelliteDotColor}
            satellitePanelColor={satellitePanelColor}
            satelliteConnectorColor={satelliteConnectorColor}
          />
        )}
      </g>
      {showLabel && name && (
        <g transform={`translate(${satellitePoint.x} ${satellitePoint.y})`}>
          <text
            x={labelOffset.x}
            y={labelOffset.y}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            className="select-none"
            style={{
              fontSize: "10px",
              fontWeight: 500,
              fill: satelliteDotColor,
            }}
          >
            {name}
          </text>
        </g>
      )}
    </>
  );
});

const OrbitPathsLayer = memo(function OrbitPathsLayer({
  groundPaths,
  orbitPaths,
  groundTrackColor,
  orbitGlowColor,
  orbitColor,
  groundTrackWidth,
  orbitWidth,
  showGlow,
  orbitLineStyle,
  groundTrackLineStyle,
}: {
  groundPaths: string[];
  orbitPaths: string[];
  groundTrackColor: string;
  orbitGlowColor: string;
  orbitColor: string;
  groundTrackWidth: number;
  orbitWidth: number;
  showGlow: boolean;
  orbitLineStyle: LineStyle;
  groundTrackLineStyle: LineStyle;
}) {
  return (
    <>
      {groundPaths.map((path, index) => (
        <path
          key={`ground-${index}`}
          d={path}
          fill="none"
          stroke={groundTrackColor}
          strokeWidth={groundTrackWidth}
          strokeDasharray={lineStyleToDashArray(groundTrackLineStyle)}
          strokeLinecap="round"
        />
      ))}

      {showGlow &&
        orbitPaths.map((path, index) => (
          <path
            key={`orbit-glow-${index}`}
            d={path}
            fill="none"
            stroke={orbitGlowColor}
            strokeWidth="11"
            strokeLinecap="round"
          />
        ))}

      {orbitPaths.map((path, index) => (
        <path
          key={`orbit-${index}`}
          d={path}
          fill="none"
          stroke={orbitColor}
          strokeWidth={orbitWidth}
          strokeDasharray={lineStyleToDashArray(orbitLineStyle)}
          strokeLinecap="round"
        />
      ))}
    </>
  );
});

function SatelliteOrbitInner({
  inclination = 62,
  ascendingNode = -28,
  duration = 16000,
  samples = 300,
  altitudePx = 28,
  orbitColor,
  orbitGlowColor,
  groundTrackColor,
  satelliteDotColor,
  satellitePanelColor,
  satelliteConnectorColor,
  satelliteIconSvg,
  satelliteIconRotationOffset,
  orbitWidth = 2.2,
  groundTrackWidth = 1.4,
  showGlow = true,
  showConnector = true,
  orbitLineStyle = "solid",
  groundTrackLineStyle = "dash",
  connectorLineStyle = "dash",
  animate,
  name,
  showLabel = true,
  labelPosition = "right",
}: SatelliteOrbitInnerProps & {
  name?: string;
  showLabel?: boolean;
  labelPosition?: "top" | "bottom" | "left" | "right";
}) {
  const { map, isLoaded } = useMap();

  const isAnimating = Boolean(animate);
  const effectiveDuration =
    animate !== true && animate ? (animate.duration ?? duration) : duration;

  const [frameNow, setFrameNow] = useState(() =>
    typeof performance === "undefined" ? 0 : performance.now(),
  );
  const [viewportTick, setViewportTick] = useState(0);

  const orbitCoordinates = useMemo(
    () => buildOrbitCoordinates(samples, inclination, ascendingNode),
    [ascendingNode, inclination, samples],
  );

  useEffect(() => {
    if (!isAnimating) return;

    let animationFrame = 0;

    const loop = (now: number) => {
      startTransition(() => {
        setFrameNow(now);
      });
      animationFrame = window.requestAnimationFrame(loop);
    };

    animationFrame = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [isAnimating]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const rerender = () => {
      startTransition(() => {
        setViewportTick((current) => current + 1);
      });
    };

    for (const eventName of VIEWPORT_EVENTS) {
      map.on(eventName, rerender);
    }

    return () => {
      for (const eventName of VIEWPORT_EVENTS) {
        map.off(eventName, rerender);
      }
    };
  }, [isLoaded, map]);

  const orbitFrame = useMemo(() => {
    if (!map || !isLoaded) return null;
    void viewportTick;
    return buildOrbitFrame(map, orbitCoordinates, altitudePx);
  }, [altitudePx, isLoaded, map, orbitCoordinates, viewportTick]);

  if (!map || !isLoaded || !orbitFrame) {
    return null;
  }

  const container = map.getContainer();
  const width = container.clientWidth;
  const height = container.clientHeight;
  const viewportCenter = orbitFrame.viewportCenter;

  const progress =
    effectiveDuration > 0
      ? (frameNow % effectiveDuration) / effectiveDuration
      : 0;
  const phase = progress * Math.PI * 2;
  const nextPhase = ((progress + 0.005) % 1) * Math.PI * 2;
  const satelliteCoordinate = orbitPointFromPhase(
    phase,
    inclination,
    ascendingNode,
  );
  const nextCoordinate = orbitPointFromPhase(
    nextPhase,
    inclination,
    ascendingNode,
  );

  const satelliteVisible = isOrbitPointVisible(
    viewportCenter,
    satelliteCoordinate,
  );
  const satelliteSurfacePoint = satelliteVisible
    ? map.project(satelliteCoordinate)
    : null;
  const satellitePoint = satelliteSurfacePoint
    ? elevatePoint(
        satelliteSurfacePoint,
        orbitFrame.globeCenter,
        altitudePx,
        orbitFrame.globeRadius,
      )
    : null;
  const satelliteAngle = satellitePoint
    ? satelliteRotation(
        satellitePoint,
        elevatePoint(
          map.project(nextCoordinate),
          orbitFrame.globeCenter,
          altitudePx,
          orbitFrame.globeRadius,
        ),
      )
    : 0;

  return createPortal(
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      data-orbit-frame={viewportTick}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
      >
        <OrbitPathsLayer
          groundPaths={orbitFrame.groundPaths}
          orbitPaths={orbitFrame.orbitPaths}
          groundTrackColor={groundTrackColor}
          orbitGlowColor={orbitGlowColor}
          orbitColor={orbitColor}
          groundTrackWidth={groundTrackWidth}
          orbitWidth={orbitWidth}
          showGlow={showGlow}
          orbitLineStyle={orbitLineStyle}
          groundTrackLineStyle={groundTrackLineStyle}
        />

        {satelliteVisible && satellitePoint && satelliteSurfacePoint && (
          <SatelliteMarker
            satellitePoint={satellitePoint}
            satelliteSurfacePoint={satelliteSurfacePoint}
            satelliteAngle={satelliteAngle}
            orbitGlowColor={orbitGlowColor}
            satelliteDotColor={satelliteDotColor}
            satellitePanelColor={satellitePanelColor}
            satelliteConnectorColor={satelliteConnectorColor}
            satelliteIconSvg={satelliteIconSvg}
            satelliteIconRotationOffset={satelliteIconRotationOffset}
            showGlow={showGlow}
            showConnector={showConnector}
            connectorLineStyle={connectorLineStyle}
            name={name}
            showLabel={showLabel}
            labelPosition={labelPosition}
          />
        )}
      </svg>
    </div>,
    container,
  );
}

function SatelliteOrbit(props: SatelliteOrbitProps) {
  const mapTheme = useSatelliteMapTheme();
  const resolvedColors = resolveOrbitColors(mapTheme, props);

  return <SatelliteOrbitInner {...props} {...resolvedColors} />;
}

function SatelliteOrbits({
  orbits,
  duration = 16000,
  samples = 300,
  altitudePx = 28,
  satelliteConnectorColor,
  satelliteIconSvg,
  satelliteIconRotationOffset = 0,
  showGlow = true,
  showConnector = true,
  connectorLineStyle = "dash",
  animate,
  showLabel = true,
  labelPosition = "right",
}: SatelliteOrbitsProps) {
  const mapTheme = useSatelliteMapTheme();
  const sharedSatelliteColors = resolveOrbitColors(mapTheme, {
    satelliteConnectorColor,
  });

  return (
    <>
      {orbits.map((orbit, index) => (
        <SatelliteOrbitInner
          key={`orbit-${index}-${orbit.inclination ?? 62}-${orbit.ascendingNode ?? -28}`}
          inclination={orbit.inclination ?? 62}
          ascendingNode={orbit.ascendingNode ?? -28}
          duration={duration}
          samples={samples}
          altitudePx={altitudePx}
          {...resolveOrbitColors(mapTheme, {
            orbitColor: orbit.orbitColor,
            orbitGlowColor: orbit.orbitGlowColor,
            groundTrackColor: orbit.groundTrackColor,
            satelliteConnectorColor:
              sharedSatelliteColors.satelliteConnectorColor,
          })}
          orbitWidth={orbit.orbitWidth}
          groundTrackWidth={orbit.groundTrackWidth}
          orbitLineStyle={orbit.orbitLineStyle}
          groundTrackLineStyle={orbit.groundTrackLineStyle}
          showGlow={showGlow}
          showConnector={showConnector}
          connectorLineStyle={connectorLineStyle}
          animate={animate}
          satelliteIconSvg={satelliteIconSvg}
          satelliteIconRotationOffset={satelliteIconRotationOffset}
          name={orbit.name}
          showLabel={showLabel}
          labelPosition={labelPosition}
        />
      ))}
    </>
  );
}

export { SatelliteOrbit, SatelliteOrbits };

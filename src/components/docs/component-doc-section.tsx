"use client";

import { useReducedMotion } from "framer-motion";
import { CopyButton } from "@/components/ui/copy-button";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { mapStyles } from "@/components/home/home-config";
import { useResponsiveZoom } from "@/lib/map-responsive-zoom";
import { Map } from "@/components/ui/map";
import { ShikiCodeBlock } from "@/components/ui/shiki-code-block";

import {
  buildSnippet,
  renderComponentPreview,
  type AircraftTrailPlayground,
  type AirportPlayground,
  type ComponentPreviewArgs,
  type FlightFlowPlayground,
  type FlightNetworkPlayground,
  type FlightRangePlayground,
  type FlightRouteLabelPlayground,
  type FlightRouteLikePlayground,
  type FlightTrackerPlayground,
} from "./component-docs-helpers";
import { type ComponentDoc } from "./component-docs-config";
import { DocsMapMountWhenVisible } from "./docs-map-mount-when-visible";
import { PropsTable, type ControlConfig, type ControlMap } from "./props-table";
import {
  DEFAULT_SATELLITE_ORBIT_PLAYGROUND,
  type SatelliteOrbitPlayground,
} from "@/components/satellite/satellite-orbit-playground-controls";

const SATELLITE_ICON_SVG_PLACEHOLDER =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">\n  <path d="..." />\n</svg>';

const DEFAULT_AIRPORT: AirportPlayground = {
  showLabel: true,
  labelPosition: "top",
};

const DEFAULT_ROUTE_LIKE: FlightRouteLikePlayground = {
  showAirports: true,
  showLabel: true,
  hoverEffect: true,
  animate: true,
  tripType: "round-trip",
  lineStyle: "solid",
};

const FLIGHT_ROUTE_COLOR_LIGHT = "#0a0a0a";

const noopViewportChange = () => {};
const FLIGHT_ROUTE_COLOR_DARK = "#e8e8e8";

const DEFAULT_FLIGHT_TRACKER: FlightTrackerPlayground = {
  progress: 0.58,
  completedColor: "#0f172a",
  remainingColor: "#94a3b8",
  width: 3,
  showAirports: true,
  showLabel: true,
  altitude: 36000,
  speed: 486,
  showInfo: true,
  iconSize: 26,
  npoints: 140,
};

const DEFAULT_FLIGHT_ROUTE_LABEL: FlightRouteLabelPlayground = {
  label: "BR 198 · 42 min",
  mode: "aircraft",
  position: 0.08,
  rotate: false,
  offset: [0, 0],
  size: "md",
  labelPosition: "right",
  animate: true,
  duration: 7200,
  loop: true,
  iconSize: 22,
  npoints: 100,
};

const DEFAULT_FLIGHT_NETWORK: FlightNetworkPlayground = {
  color: "#64748b",
  highlightColor: "#0f172a",
  minRouteWidth: 0.75,
  maxRouteWidth: 2.75,
  minNodeSize: 3,
  maxNodeSize: 7.5,
  showLabels: true,
  selectedAirport: null,
  npoints: 100,
};

const DEFAULT_FLIGHT_RANGE: FlightRangePlayground = {
  outlineWidth: 1.5,
  showOrigin: true,
  showLabel: true,
  steps: 128,
};

const DEFAULT_AIRCRAFT_TRAIL: AircraftTrailPlayground = {
  color: "#0f172a",
  altitudePalette: "aviation",
  width: 2.5,
  startOpacity: 0.42,
  endOpacity: 1,
  showGlow: true,
  showAircraft: true,
  iconSize: 24,
};

const DEFAULT_FLIGHT_FLOW: FlightFlowPlayground = {
  color: "#f59e0b",
  showRoutes: false,
  routeColor: "#94a3b8",
  routeOpacity: 0.16,
  routeWidth: 1,
  animate: true,
  aircraftCount: 30,
  aircraftSize: 18,
  duration: 12000,
  npoints: 100,
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function booleanControl(
  value: boolean,
  onChange: (value: boolean) => void,
  disabled = false,
): ControlConfig {
  return {
    kind: "select",
    value: String(value),
    onChange: (nextValue) => onChange(nextValue === "true"),
    options: ["true", "false"],
    disabled,
  };
}

function getThemeAwareRouteColor() {
  if (typeof window === "undefined") {
    return FLIGHT_ROUTE_COLOR_LIGHT;
  }

  if (document.documentElement.classList.contains("dark")) {
    return FLIGHT_ROUTE_COLOR_DARK;
  }

  if (document.documentElement.classList.contains("light")) {
    return FLIGHT_ROUTE_COLOR_LIGHT;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? FLIGHT_ROUTE_COLOR_DARK
    : FLIGHT_ROUTE_COLOR_LIGHT;
}

function useThemeAwareRouteColor() {
  const [color, setColor] = useState(FLIGHT_ROUTE_COLOR_LIGHT);

  useEffect(() => {
    const syncColor = () => setColor(getThemeAwareRouteColor());

    syncColor();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const observer = new MutationObserver(syncColor);

    mediaQuery.addEventListener("change", syncColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      mediaQuery.removeEventListener("change", syncColor);
      observer.disconnect();
    };
  }, []);

  return color;
}

function routeLikeControls(
  play: FlightRouteLikePlayground,
  themeColor: string,
  set: Dispatch<SetStateAction<FlightRouteLikePlayground>>,
): ControlMap {
  return {
    color: {
      kind: "color",
      value: play.color ?? themeColor,
      onChange: (value) => set((prev) => ({ ...prev, color: value })),
    },
    showAirports: {
      kind: "select",
      value: String(play.showAirports),
      onChange: (value) =>
        set((prev) => ({ ...prev, showAirports: value === "true" })),
      options: ["true", "false"],
    },
    showLabel: {
      kind: "select",
      value: String(play.showLabel),
      onChange: (value) =>
        set((prev) => ({ ...prev, showLabel: value === "true" })),
      options: ["true", "false"],
    },
    hoverEffect: {
      kind: "select",
      value: String(play.hoverEffect),
      onChange: (value) =>
        set((prev) => ({ ...prev, hoverEffect: value === "true" })),
      options: ["true", "false"],
    },
    animate: {
      kind: "select",
      value: String(play.animate),
      onChange: (value) =>
        set((prev) => ({ ...prev, animate: value === "true" })),
      options: ["true", "false"],
    },
    tripType: {
      kind: "select",
      value: play.tripType,
      onChange: (value) =>
        set((prev) => ({
          ...prev,
          tripType: value as FlightRouteLikePlayground["tripType"],
        })),
      options: ["one-way", "round-trip"],
    },
    lineStyle: {
      kind: "select",
      value: play.lineStyle,
      onChange: (value) =>
        set((prev) => ({
          ...prev,
          lineStyle: value as FlightRouteLikePlayground["lineStyle"],
        })),
      options: ["solid", "dash", "dot"],
    },
  };
}

function DocSectionShell({
  component,
  snippet,
  controls,
  previewArgs,
}: {
  component: ComponentDoc;
  snippet: string;
  controls: ControlMap;
  previewArgs: ComponentPreviewArgs;
}) {
  const zoom = useResponsiveZoom(component.mapZoom);
  const reducedMotion = useReducedMotion();

  return (
    <section
      id={component.id}
      className="min-w-0 scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-7"
    >
      <p className="section-kicker">Component</p>
      <h2 className="mt-3 font-mono text-xl font-medium tracking-tight text-slate-950 sm:text-2xl">
        {component.name}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {component.description}
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-[#ececeb]">
        <DocsMapMountWhenVisible>
          <Map
            className="h-80 w-full sm:h-96"
            viewport={{
              center: component.mapCenter,
              zoom,
            }}
            onViewportChange={noopViewportChange}
            styles={mapStyles}
            projection={component.projection}
          >
            {renderComponentPreview(previewArgs, !reducedMotion)}
          </Map>
        </DocsMapMountWhenVisible>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl bg-slate-950 text-slate-100">
        <div className="flex items-center justify-between border-b border-white/10 px-4 font-mono text-[10px] text-slate-300">
          <span>USAGE · TSX</span>
          <CopyButton
            key={snippet}
            text={snippet}
            label={`Copy ${component.name} example`}
            className="hover:bg-white/10"
          />
        </div>
        <div className="custom-scrollbar max-w-full overflow-x-auto px-4 py-4 text-xs leading-6">
          <ShikiCodeBlock code={snippet} />
        </div>
      </div>

      {reducedMotion ? (
        <p className="mt-3 text-xs text-slate-500">
          Preview animations are off to respect your reduced motion preference.
        </p>
      ) : null}

      <h3 className="mt-5 text-lg font-semibold text-slate-900">Props</h3>
      <div className="mt-3">
        <PropsTable props={component.props} controls={controls} />
      </div>

      {component.extra?.map((extraTable, index) => (
        <div
          key={`${component.id}-extra-${index}-${extraTable.title}`}
          className="mt-5"
        >
          <h4 className="text-base font-semibold text-slate-900">
            {extraTable.title}
          </h4>
          <div className="mt-3">
            <PropsTable props={extraTable.props} />
          </div>
        </div>
      ))}
    </section>
  );
}

function AirportDocSection({ component }: { component: ComponentDoc }) {
  const [airport, setAirport] = useState<AirportPlayground>(DEFAULT_AIRPORT);

  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "flight-airport", airport }),
    [airport],
  );

  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);

  const controls = useMemo((): ControlMap => {
    return {
      showLabel: {
        kind: "select",
        value: String(airport.showLabel),
        onChange: (value) =>
          setAirport((prev) => ({
            ...prev,
            showLabel: value === "true",
          })),
        options: ["true", "false"],
      },
      labelPosition: {
        kind: "select",
        value: airport.labelPosition,
        onChange: (value) =>
          setAirport((prev) => ({
            ...prev,
            labelPosition: value as AirportPlayground["labelPosition"],
          })),
        options: ["top", "bottom"],
      },
    };
  }, [airport]);

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function FlightRouteDocSection({ component }: { component: ComponentDoc }) {
  const themeColor = useThemeAwareRouteColor();
  const [route, setRoute] =
    useState<FlightRouteLikePlayground>(DEFAULT_ROUTE_LIKE);

  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "flight-route", route }),
    [route],
  );

  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);

  const controls = useMemo(
    () => routeLikeControls(route, themeColor, setRoute),
    [route, themeColor],
  );

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function FlightRoutesDocSection({ component }: { component: ComponentDoc }) {
  const themeColor = useThemeAwareRouteColor();
  const [routes, setRoutes] =
    useState<FlightRouteLikePlayground>(DEFAULT_ROUTE_LIKE);

  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "flight-routes", routes }),
    [routes],
  );

  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);

  const controls = useMemo(
    () => routeLikeControls(routes, themeColor, setRoutes),
    [routes, themeColor],
  );

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function FlightMultiRouteDocSection({
  component,
}: {
  component: ComponentDoc;
}) {
  const themeColor = useThemeAwareRouteColor();
  const [multiRoute, setMultiRoute] =
    useState<FlightRouteLikePlayground>(DEFAULT_ROUTE_LIKE);

  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "flight-multi-route", multiRoute }),
    [multiRoute],
  );

  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);

  const controls = useMemo(
    () => routeLikeControls(multiRoute, themeColor, setMultiRoute),
    [multiRoute, themeColor],
  );

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function SatelliteOrbitDocSection({ component }: { component: ComponentDoc }) {
  const themeColor = useThemeAwareRouteColor();
  const [satellite, setSatellite] = useState<SatelliteOrbitPlayground>(
    DEFAULT_SATELLITE_ORBIT_PLAYGROUND,
  );

  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "satellite-orbit", satellite }),
    [satellite],
  );

  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);

  const controls = useMemo((): ControlMap => {
    return {
      inclination: {
        kind: "number",
        value: satellite.inclination,
        onChange: (value) =>
          setSatellite((prev) => ({ ...prev, inclination: value })),
        step: 0.5,
      },
      ascendingNode: {
        kind: "number",
        value: satellite.ascendingNode,
        onChange: (value) =>
          setSatellite((prev) => ({ ...prev, ascendingNode: value })),
        step: 1,
      },
      altitudePx: {
        kind: "number",
        value: satellite.altitudePx,
        onChange: (value) =>
          setSatellite((prev) => ({ ...prev, altitudePx: value })),
        step: 1,
      },
      orbitWidth: {
        kind: "number",
        value: satellite.orbitWidth,
        onChange: (value) =>
          setSatellite((prev) => ({ ...prev, orbitWidth: value })),
        step: 0.1,
      },
      groundTrackWidth: {
        kind: "number",
        value: satellite.groundTrackWidth,
        onChange: (value) =>
          setSatellite((prev) => ({ ...prev, groundTrackWidth: value })),
        step: 0.1,
      },
      orbitColor: {
        kind: "color",
        value: satellite.orbitColor || themeColor,
        onChange: (value) =>
          setSatellite((prev) => ({ ...prev, orbitColor: value })),
      },
      orbitGlowColor: {
        kind: "color",
        value: satellite.orbitGlowColor || "#0f172a",
        onChange: (value) =>
          setSatellite((prev) => ({ ...prev, orbitGlowColor: value })),
      },
      groundTrackColor: {
        kind: "color",
        value: satellite.groundTrackColor || "#64748b",
        onChange: (value) =>
          setSatellite((prev) => ({ ...prev, groundTrackColor: value })),
      },
      satelliteConnectorColor: {
        kind: "color",
        value: satellite.satelliteConnectorColor || "#64748b",
        onChange: (value) =>
          setSatellite((prev) => ({
            ...prev,
            satelliteConnectorColor: value,
          })),
      },
      showGlow: {
        kind: "select",
        value: String(satellite.showGlow),
        onChange: (value) =>
          setSatellite((prev) => ({ ...prev, showGlow: value === "true" })),
        options: ["true", "false"],
      },
      showConnector: {
        kind: "select",
        value: String(satellite.showConnector),
        onChange: (value) =>
          setSatellite((prev) => ({
            ...prev,
            showConnector: value === "true",
          })),
        options: ["true", "false"],
      },
      orbitLineStyle: {
        kind: "select",
        value: satellite.orbitLineStyle,
        onChange: (value) =>
          setSatellite((prev) => ({
            ...prev,
            orbitLineStyle: value as SatelliteOrbitPlayground["orbitLineStyle"],
          })),
        options: ["solid", "dash", "dot"],
      },
      groundTrackLineStyle: {
        kind: "select",
        value: satellite.groundTrackLineStyle,
        onChange: (value) =>
          setSatellite((prev) => ({
            ...prev,
            groundTrackLineStyle:
              value as SatelliteOrbitPlayground["groundTrackLineStyle"],
          })),
        options: ["solid", "dash", "dot"],
      },
      connectorLineStyle: {
        kind: "select",
        value: satellite.connectorLineStyle,
        onChange: (value) =>
          setSatellite((prev) => ({
            ...prev,
            connectorLineStyle:
              value as SatelliteOrbitPlayground["connectorLineStyle"],
          })),
        options: ["solid", "dash", "dot"],
      },
      animate: {
        kind: "select",
        value: String(satellite.animate),
        onChange: (value) =>
          setSatellite((prev) => ({ ...prev, animate: value === "true" })),
        options: ["true", "false"],
      },
      duration: {
        kind: "number",
        value: satellite.duration,
        onChange: (value) =>
          setSatellite((prev) => ({ ...prev, duration: value })),
        step: 500,
        disabled: !satellite.animate,
      },
      name: {
        kind: "text",
        value: satellite.name,
        onChange: (value) => setSatellite((prev) => ({ ...prev, name: value })),
      },
      showLabel: {
        kind: "select",
        value: String(satellite.showLabel),
        onChange: (value) =>
          setSatellite((prev) => ({ ...prev, showLabel: value === "true" })),
        options: ["true", "false"],
      },
      labelPosition: {
        kind: "select",
        value: satellite.labelPosition,
        onChange: (value) =>
          setSatellite((prev) => ({
            ...prev,
            labelPosition: value as SatelliteOrbitPlayground["labelPosition"],
          })),
        options: ["top", "right", "bottom", "left"],
        disabled: !satellite.showLabel,
      },
      satelliteIconSvg: {
        kind: "textarea",
        value: satellite.satelliteIconSvg,
        onChange: (value) =>
          setSatellite((prev) => ({ ...prev, satelliteIconSvg: value })),
        placeholder: SATELLITE_ICON_SVG_PLACEHOLDER,
      },
      satelliteIconRotationOffset: {
        kind: "number",
        value: satellite.satelliteIconRotationOffset,
        onChange: (value) =>
          setSatellite((prev) => ({
            ...prev,
            satelliteIconRotationOffset: value,
          })),
        step: 1,
      },
    };
  }, [satellite, themeColor]);

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function SatelliteOrbitsDocSection({ component }: { component: ComponentDoc }) {
  const [satellites, setSatellites] = useState<SatelliteOrbitPlayground>(
    DEFAULT_SATELLITE_ORBIT_PLAYGROUND,
  );

  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "satellite-orbits", satellites }),
    [satellites],
  );

  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);

  const controls = useMemo((): ControlMap => {
    return {
      duration: {
        kind: "number",
        value: satellites.duration,
        onChange: (value) =>
          setSatellites((prev) => ({ ...prev, duration: value })),
        step: 500,
        disabled: !satellites.animate,
      },
      altitudePx: {
        kind: "number",
        value: satellites.altitudePx,
        onChange: (value) =>
          setSatellites((prev) => ({ ...prev, altitudePx: value })),
        step: 1,
      },
      satelliteConnectorColor: {
        kind: "color",
        value: satellites.satelliteConnectorColor || "#64748b",
        onChange: (value) =>
          setSatellites((prev) => ({
            ...prev,
            satelliteConnectorColor: value,
          })),
      },
      satelliteIconSvg: {
        kind: "textarea",
        value: satellites.satelliteIconSvg,
        onChange: (value) =>
          setSatellites((prev) => ({ ...prev, satelliteIconSvg: value })),
        placeholder: SATELLITE_ICON_SVG_PLACEHOLDER,
      },
      satelliteIconRotationOffset: {
        kind: "number",
        value: satellites.satelliteIconRotationOffset,
        onChange: (value) =>
          setSatellites((prev) => ({
            ...prev,
            satelliteIconRotationOffset: value,
          })),
        step: 1,
      },
      showGlow: {
        kind: "select",
        value: String(satellites.showGlow),
        onChange: (value) =>
          setSatellites((prev) => ({ ...prev, showGlow: value === "true" })),
        options: ["true", "false"],
      },
      showConnector: {
        kind: "select",
        value: String(satellites.showConnector),
        onChange: (value) =>
          setSatellites((prev) => ({
            ...prev,
            showConnector: value === "true",
          })),
        options: ["true", "false"],
      },
      connectorLineStyle: {
        kind: "select",
        value: satellites.connectorLineStyle,
        onChange: (value) =>
          setSatellites((prev) => ({
            ...prev,
            connectorLineStyle:
              value as SatelliteOrbitPlayground["connectorLineStyle"],
          })),
        options: ["solid", "dash", "dot"],
      },
      animate: {
        kind: "select",
        value: String(satellites.animate),
        onChange: (value) =>
          setSatellites((prev) => ({ ...prev, animate: value === "true" })),
        options: ["true", "false"],
      },
      showLabel: {
        kind: "select",
        value: String(satellites.showLabel),
        onChange: (value) =>
          setSatellites((prev) => ({ ...prev, showLabel: value === "true" })),
        options: ["true", "false"],
      },
      labelPosition: {
        kind: "select",
        value: satellites.labelPosition,
        onChange: (value) =>
          setSatellites((prev) => ({
            ...prev,
            labelPosition: value as SatelliteOrbitPlayground["labelPosition"],
          })),
        options: ["top", "right", "bottom", "left"],
        disabled: !satellites.showLabel,
      },
    };
  }, [satellites]);

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function FlightTrackerDocSection({ component }: { component: ComponentDoc }) {
  const [tracker, setTracker] = useState<FlightTrackerPlayground>(
    DEFAULT_FLIGHT_TRACKER,
  );
  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "flight-tracker", tracker }),
    [tracker],
  );
  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);
  const controls = useMemo((): ControlMap => {
    return {
      progress: {
        kind: "number",
        value: tracker.progress,
        onChange: (value) =>
          setTracker((prev) => ({
            ...prev,
            progress: clampNumber(value, 0, 1),
          })),
        step: 0.05,
      },
      completedColor: {
        kind: "color",
        value: tracker.completedColor,
        onChange: (value) =>
          setTracker((prev) => ({ ...prev, completedColor: value })),
      },
      remainingColor: {
        kind: "color",
        value: tracker.remainingColor,
        onChange: (value) =>
          setTracker((prev) => ({ ...prev, remainingColor: value })),
      },
      width: {
        kind: "number",
        value: tracker.width,
        onChange: (value) =>
          setTracker((prev) => ({
            ...prev,
            width: clampNumber(value, 0.5, 12),
          })),
        step: 0.5,
      },
      showAirports: booleanControl(tracker.showAirports, (value) =>
        setTracker((prev) => ({ ...prev, showAirports: value })),
      ),
      showLabel: {
        ...booleanControl(tracker.showLabel, (value) =>
          setTracker((prev) => ({ ...prev, showLabel: value })),
        ),
        disabled: !tracker.showAirports,
      },
      altitude: {
        kind: "number",
        value: tracker.altitude,
        onChange: (value) =>
          setTracker((prev) => ({
            ...prev,
            altitude: clampNumber(value, 0, 70000),
          })),
        step: 1000,
      },
      speed: {
        kind: "number",
        value: tracker.speed,
        onChange: (value) =>
          setTracker((prev) => ({
            ...prev,
            speed: clampNumber(value, 0, 1500),
          })),
        step: 10,
      },
      showInfo: booleanControl(tracker.showInfo, (value) =>
        setTracker((prev) => ({ ...prev, showInfo: value })),
      ),
      iconSize: {
        kind: "number",
        value: tracker.iconSize,
        onChange: (value) =>
          setTracker((prev) => ({
            ...prev,
            iconSize: clampNumber(value, 8, 64),
          })),
        step: 1,
      },
      npoints: {
        kind: "number",
        value: tracker.npoints,
        onChange: (value) =>
          setTracker((prev) => ({
            ...prev,
            npoints: Math.round(clampNumber(value, 16, 500)),
          })),
        step: 10,
      },
    };
  }, [tracker]);

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function FlightRouteLabelDocSection({
  component,
}: {
  component: ComponentDoc;
}) {
  const [routeLabel, setRouteLabel] = useState<FlightRouteLabelPlayground>(
    DEFAULT_FLIGHT_ROUTE_LABEL,
  );
  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "flight-route-label", routeLabel }),
    [routeLabel],
  );
  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);
  const controls = useMemo((): ControlMap => {
    const isAircraftMode = routeLabel.mode === "aircraft";
    return {
      mode: {
        kind: "select",
        value: routeLabel.mode,
        onChange: (value) =>
          setRouteLabel((prev) => ({
            ...prev,
            mode: value as FlightRouteLabelPlayground["mode"],
            position: value === "aircraft" ? 0.08 : 0.5,
            rotate: value === "route",
          })),
        options: ["route", "aircraft"],
      },
      children: {
        kind: "text",
        value: routeLabel.label,
        onChange: (value) =>
          setRouteLabel((prev) => ({ ...prev, label: value })),
      },
      position: {
        kind: "number",
        value: routeLabel.position,
        onChange: (value) =>
          setRouteLabel((prev) => ({
            ...prev,
            position: clampNumber(value, 0, 1),
          })),
        step: 0.05,
      },
      rotate: booleanControl(
        routeLabel.rotate,
        (value) => setRouteLabel((prev) => ({ ...prev, rotate: value })),
        isAircraftMode,
      ),
      offset: {
        kind: "number-pair",
        value: routeLabel.offset,
        onChange: (value) =>
          setRouteLabel((prev) => ({ ...prev, offset: value })),
        labels: ["x", "y"],
        step: 1,
      },
      size: {
        kind: "select",
        value: routeLabel.size,
        onChange: (value) =>
          setRouteLabel((prev) => ({
            ...prev,
            size: value as FlightRouteLabelPlayground["size"],
          })),
        options: ["sm", "md", "lg"],
      },
      labelPosition: {
        kind: "select",
        value: routeLabel.labelPosition,
        onChange: (value) =>
          setRouteLabel((prev) => ({
            ...prev,
            labelPosition: value as FlightRouteLabelPlayground["labelPosition"],
          })),
        options: ["top", "right", "bottom", "left"],
        disabled: !isAircraftMode,
      },
      animate: booleanControl(
        routeLabel.animate,
        (value) => setRouteLabel((prev) => ({ ...prev, animate: value })),
        !isAircraftMode,
      ),
      iconSize: {
        kind: "number",
        value: routeLabel.iconSize,
        onChange: (value) =>
          setRouteLabel((prev) => ({
            ...prev,
            iconSize: Math.round(clampNumber(value, 8, 64)),
          })),
        step: 1,
        disabled: !isAircraftMode,
      },
      npoints: {
        kind: "number",
        value: routeLabel.npoints,
        onChange: (value) =>
          setRouteLabel((prev) => ({
            ...prev,
            npoints: Math.round(clampNumber(value, 16, 500)),
          })),
        step: 10,
      },
    };
  }, [routeLabel]);

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function FlightNetworkDocSection({ component }: { component: ComponentDoc }) {
  const [network, setNetwork] = useState<FlightNetworkPlayground>(
    DEFAULT_FLIGHT_NETWORK,
  );
  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "flight-network", network }),
    [network],
  );
  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);
  const controls = useMemo((): ControlMap => {
    return {
      color: {
        kind: "color",
        value: network.color,
        onChange: (value) => setNetwork((prev) => ({ ...prev, color: value })),
      },
      highlightColor: {
        kind: "color",
        value: network.highlightColor,
        onChange: (value) =>
          setNetwork((prev) => ({ ...prev, highlightColor: value })),
      },
      minRouteWidth: {
        kind: "number",
        value: network.minRouteWidth,
        onChange: (value) =>
          setNetwork((prev) => ({
            ...prev,
            minRouteWidth: clampNumber(value, 0.25, 8),
          })),
        step: 0.25,
      },
      maxRouteWidth: {
        kind: "number",
        value: network.maxRouteWidth,
        onChange: (value) =>
          setNetwork((prev) => ({
            ...prev,
            maxRouteWidth: clampNumber(value, 0.5, 16),
          })),
        step: 0.25,
      },
      minNodeSize: {
        kind: "number",
        value: network.minNodeSize,
        onChange: (value) =>
          setNetwork((prev) => ({
            ...prev,
            minNodeSize: clampNumber(value, 1, 20),
          })),
        step: 0.5,
      },
      maxNodeSize: {
        kind: "number",
        value: network.maxNodeSize,
        onChange: (value) =>
          setNetwork((prev) => ({
            ...prev,
            maxNodeSize: clampNumber(value, 1, 32),
          })),
        step: 0.5,
      },
      showLabels: booleanControl(network.showLabels, (value) =>
        setNetwork((prev) => ({ ...prev, showLabels: value })),
      ),
      selectedAirport: {
        kind: "select",
        value: network.selectedAirport ?? "none",
        onChange: (value) =>
          setNetwork((prev) => ({
            ...prev,
            selectedAirport: value === "none" ? null : value,
          })),
        options: ["none", "TPE", "HND", "SIN", "BKK", "HKG"],
      },
      npoints: {
        kind: "number",
        value: network.npoints,
        onChange: (value) =>
          setNetwork((prev) => ({
            ...prev,
            npoints: Math.round(clampNumber(value, 16, 500)),
          })),
        step: 10,
      },
    };
  }, [network]);

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function FlightRangeDocSection({ component }: { component: ComponentDoc }) {
  const [range, setRange] =
    useState<FlightRangePlayground>(DEFAULT_FLIGHT_RANGE);
  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "flight-range", range }),
    [range],
  );
  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);
  const controls = useMemo((): ControlMap => {
    return {
      outlineWidth: {
        kind: "number",
        value: range.outlineWidth,
        onChange: (value) =>
          setRange((prev) => ({
            ...prev,
            outlineWidth: clampNumber(value, 0, 12),
          })),
        step: 0.25,
      },
      showOrigin: booleanControl(range.showOrigin, (value) =>
        setRange((prev) => ({ ...prev, showOrigin: value })),
      ),
      showLabel: {
        ...booleanControl(range.showLabel, (value) =>
          setRange((prev) => ({ ...prev, showLabel: value })),
        ),
        disabled: !range.showOrigin,
      },
      steps: {
        kind: "number",
        value: range.steps,
        onChange: (value) =>
          setRange((prev) => ({
            ...prev,
            steps: Math.round(clampNumber(value, 32, 720)),
          })),
        step: 16,
      },
    };
  }, [range]);

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function AircraftTrailDocSection({ component }: { component: ComponentDoc }) {
  const [trail, setTrail] = useState<AircraftTrailPlayground>(
    DEFAULT_AIRCRAFT_TRAIL,
  );
  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "aircraft-trail", trail }),
    [trail],
  );
  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);
  const controls = useMemo((): ControlMap => {
    return {
      color: {
        kind: "color",
        value: trail.color,
        onChange: (value) => setTrail((prev) => ({ ...prev, color: value })),
        disabled: trail.altitudePalette !== "none",
      },
      altitudeColorStops: {
        kind: "select",
        value: trail.altitudePalette,
        onChange: (value) =>
          setTrail((prev) => ({
            ...prev,
            altitudePalette:
              value as AircraftTrailPlayground["altitudePalette"],
            startOpacity:
              value === "none" ? 0.04 : Math.max(0.42, prev.startOpacity),
          })),
        options: ["none", "aviation", "warm"],
      },
      width: {
        kind: "number",
        value: trail.width,
        onChange: (value) =>
          setTrail((prev) => ({
            ...prev,
            width: clampNumber(value, 0.5, 12),
          })),
        step: 0.25,
      },
      startOpacity: {
        kind: "number",
        value: trail.startOpacity,
        onChange: (value) =>
          setTrail((prev) => ({
            ...prev,
            startOpacity: clampNumber(value, 0, 1),
          })),
        step: 0.05,
      },
      endOpacity: {
        kind: "number",
        value: trail.endOpacity,
        onChange: (value) =>
          setTrail((prev) => ({
            ...prev,
            endOpacity: clampNumber(value, 0, 1),
          })),
        step: 0.05,
      },
      showGlow: booleanControl(trail.showGlow, (value) =>
        setTrail((prev) => ({ ...prev, showGlow: value })),
      ),
      showAircraft: booleanControl(trail.showAircraft, (value) =>
        setTrail((prev) => ({ ...prev, showAircraft: value })),
      ),
      iconSize: {
        kind: "number",
        value: trail.iconSize,
        onChange: (value) =>
          setTrail((prev) => ({
            ...prev,
            iconSize: clampNumber(value, 8, 64),
          })),
        step: 1,
      },
    };
  }, [trail]);

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function FlightFlowDocSection({ component }: { component: ComponentDoc }) {
  const [flow, setFlow] = useState<FlightFlowPlayground>(DEFAULT_FLIGHT_FLOW);
  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "flight-flow", flow }),
    [flow],
  );
  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);
  const controls = useMemo((): ControlMap => {
    return {
      color: {
        kind: "color",
        value: flow.color,
        onChange: (value) => setFlow((prev) => ({ ...prev, color: value })),
      },
      showRoutes: booleanControl(flow.showRoutes, (value) =>
        setFlow((prev) => ({ ...prev, showRoutes: value })),
      ),
      routeColor: {
        kind: "color",
        value: flow.routeColor,
        onChange: (value) =>
          setFlow((prev) => ({ ...prev, routeColor: value })),
        disabled: !flow.showRoutes,
      },
      routeOpacity: {
        kind: "number",
        value: flow.routeOpacity,
        onChange: (value) =>
          setFlow((prev) => ({
            ...prev,
            routeOpacity: clampNumber(value, 0, 1),
          })),
        step: 0.05,
        disabled: !flow.showRoutes,
      },
      routeWidth: {
        kind: "number",
        value: flow.routeWidth,
        onChange: (value) =>
          setFlow((prev) => ({
            ...prev,
            routeWidth: clampNumber(value, 0.25, 12),
          })),
        step: 0.1,
        disabled: !flow.showRoutes,
      },
      animate: booleanControl(flow.animate, (value) =>
        setFlow((prev) => ({ ...prev, animate: value })),
      ),
      aircraftCount: {
        kind: "number",
        value: flow.aircraftCount,
        onChange: (value) =>
          setFlow((prev) => ({
            ...prev,
            aircraftCount: Math.round(clampNumber(value, 1, 200)),
          })),
        step: 1,
      },
      aircraftSize: {
        kind: "number",
        value: flow.aircraftSize,
        onChange: (value) =>
          setFlow((prev) => ({
            ...prev,
            aircraftSize: clampNumber(value, 8, 48),
          })),
        step: 1,
      },
      duration: {
        kind: "number",
        value: flow.duration,
        onChange: (value) =>
          setFlow((prev) => ({
            ...prev,
            duration: Math.round(clampNumber(value, 250, 60000)),
          })),
        step: 250,
        disabled: !flow.animate,
      },
      npoints: {
        kind: "number",
        value: flow.npoints,
        onChange: (value) =>
          setFlow((prev) => ({
            ...prev,
            npoints: Math.round(clampNumber(value, 16, 500)),
          })),
        step: 10,
      },
    };
  }, [flow]);

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

export function ComponentDocSection({
  component,
}: {
  component: ComponentDoc;
}) {
  switch (component.id) {
    case "flight-airport":
      return <AirportDocSection component={component} />;
    case "flight-route":
      return <FlightRouteDocSection component={component} />;
    case "flight-routes":
      return <FlightRoutesDocSection component={component} />;
    case "flight-multi-route":
      return <FlightMultiRouteDocSection component={component} />;
    case "flight-tracker":
      return <FlightTrackerDocSection component={component} />;
    case "flight-route-label":
      return <FlightRouteLabelDocSection component={component} />;
    case "flight-network":
      return <FlightNetworkDocSection component={component} />;
    case "flight-range":
      return <FlightRangeDocSection component={component} />;
    case "aircraft-trail":
      return <AircraftTrailDocSection component={component} />;
    case "flight-flow":
      return <FlightFlowDocSection component={component} />;
    case "satellite-orbit":
      return <SatelliteOrbitDocSection component={component} />;
    case "satellite-orbits":
      return <SatelliteOrbitsDocSection component={component} />;
  }
}

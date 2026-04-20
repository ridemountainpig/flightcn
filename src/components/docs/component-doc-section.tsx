"use client";

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
  type AirportPlayground,
  type ComponentPreviewArgs,
  type FlightRouteLikePlayground,
} from "./component-docs-helpers";
import { type ComponentDoc } from "./component-docs-config";
import { DocsMapMountWhenVisible } from "./docs-map-mount-when-visible";
import { PropsTable, type ControlMap } from "./props-table";
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

  return (
    <section
      id={component.id}
      className="min-w-0 scroll-mt-6 rounded-[1.8rem] border border-black/10 bg-white/85 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-4"
    >
      <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
        Component
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
        {component.name}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {component.description}
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-black/8 bg-[#ececeb]">
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
            {renderComponentPreview(previewArgs)}
          </Map>
        </DocsMapMountWhenVisible>
      </div>

      <div className="mt-4 max-w-full overflow-x-auto rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
        <ShikiCodeBlock code={snippet} />
      </div>

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
            <PropsTable props={extraTable.props} controls={controls} />
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
    case "satellite-orbit":
      return <SatelliteOrbitDocSection component={component} />;
    case "satellite-orbits":
      return <SatelliteOrbitsDocSection component={component} />;
  }
}

import {
  AircraftTrail,
  FlightAirport,
  FlightFlow,
  FlightMultiRoute,
  FlightNetwork,
  FlightRange,
  FlightRoute,
  FlightRouteLabel,
  FlightRoutes,
  FlightTracker,
} from "@/registry/flight";
import { SatelliteOrbit, SatelliteOrbits } from "@/registry/satellite-orbit";
import {
  buildSatelliteOrbitProps,
  buildSatelliteOrbitSnippet,
  type SatelliteOrbitPlayground,
} from "@/components/satellite/satellite-orbit-playground-controls";

export type AirportPlayground = {
  showLabel: boolean;
  labelPosition: "top" | "bottom";
};

/** Shared shape for FlightRoute, FlightRoutes, and FlightMultiRoute playgrounds */
export type FlightRouteLikePlayground = {
  color?: string;
  showAirports: boolean;
  showLabel: boolean;
  hoverEffect: boolean;
  animate: boolean;
  tripType: "one-way" | "round-trip";
  lineStyle: "solid" | "dash" | "dot";
};

export type FlightTrackerPlayground = {
  progress: number;
  completedColor: string;
  remainingColor: string;
  width: number;
  showAirports: boolean;
  showLabel: boolean;
  altitude: number;
  speed: number;
  showInfo: boolean;
  iconSize: number;
  npoints: number;
};

export type FlightRouteLabelPlayground = {
  label: string;
  mode: "route" | "aircraft";
  position: number;
  rotate: boolean;
  offset: [number, number];
  size: "sm" | "md" | "lg";
  labelPosition: "top" | "right" | "bottom" | "left";
  animate: boolean;
  duration: number;
  loop: boolean;
  iconSize: number;
  npoints: number;
};

export type FlightNetworkPlayground = {
  color: string;
  highlightColor: string;
  minRouteWidth: number;
  maxRouteWidth: number;
  minNodeSize: number;
  maxNodeSize: number;
  showLabels: boolean;
  selectedAirport: string | null;
  npoints: number;
};

export type FlightRangePlayground = {
  outlineWidth: number;
  showOrigin: boolean;
  showLabel: boolean;
  steps: number;
};

export type AircraftTrailPlayground = {
  color: string;
  altitudePalette: "none" | "aviation" | "warm";
  width: number;
  startOpacity: number;
  endOpacity: number;
  showGlow: boolean;
  showAircraft: boolean;
  iconSize: number;
};

export type FlightFlowPlayground = {
  color: string;
  showRoutes: boolean;
  routeColor: string;
  routeOpacity: number;
  routeWidth: number;
  animate: boolean;
  aircraftCount: number;
  aircraftSize: number;
  duration: number;
  npoints: number;
};

const NETWORK_ROUTES = [
  { from: "TPE", to: "HND", value: 18 },
  { from: "TPE", to: "SIN", value: 11 },
  { from: "TPE", to: "BKK", value: 8 },
  { from: "TPE", to: "HKG", value: 14 },
] as const;

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

function resolveTrailAltitudeColorStops(
  palette: AircraftTrailPlayground["altitudePalette"],
) {
  return palette === "none"
    ? undefined
    : TRAIL_ALTITUDE_COLOR_PALETTES[palette];
}

const FLOW_ROUTES = [
  { from: "HND", to: "TPE", value: 14 },
  { from: "ICN", to: "TPE", value: 8 },
  { from: "HKG", to: "TPE", value: 11 },
  { from: "BKK", to: "TPE", value: 7 },
  { from: "MNL", to: "TPE", value: 6 },
] as const;

function buildRouteLikeSnippetLines(
  route: FlightRouteLikePlayground,
  animateLiteral: string,
) {
  return [
    route.color ? `    color="${route.color}"` : null,
    `    showAirports={${route.showAirports}}`,
    `    showLabel={${route.showLabel}}`,
    `    hoverEffect={${route.hoverEffect}}`,
    `    tripType="${route.tripType}"`,
    `    lineStyle="${route.lineStyle}"`,
    `    animate={${animateLiteral}}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function withSnippetImports(
  componentNames: readonly string[],
  componentPath: "@/components/ui/flight" | "@/components/ui/satellite-orbit",
  snippet: string,
) {
  return `import { Map } from "@/components/ui/map";
import { ${componentNames.join(", ")} } from "${componentPath}";

${snippet}`;
}

export type ComponentPreviewArgs =
  | { id: "flight-airport"; airport: AirportPlayground }
  | { id: "flight-route"; route: FlightRouteLikePlayground }
  | { id: "flight-routes"; routes: FlightRouteLikePlayground }
  | { id: "flight-multi-route"; multiRoute: FlightRouteLikePlayground }
  | { id: "flight-tracker"; tracker: FlightTrackerPlayground }
  | { id: "flight-route-label"; routeLabel: FlightRouteLabelPlayground }
  | { id: "flight-network"; network: FlightNetworkPlayground }
  | { id: "flight-range"; range: FlightRangePlayground }
  | { id: "aircraft-trail"; trail: AircraftTrailPlayground }
  | { id: "flight-flow"; flow: FlightFlowPlayground }
  | { id: "satellite-orbit"; satellite: SatelliteOrbitPlayground }
  | { id: "satellite-orbits"; satellites: SatelliteOrbitPlayground };

export function renderComponentPreview(
  args: ComponentPreviewArgs,
  allowMotion = true,
) {
  switch (args.id) {
    case "flight-airport":
      return (
        <>
          <FlightAirport
            code="TPE"
            showLabel={args.airport.showLabel}
            labelPosition={args.airport.labelPosition}
          />
          <FlightAirport
            code="HND"
            showLabel={args.airport.showLabel}
            labelPosition={args.airport.labelPosition}
          />
          <FlightAirport
            code="ICN"
            showLabel={args.airport.showLabel}
            labelPosition={args.airport.labelPosition}
          />
        </>
      );
    case "flight-route":
      return (
        <FlightRoute
          from="TPE"
          to="HND"
          color={args.route.color}
          showAirports={args.route.showAirports}
          showLabel={args.route.showLabel}
          hoverEffect={args.route.hoverEffect}
          tripType={args.route.tripType}
          animate={
            allowMotion && args.route.animate ? { duration: 5000 } : false
          }
          lineStyle={args.route.lineStyle}
        />
      );
    case "flight-routes":
      return (
        <FlightRoutes
          routes={[
            { from: "TPE", to: "HND" },
            { from: "TPE", to: "SIN" },
            { from: "TPE", to: "BKK" },
          ]}
          color={args.routes.color}
          showAirports={args.routes.showAirports}
          showLabel={args.routes.showLabel}
          hoverEffect={args.routes.hoverEffect}
          tripType={args.routes.tripType}
          animate={
            allowMotion && args.routes.animate ? { duration: 7000 } : false
          }
          lineStyle={args.routes.lineStyle}
        />
      );
    case "flight-multi-route":
      return (
        <FlightMultiRoute
          waypoints={["TPE", "DXB", "ZRH", "JFK"]}
          color={args.multiRoute.color}
          showAirports={args.multiRoute.showAirports}
          showLabel={args.multiRoute.showLabel}
          hoverEffect={args.multiRoute.hoverEffect}
          tripType={args.multiRoute.tripType}
          animate={
            allowMotion && args.multiRoute.animate ? { duration: 9000 } : false
          }
          lineStyle={args.multiRoute.lineStyle}
        />
      );
    case "flight-tracker":
      return (
        <FlightTracker
          from="TPE"
          to="LHR"
          progress={args.tracker.progress}
          completedColor={args.tracker.completedColor}
          remainingColor={args.tracker.remainingColor}
          width={args.tracker.width}
          showAirports={args.tracker.showAirports}
          showLabel={args.tracker.showLabel}
          altitude={args.tracker.altitude}
          speed={args.tracker.speed}
          showInfo={args.tracker.showInfo}
          iconSize={args.tracker.iconSize}
          npoints={args.tracker.npoints}
        >
          <span className="flex items-center gap-2">
            <span>CI 081</span>
            <span className="text-emerald-600">En route</span>
          </span>
        </FlightTracker>
      );
    case "flight-route-label":
      return (
        <>
          <FlightRoute from="TPE" to="HND" showAirports />
          <FlightRouteLabel
            from="TPE"
            to="HND"
            mode={args.routeLabel.mode}
            position={args.routeLabel.position}
            rotate={args.routeLabel.rotate}
            offset={args.routeLabel.offset}
            size={args.routeLabel.size}
            labelPosition={args.routeLabel.labelPosition}
            animate={
              allowMotion &&
              args.routeLabel.mode === "aircraft" &&
              args.routeLabel.animate
                ? {
                    duration: args.routeLabel.duration,
                    loop: args.routeLabel.loop,
                  }
                : false
            }
            iconSize={args.routeLabel.iconSize}
            npoints={args.routeLabel.npoints}
          >
            {args.routeLabel.label}
          </FlightRouteLabel>
        </>
      );
    case "flight-network":
      return (
        <FlightNetwork
          routes={NETWORK_ROUTES}
          color={args.network.color}
          highlightColor={args.network.highlightColor}
          minRouteWidth={args.network.minRouteWidth}
          maxRouteWidth={args.network.maxRouteWidth}
          minNodeSize={args.network.minNodeSize}
          maxNodeSize={args.network.maxNodeSize}
          showLabels={args.network.showLabels}
          selectedAirport={args.network.selectedAirport}
          npoints={args.network.npoints}
        />
      );
    case "flight-range":
      return (
        <FlightRange
          origin="TPE"
          ranges={[
            { distance: 800, color: "#bfdbfe", opacity: 0.08 },
            { distance: 1800, color: "#60a5fa", opacity: 0.055 },
            { distance: 3200, color: "#2563eb", opacity: 0.035 },
          ]}
          outlineWidth={args.range.outlineWidth}
          showOrigin={args.range.showOrigin}
          showLabel={args.range.showLabel}
          steps={args.range.steps}
        />
      );
    case "aircraft-trail":
      return (
        <AircraftTrail
          positions={TRAIL_POSITIONS}
          color={args.trail.color}
          altitudeColorStops={resolveTrailAltitudeColorStops(
            args.trail.altitudePalette,
          )}
          width={args.trail.width}
          startOpacity={args.trail.startOpacity}
          endOpacity={args.trail.endOpacity}
          showGlow={args.trail.showGlow}
          showAircraft={args.trail.showAircraft}
          iconSize={args.trail.iconSize}
        />
      );
    case "flight-flow":
      return (
        <FlightFlow
          routes={FLOW_ROUTES}
          color={args.flow.color}
          showRoutes={args.flow.showRoutes}
          routeColor={args.flow.routeColor}
          routeOpacity={args.flow.routeOpacity}
          routeWidth={args.flow.routeWidth}
          animate={allowMotion && args.flow.animate}
          aircraftCount={args.flow.aircraftCount}
          aircraftSize={args.flow.aircraftSize}
          duration={args.flow.duration}
          npoints={args.flow.npoints}
        />
      );
    case "satellite-orbit":
      return (
        <SatelliteOrbit
          {...buildSatelliteOrbitProps({
            ...args.satellite,
            animate: allowMotion && args.satellite.animate,
          })}
        />
      );
    case "satellite-orbits": {
      const sharedProps = buildSatelliteOrbitProps({
        ...args.satellites,
        animate: allowMotion && args.satellites.animate,
      });

      return (
        <SatelliteOrbits
          orbits={[
            {
              inclination: 51.6,
              ascendingNode: -28,
              name: "ISS",
              orbitColor: "#213448",
              groundTrackColor: "#213448",
            },
            {
              inclination: 97.4,
              ascendingNode: 38,
              name: "NOAA-20",
              orbitColor: "#547792",
              groundTrackColor: "#547792",
            },
            {
              inclination: 53,
              ascendingNode: -120,
              name: "Starlink",
              orbitColor: "#94B4C1",
              groundTrackColor: "#94B4C1",
            },
          ]}
          duration={
            sharedProps.animate && sharedProps.animate !== true
              ? sharedProps.animate.duration
              : undefined
          }
          altitudePx={sharedProps.altitudePx}
          satelliteConnectorColor={sharedProps.satelliteConnectorColor}
          satelliteIconSvg={sharedProps.satelliteIconSvg}
          showGlow={sharedProps.showGlow}
          showConnector={sharedProps.showConnector}
          connectorLineStyle={sharedProps.connectorLineStyle}
          animate={sharedProps.animate}
          showLabel={sharedProps.showLabel}
          labelPosition={sharedProps.labelPosition}
          satelliteIconRotationOffset={sharedProps.satelliteIconRotationOffset}
        />
      );
    }
  }
}

export function buildSnippet(args: ComponentPreviewArgs): string {
  switch (args.id) {
    case "flight-airport": {
      const { airport } = args;
      return withSnippetImports(
        ["FlightAirport"],
        "@/components/ui/flight",
        `<Map center={[128, 29]} zoom={2.35}>
  <FlightAirport code="TPE" showLabel={${airport.showLabel}} labelPosition="${airport.labelPosition}" />
  <FlightAirport code="HND" showLabel={${airport.showLabel}} labelPosition="${airport.labelPosition}" />
  <FlightAirport code="ICN" showLabel={${airport.showLabel}} labelPosition="${airport.labelPosition}" />
</Map>`,
      );
    }
    case "flight-route": {
      const { route } = args;
      return withSnippetImports(
        ["FlightRoute"],
        "@/components/ui/flight",
        `<Map center={[122, 26]} zoom={2.15}>
  <FlightRoute
    from="TPE"
    to="HND"
${buildRouteLikeSnippetLines(route, route.animate ? "{ duration: 5000 }" : "false")}
  />
</Map>`,
      );
    }
    case "flight-routes": {
      const { routes } = args;
      return withSnippetImports(
        ["FlightRoutes"],
        "@/components/ui/flight",
        `<Map center={[118, 18]} zoom={2.05}>
  <FlightRoutes
    routes={[
      { from: "TPE", to: "HND" },
      { from: "TPE", to: "SIN" },
      { from: "TPE", to: "BKK" },
    ]}
${buildRouteLikeSnippetLines(routes, routes.animate ? "{ duration: 7000 }" : "false")}
  />
</Map>`,
      );
    }
    case "flight-multi-route": {
      const { multiRoute } = args;
      return withSnippetImports(
        ["FlightMultiRoute"],
        "@/components/ui/flight",
        `<Map center={[28, 28]} zoom={1.2}>
  <FlightMultiRoute
    waypoints={["TPE", "DXB", "ZRH", "JFK"]}
${buildRouteLikeSnippetLines(
  multiRoute,
  multiRoute.animate ? "{ duration: 9000 }" : "false",
)}
  />
</Map>`,
      );
    }
    case "flight-tracker": {
      const { tracker } = args;
      return withSnippetImports(
        ["FlightTracker"],
        "@/components/ui/flight",
        `<Map center={[66, 38]} zoom={1.2}>
  <FlightTracker
    from="TPE"
    to="LHR"
    progress={${tracker.progress}}
    completedColor="${tracker.completedColor}"
    remainingColor="${tracker.remainingColor}"
    width={${tracker.width}}
    showAirports={${tracker.showAirports}}
    showLabel={${tracker.showLabel}}
    altitude={${tracker.altitude}}
    speed={${tracker.speed}}
    showInfo={${tracker.showInfo}}
    iconSize={${tracker.iconSize}}
    npoints={${tracker.npoints}}
  >
    <span className="flex items-center gap-2">
      <span>CI 081</span>
      <span className="text-emerald-600">En route</span>
    </span>
  </FlightTracker>
</Map>`,
      );
    }
    case "flight-route-label": {
      const { routeLabel } = args;
      const aircraftProps =
        routeLabel.mode === "aircraft"
          ? `    labelPosition="${routeLabel.labelPosition}"
    animate={${
      routeLabel.animate
        ? `{ duration: ${routeLabel.duration}, loop: ${routeLabel.loop} }`
        : "false"
    }}
    iconSize={${routeLabel.iconSize}}`
          : `    rotate={${routeLabel.rotate}}`;
      return withSnippetImports(
        ["FlightRoute", "FlightRouteLabel"],
        "@/components/ui/flight",
        `<Map center={[122, 26]} zoom={2.15}>
  <FlightRoute from="TPE" to="HND" showAirports />
  <FlightRouteLabel
    from="TPE"
    to="HND"
    mode="${routeLabel.mode}"
    position={${routeLabel.position}}
    offset={[${routeLabel.offset[0]}, ${routeLabel.offset[1]}]}
    size="${routeLabel.size}"
${aircraftProps}
    npoints={${routeLabel.npoints}}
  >
    {${JSON.stringify(routeLabel.label)}}
  </FlightRouteLabel>
</Map>`,
      );
    }
    case "flight-network": {
      const { network } = args;
      const selectedAirport = network.selectedAirport
        ? JSON.stringify(network.selectedAirport)
        : "{null}";
      return withSnippetImports(
        ["FlightNetwork"],
        "@/components/ui/flight",
        `<Map center={[121, 23]} zoom={1.9}>
  <FlightNetwork
    routes={[
      { from: "TPE", to: "HND", value: 18 },
      { from: "TPE", to: "SIN", value: 11 },
      { from: "TPE", to: "BKK", value: 8 },
      { from: "TPE", to: "HKG", value: 14 },
    ]}
    color="${network.color}"
    highlightColor="${network.highlightColor}"
    minRouteWidth={${network.minRouteWidth}}
    maxRouteWidth={${network.maxRouteWidth}}
    minNodeSize={${network.minNodeSize}}
    maxNodeSize={${network.maxNodeSize}}
    showLabels={${network.showLabels}}
    selectedAirport=${selectedAirport}
    npoints={${network.npoints}}
  />
</Map>`,
      );
    }
    case "flight-range": {
      const { range } = args;
      return withSnippetImports(
        ["FlightRange"],
        "@/components/ui/flight",
        `<Map projection={{ type: "globe" }} center={[121, 24]} zoom={1.9}>
  <FlightRange
    origin="TPE"
    ranges={[
      { distance: 800, color: "#bfdbfe", opacity: 0.08 },
      { distance: 1800, color: "#60a5fa", opacity: 0.055 },
      { distance: 3200, color: "#2563eb", opacity: 0.035 },
    ]}
    outlineWidth={${range.outlineWidth}}
    showOrigin={${range.showOrigin}}
    showLabel={${range.showLabel}}
    steps={${range.steps}}
  />
</Map>`,
      );
    }
    case "aircraft-trail": {
      const { trail } = args;
      const altitudeColorStops = resolveTrailAltitudeColorStops(
        trail.altitudePalette,
      );
      const altitudeColorStopsLine = altitudeColorStops
        ? `    altitudeColorStops={[
${altitudeColorStops
  .map(
    (stop) => `      { altitude: ${stop.altitude}, color: "${stop.color}" },`,
  )
  .join("\n")}
    ]}`
        : null;
      return withSnippetImports(
        ["AircraftTrail"],
        "@/components/ui/flight",
        `<Map center={[130.5, 30.2]} zoom={3.15}>
  <AircraftTrail
    positions={[
      { longitude: 139.78, latitude: 35.55, altitude: 200 },
      { longitude: 135.4, latitude: 32.95, altitude: 23600 },
      { longitude: 129.5, latitude: 30.25, altitude: 39000 },
      { longitude: 127.95, latitude: 28.85, altitude: 35000 },
      { longitude: 126.9, latitude: 27.45, altitude: 27000 },
    ]}
    color="${trail.color}"
${altitudeColorStopsLine ?? ""}
    width={${trail.width}}
    startOpacity={${trail.startOpacity}}
    endOpacity={${trail.endOpacity}}
    showGlow={${trail.showGlow}}
    showAircraft={${trail.showAircraft}}
    iconSize={${trail.iconSize}}
  />
</Map>`,
      );
    }
    case "flight-flow": {
      const { flow } = args;
      return withSnippetImports(
        ["FlightFlow"],
        "@/components/ui/flight",
        `<Map center={[123.5, 25]} zoom={3.05}>
  <FlightFlow
    routes={[
      { from: "HND", to: "TPE", value: 14 },
      { from: "ICN", to: "TPE", value: 8 },
      { from: "HKG", to: "TPE", value: 11 },
      { from: "BKK", to: "TPE", value: 7 },
      { from: "MNL", to: "TPE", value: 6 },
    ]}
    color="${flow.color}"
    showRoutes={${flow.showRoutes}}
    routeColor="${flow.routeColor}"
    routeOpacity={${flow.routeOpacity}}
    routeWidth={${flow.routeWidth}}
    animate={${flow.animate}}
    aircraftCount={${flow.aircraftCount}}
    aircraftSize={${flow.aircraftSize}}
    duration={${flow.duration}}
    npoints={${flow.npoints}}
  />
</Map>`,
      );
    }
    case "satellite-orbit": {
      return withSnippetImports(
        ["SatelliteOrbit"],
        "@/components/ui/satellite-orbit",
        buildSatelliteOrbitSnippet(args.satellite),
      );
    }
    case "satellite-orbits": {
      const satellites = args.satellites;
      const sharedLines = [
        `    orbits={[`,
        `      { inclination: 51.6, ascendingNode: -28, name: "ISS" },`,
        `      { inclination: 97.4, ascendingNode: 38, name: "NOAA-20" },`,
        `      { inclination: 53, ascendingNode: -120, name: "Starlink" },`,
        `    ]}`,
        `    duration={${satellites.duration}}`,
        `    altitudePx={${satellites.altitudePx}}`,
        satellites.satelliteConnectorColor
          ? `    satelliteConnectorColor="${satellites.satelliteConnectorColor}"`
          : null,
        satellites.satelliteIconSvg
          ? `    satelliteIconSvg={\`${satellites.satelliteIconSvg
              .replaceAll("\\", "\\\\")
              .replaceAll("`", "\\`")
              .replaceAll("${", "\\${")}\`}`
          : null,
        `    showGlow={${satellites.showGlow}}`,
        `    showConnector={${satellites.showConnector}}`,
        `    connectorLineStyle="${satellites.connectorLineStyle}"`,
        `    animate={${
          satellites.animate ? `{ duration: ${satellites.duration} }` : "false"
        }}`,
        `    showLabel={${satellites.showLabel}}`,
        `    labelPosition="${satellites.labelPosition}"`,
        satellites.satelliteIconRotationOffset !== undefined
          ? `    satelliteIconRotationOffset={${satellites.satelliteIconRotationOffset}}`
          : null,
      ]
        .filter((line): line is string => line !== null)
        .join("\n");

      return withSnippetImports(
        ["SatelliteOrbits"],
        "@/components/ui/satellite-orbit",
        `<Map projection={{ type: "globe" }} center={[8, 16]} zoom={1.05}>
  <SatelliteOrbits
${sharedLines}
  />
</Map>`,
      );
    }
  }
}

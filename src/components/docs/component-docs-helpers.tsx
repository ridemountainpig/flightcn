import {
  FlightAirport,
  FlightMultiRoute,
  FlightRoute,
  FlightRoutes,
} from "@/registry/flight";
import { SatelliteOrbits } from "@/registry/satellite-orbit";
import {
  buildSatelliteOrbitProps,
  buildSatelliteOrbitSnippet,
  type SatelliteOrbitPlayground,
} from "@/components/satellite/satellite-orbit-playground-controls";
import { SatelliteOrbit } from "@/registry/satellite-orbit";

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

export type ComponentPreviewArgs =
  | { id: "flight-airport"; airport: AirportPlayground }
  | { id: "flight-route"; route: FlightRouteLikePlayground }
  | { id: "flight-routes"; routes: FlightRouteLikePlayground }
  | { id: "flight-multi-route"; multiRoute: FlightRouteLikePlayground }
  | { id: "satellite-orbit"; satellite: SatelliteOrbitPlayground }
  | { id: "satellite-orbits"; satellites: SatelliteOrbitPlayground };

export function renderComponentPreview(args: ComponentPreviewArgs) {
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
          animate={args.route.animate ? { duration: 5000 } : false}
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
          animate={args.routes.animate ? { duration: 7000 } : false}
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
          animate={args.multiRoute.animate ? { duration: 9000 } : false}
          lineStyle={args.multiRoute.lineStyle}
        />
      );
    case "satellite-orbit":
      return <SatelliteOrbit {...buildSatelliteOrbitProps(args.satellite)} />;
    case "satellite-orbits": {
      const sharedProps = buildSatelliteOrbitProps(args.satellites);

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
      return `<Map center={[128, 29]} zoom={2.35}>
  <FlightAirport code="TPE" showLabel={${airport.showLabel}} labelPosition="${airport.labelPosition}" />
  <FlightAirport code="HND" showLabel={${airport.showLabel}} labelPosition="${airport.labelPosition}" />
  <FlightAirport code="ICN" showLabel={${airport.showLabel}} labelPosition="${airport.labelPosition}" />
</Map>`;
    }
    case "flight-route": {
      const { route } = args;
      return `<Map center={[122, 26]} zoom={2.15}>
  <FlightRoute
    from="TPE"
    to="HND"
${buildRouteLikeSnippetLines(route, route.animate ? "{ duration: 5000 }" : "false")}
  />
</Map>`;
    }
    case "flight-routes": {
      const { routes } = args;
      return `<Map center={[118, 18]} zoom={2.05}>
  <FlightRoutes
    routes={[
      { from: "TPE", to: "HND" },
      { from: "TPE", to: "SIN" },
      { from: "TPE", to: "BKK" },
    ]}
${buildRouteLikeSnippetLines(routes, routes.animate ? "{ duration: 7000 }" : "false")}
  />
</Map>`;
    }
    case "flight-multi-route": {
      const { multiRoute } = args;
      return `<Map center={[28, 28]} zoom={1.2}>
  <FlightMultiRoute
    waypoints={["TPE", "DXB", "ZRH", "JFK"]}
${buildRouteLikeSnippetLines(
  multiRoute,
  multiRoute.animate ? "{ duration: 9000 }" : "false",
)}
  />
</Map>`;
    }
    case "satellite-orbit": {
      return buildSatelliteOrbitSnippet(args.satellite);
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

      return `<Map projection={{ type: "globe" }} center={[8, 16]} zoom={1.05}>
  <SatelliteOrbits
${sharedLines}
  />
</Map>`;
    }
  }
}

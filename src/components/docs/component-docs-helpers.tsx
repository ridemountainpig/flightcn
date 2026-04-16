import {
  FlightAirport,
  FlightMultiRoute,
  FlightRoute,
  FlightRoutes,
} from "@/registry/flight";

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
  | { id: "flight-multi-route"; multiRoute: FlightRouteLikePlayground };

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
  }
}

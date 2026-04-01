export type PropDoc = {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
};

export type ComponentDoc = {
  id:
    | "flight-airport"
    | "flight-route"
    | "flight-routes"
    | "flight-multi-route";
  name: string;
  description: string;
  snippet: string;
  mapCenter: [number, number];
  mapZoom: number;
  props: readonly PropDoc[];
  extra?: {
    title: string;
    props: readonly PropDoc[];
  }[];
};

export const componentDocs: readonly ComponentDoc[] = [
  {
    id: "flight-airport",
    name: "FlightAirport",
    description:
      "Renders a single airport marker with optional labels, custom marker UI, and click callbacks.",
    snippet: `<Map center={[128, 29]} zoom={2.35}>
  <FlightAirport code="TPE" showLabel />
  <FlightAirport code="HND" showLabel />
  <FlightAirport code="ICN" showLabel />
</Map>`,
    mapCenter: [128, 29],
    mapZoom: 2.35,
    props: [
      {
        name: "code",
        type: "string",
        defaultValue: "-",
        description: "IATA code",
      },
      {
        name: "name",
        type: "string",
        defaultValue: "-",
        description: "Override display name",
      },
      {
        name: "showLabel",
        type: "boolean",
        defaultValue: "false",
        description: "Whether to show the airport label",
      },
      {
        name: "labelPosition",
        type: '"top" | "bottom"',
        defaultValue: '"top"',
        description: "Label position",
      },
      {
        name: "markerContent",
        type: "ReactNode",
        defaultValue: "default black dot",
        description: "Custom marker content",
      },
      {
        name: "onClick",
        type: "(airport) => void",
        defaultValue: "-",
        description:
          "Click callback; receives airport info or custom coordinates",
      },
    ],
  },
  {
    id: "flight-route",
    name: "FlightRoute",
    description:
      "Renders a single route with built-in hover details, animation options, and route style controls.",
    snippet: `<Map center={[122, 26]} zoom={2.15}>
  <FlightRoute
    from="TPE"
    to="HND"
    showAirports
    showLabel
    hoverEffect
    tripType="round-trip"
  />
</Map>`,
    mapCenter: [122, 26],
    mapZoom: 2.15,
    props: [
      {
        name: "from",
        type: "AirportRef",
        defaultValue: "-",
        description: "Origin airport reference",
      },
      {
        name: "to",
        type: "AirportRef",
        defaultValue: "-",
        description: "Destination airport reference",
      },
      {
        name: "color",
        type: "string",
        defaultValue: '"#000000"',
        description: "Route color",
      },
      {
        name: "width",
        type: "number",
        defaultValue: "2",
        description: "Line width",
      },
      {
        name: "opacity",
        type: "number",
        defaultValue: "0.7",
        description: "Line opacity",
      },
      {
        name: "lineStyle",
        type: '"solid" | "dash" | "dot"',
        defaultValue: '"solid"',
        description: "Route line style",
      },
      {
        name: "showAirports",
        type: "boolean",
        defaultValue: "false",
        description: "Whether to auto-render origin and destination airports",
      },
      {
        name: "showLabel",
        type: "boolean",
        defaultValue: "false",
        description: "Whether to show airport labels",
      },
      {
        name: "markerContent",
        type: "ReactNode",
        defaultValue: "default black dot",
        description: "Custom marker content for auto-rendered airports",
      },
      {
        name: "onClick",
        type: "() => void",
        defaultValue: "-",
        description: "Click callback",
      },
      {
        name: "animate",
        type: "boolean | FlightRouteAnimateConfig",
        defaultValue: "false",
        description: "Enable plane animation",
      },
      {
        name: "hoverEffect",
        type: "boolean",
        defaultValue: "true",
        description: "Enable hover highlight and route tooltip",
      },
      {
        name: "tripType",
        type: '"one-way" | "round-trip"',
        defaultValue: '"one-way"',
        description: "Trip type",
      },
    ],
    extra: [
      {
        title: "FlightRouteAnimateConfig",
        props: [
          {
            name: "duration",
            type: "number",
            defaultValue: "-",
            description: "Animation duration in milliseconds",
          },
          {
            name: "loop",
            type: "boolean",
            defaultValue: "-",
            description: "Whether to loop animation",
          },
          {
            name: "roundTrip",
            type: "boolean",
            defaultValue: "-",
            description: "Whether to animate as round-trip",
          },
          {
            name: "icon",
            type: "ReactNode",
            defaultValue: "-",
            description: "Custom plane icon",
          },
          {
            name: "iconSize",
            type: "number",
            defaultValue: "-",
            description: "Plane icon size",
          },
        ],
      },
    ],
  },
  {
    id: "flight-routes",
    name: "FlightRoutes",
    description:
      "Renders multiple routes in batch with shared defaults and per-route overrides.",
    snippet: `<Map center={[118, 18]} zoom={2.05}>
  <FlightRoutes
    routes={[
      { from: "TPE", to: "HND", tripType: "round-trip" },
      { from: "TPE", to: "SIN" },
      { from: "TPE", to: "BKK" },
    ]}
    showAirports
    showLabel
  />
</Map>`,
    mapCenter: [118, 18],
    mapZoom: 2.05,
    props: [
      {
        name: "routes",
        type: "readonly FlightRouteData[]",
        defaultValue: "-",
        description: "Route data array",
      },
      {
        name: "color",
        type: "string",
        defaultValue: '"#000000"',
        description: "Default route color",
      },
      {
        name: "width",
        type: "number",
        defaultValue: "2",
        description: "Default line width",
      },
      {
        name: "opacity",
        type: "number",
        defaultValue: "0.7",
        description: "Default line opacity",
      },
      {
        name: "lineStyle",
        type: '"solid" | "dash" | "dot"',
        defaultValue: '"solid"',
        description: "Default route line style",
      },
      {
        name: "showAirports",
        type: "boolean",
        defaultValue: "false",
        description: "Whether to render endpoint airports",
      },
      {
        name: "showLabel",
        type: "boolean",
        defaultValue: "false",
        description: "Whether to show airport labels",
      },
      {
        name: "markerContent",
        type: "ReactNode",
        defaultValue: "default black dot",
        description: "Custom marker content for auto-rendered airports",
      },
      {
        name: "hoverEffect",
        type: "boolean",
        defaultValue: "true",
        description: "Default hover behavior",
      },
      {
        name: "tripType",
        type: '"one-way" | "round-trip"',
        defaultValue: '"one-way"',
        description: "Default trip type",
      },
      {
        name: "onClick",
        type: "(routeIndex, route) => void",
        defaultValue: "-",
        description: "Shared click callback",
      },
      {
        name: "animate",
        type: "boolean | FlightRouteAnimateConfig",
        defaultValue: "false",
        description: "Global animation setting",
      },
    ],
    extra: [
      {
        title: "FlightRouteData",
        props: [
          {
            name: "from",
            type: "AirportRef",
            defaultValue: "-",
            description: "Origin airport reference",
          },
          {
            name: "to",
            type: "AirportRef",
            defaultValue: "-",
            description: "Destination airport reference",
          },
          {
            name: "color",
            type: "string",
            defaultValue: "inherits from FlightRoutes",
            description: "Per-route color override",
          },
          {
            name: "width",
            type: "number",
            defaultValue: "inherits from FlightRoutes",
            description: "Per-route width override",
          },
          {
            name: "opacity",
            type: "number",
            defaultValue: "inherits from FlightRoutes",
            description: "Per-route opacity override",
          },
          {
            name: "lineStyle",
            type: '"solid" | "dash" | "dot"',
            defaultValue: "inherits from FlightRoutes",
            description: "Per-route style override",
          },
          {
            name: "hoverEffect",
            type: "boolean",
            defaultValue: "inherits from FlightRoutes",
            description: "Per-route hover override",
          },
          {
            name: "tripType",
            type: '"one-way" | "round-trip"',
            defaultValue: "inherits from FlightRoutes",
            description: "Per-route trip type override",
          },
          {
            name: "onClick",
            type: "() => void",
            defaultValue: "-",
            description: "Per-route click callback",
          },
          {
            name: "animate",
            type: "boolean | FlightRouteAnimateConfig",
            defaultValue: "inherits from FlightRoutes",
            description: "Per-route animation override",
          },
        ],
      },
    ],
  },
  {
    id: "flight-multi-route",
    name: "FlightMultiRoute",
    description:
      "Renders connecting multi-leg routes from ordered waypoints, ideal for itinerary visualization.",
    snippet: `<Map center={[28, 28]} zoom={1.2}>
  <FlightMultiRoute
    waypoints={["TPE", "DXB", "ZRH", "JFK"]}
    showAirports
    showLabel
  />
</Map>`,
    mapCenter: [28, 28],
    mapZoom: 1.2,
    props: [
      {
        name: "waypoints",
        type: "readonly AirportRef[]",
        defaultValue: "-",
        description: "At least 2 airport refs; each pair forms one route leg",
      },
      {
        name: "color",
        type: "string",
        defaultValue: '"#000000"',
        description: "Route color",
      },
      {
        name: "width",
        type: "number",
        defaultValue: "2",
        description: "Line width",
      },
      {
        name: "opacity",
        type: "number",
        defaultValue: "0.7",
        description: "Line opacity",
      },
      {
        name: "lineStyle",
        type: '"solid" | "dash" | "dot"',
        defaultValue: '"solid"',
        description: "Route line style",
      },
      {
        name: "showAirports",
        type: "boolean",
        defaultValue: "false",
        description: "Whether to render waypoint airports",
      },
      {
        name: "showLabel",
        type: "boolean",
        defaultValue: "false",
        description: "Whether to show airport labels",
      },
      {
        name: "markerContent",
        type: "ReactNode",
        defaultValue: "default black dot",
        description: "Default marker content for start/end airports",
      },
      {
        name: "stopoverMarkerContent",
        type: "ReactNode",
        defaultValue: "uses endpoint marker style",
        description: "Custom marker content for stopover airports",
      },
      {
        name: "onLegClick",
        type: "(legIndex: number) => void",
        defaultValue: "-",
        description: "Callback when a route leg is clicked",
      },
      {
        name: "animate",
        type: "boolean | FlightRouteAnimateConfig",
        defaultValue: "false",
        description: "Enable multi-leg animation",
      },
      {
        name: "hoverEffect",
        type: "boolean",
        defaultValue: "true",
        description: "Enable hover highlight and route tooltip",
      },
      {
        name: "tripType",
        type: '"one-way" | "round-trip"',
        defaultValue: '"one-way"',
        description: "Trip type shown in hover details",
      },
    ],
  },
] as const;

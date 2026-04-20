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
    | "flight-multi-route"
    | "satellite-orbit"
    | "satellite-orbits";
  name: string;
  description: string;
  snippet: string;
  mapCenter: [number, number];
  mapZoom: number;
  projection?: { type: "globe" };
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
        defaultValue: "theme-aware dot",
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
        defaultValue: "-",
        description:
          "Route color; when omitted, uses a theme-aware contrast stroke (light/dark)",
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
        defaultValue: "theme-aware dot",
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
        defaultValue: "-",
        description:
          "Default route color; when omitted, uses a theme-aware contrast stroke",
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
        defaultValue: "theme-aware dot",
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
        defaultValue: "-",
        description:
          "Route color; when omitted, uses a theme-aware contrast stroke",
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
        defaultValue: "theme-aware dot",
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

export const satelliteComponentDoc: ComponentDoc = {
  id: "satellite-orbit",
  name: "SatelliteOrbit",
  description:
    "Renders a globe-based orbital path with an elevated satellite marker, ground track, and optional animated motion for space or telecom visualizations.",
  snippet: `<Map projection={{ type: "globe" }} center={[8, 16]} zoom={1.05}>
  <SatelliteOrbit
    inclination={51.6}
    ascendingNode={-28}
    name="ISS"
    showLabel
    animate={{ duration: 12000 }}
  />
</Map>`,
  mapCenter: [8, 16],
  mapZoom: 1.05,
  projection: { type: "globe" },
  props: [
    {
      name: "inclination",
      type: "number",
      defaultValue: "62",
      description: "Orbital inclination angle in degrees",
    },
    {
      name: "ascendingNode",
      type: "number",
      defaultValue: "-28",
      description: "Longitude of ascending node in degrees",
    },
    {
      name: "altitudePx",
      type: "number",
      defaultValue: "28",
      description: "Visual elevation of the satellite above the globe",
    },
    {
      name: "orbitWidth",
      type: "number",
      defaultValue: "2.2",
      description: "Orbit stroke width",
    },
    {
      name: "groundTrackWidth",
      type: "number",
      defaultValue: "1.4",
      description: "Ground track stroke width",
    },
    {
      name: "orbitColor",
      type: "string",
      defaultValue: "theme-aware",
      description: "Primary orbit stroke color",
    },
    {
      name: "orbitGlowColor",
      type: "string",
      defaultValue: "theme-aware",
      description: "Orbit glow halo color",
    },
    {
      name: "groundTrackColor",
      type: "string",
      defaultValue: "theme-aware",
      description: "Projected ground track color on the globe surface",
    },
    {
      name: "satelliteConnectorColor",
      type: "string",
      defaultValue: "theme-aware",
      description: "Connector and antenna detail color",
    },
    {
      name: "showGlow",
      type: "boolean",
      defaultValue: "true",
      description: "Whether to render the orbit glow and marker halo",
    },
    {
      name: "showConnector",
      type: "boolean",
      defaultValue: "true",
      description:
        "Whether to draw the connector from globe surface to satellite",
    },
    {
      name: "orbitLineStyle",
      type: '"solid" | "dash" | "dot"',
      defaultValue: '"solid"',
      description: "Orbit path line style",
    },
    {
      name: "groundTrackLineStyle",
      type: '"solid" | "dash" | "dot"',
      defaultValue: '"dash"',
      description: "Ground track line style",
    },
    {
      name: "connectorLineStyle",
      type: '"solid" | "dash" | "dot"',
      defaultValue: '"dash"',
      description: "Connector line style",
    },
    {
      name: "animate",
      type: "boolean | SatelliteAnimationConfig",
      defaultValue: "false",
      description: "Enable orbital animation",
    },
    {
      name: "name",
      type: "string",
      defaultValue: "-",
      description: "Satellite label text",
    },
    {
      name: "showLabel",
      type: "boolean",
      defaultValue: "true",
      description: "Whether to show the satellite label",
    },
    {
      name: "labelPosition",
      type: '"top" | "bottom" | "left" | "right"',
      defaultValue: '"right"',
      description: "Satellite label anchor position",
    },
    {
      name: "satelliteIconSvg",
      type: "string",
      defaultValue: "-",
      description: "Custom satellite icon as an SVG string",
    },
    {
      name: "satelliteIconRotationOffset",
      type: "number",
      defaultValue: "0",
      description: "Rotation offset applied after automatic orbit alignment",
    },
  ],
  extra: [
    {
      title: "SatelliteAnimationConfig",
      props: [
        {
          name: "duration",
          type: "number",
          defaultValue: "16000",
          description: "Animation duration in milliseconds",
        },
      ],
    },
  ],
};

export const satelliteOrbitsComponentDoc: ComponentDoc = {
  id: "satellite-orbits",
  name: "SatelliteOrbits",
  description:
    "Renders multiple orbital overlays on the same globe with shared animation and marker styling, while keeping per-orbit path configuration configurable in the orbit dataset.",
  snippet: `<Map projection={{ type: "globe" }} center={[8, 16]} zoom={1.05}>
  <SatelliteOrbits
    orbits={[
      { inclination: 51.6, ascendingNode: -28, name: "ISS" },
      { inclination: 97.4, ascendingNode: 38, name: "NOAA-20" },
      { inclination: 53, ascendingNode: -120, name: "Starlink" },
    ]}
    showLabel
    animate={{ duration: 12000 }}
  />
</Map>`,
  mapCenter: [8, 16],
  mapZoom: 1.05,
  projection: { type: "globe" },
  props: [
    {
      name: "orbits",
      type: "readonly SatelliteOrbitData[]",
      defaultValue: "-",
      description: "Orbit dataset array; each item defines one orbital path",
    },
    {
      name: "duration",
      type: "number",
      defaultValue: "16000",
      description: "Shared animation duration in milliseconds",
    },
    {
      name: "samples",
      type: "number",
      defaultValue: "300",
      description: "Shared orbit sampling density",
    },
    {
      name: "altitudePx",
      type: "number",
      defaultValue: "28",
      description: "Shared visual elevation of satellites above the globe",
    },
    {
      name: "satelliteConnectorColor",
      type: "string",
      defaultValue: "theme-aware",
      description: "Shared connector and antenna detail color",
    },
    {
      name: "satelliteIconSvg",
      type: "string",
      defaultValue: "-",
      description: "Shared custom satellite icon as an SVG string",
    },
    {
      name: "satelliteIconRotationOffset",
      type: "number",
      defaultValue: "0",
      description:
        "Shared rotation offset applied after automatic orbit alignment",
    },
    {
      name: "showGlow",
      type: "boolean",
      defaultValue: "true",
      description: "Whether to render glow halos for all orbits",
    },
    {
      name: "showConnector",
      type: "boolean",
      defaultValue: "true",
      description:
        "Whether to draw connectors from globe surface to satellites",
    },
    {
      name: "connectorLineStyle",
      type: '"solid" | "dash" | "dot"',
      defaultValue: '"dash"',
      description: "Shared connector line style",
    },
    {
      name: "animate",
      type: "boolean | SatelliteAnimationConfig",
      defaultValue: "false",
      description: "Enable shared orbital animation",
    },
    {
      name: "showLabel",
      type: "boolean",
      defaultValue: "true",
      description: "Whether to show labels for all orbit entries with a name",
    },
    {
      name: "labelPosition",
      type: '"top" | "bottom" | "left" | "right"',
      defaultValue: '"right"',
      description: "Shared label anchor position",
    },
  ],
  extra: [
    {
      title: "SatelliteOrbitData",
      props: [
        {
          name: "inclination",
          type: "number",
          defaultValue: "62",
          description: "Per-orbit inclination angle in degrees",
        },
        {
          name: "ascendingNode",
          type: "number",
          defaultValue: "-28",
          description: "Per-orbit ascending node in degrees",
        },
        {
          name: "orbitColor",
          type: "string",
          defaultValue: "inherits from theme",
          description: "Per-orbit orbit stroke color override",
        },
        {
          name: "orbitGlowColor",
          type: "string",
          defaultValue: "inherits from theme",
          description: "Per-orbit glow color override",
        },
        {
          name: "groundTrackColor",
          type: "string",
          defaultValue: "inherits from theme",
          description: "Per-orbit ground track color override",
        },
        {
          name: "orbitWidth",
          type: "number",
          defaultValue: "-",
          description: "Per-orbit orbit stroke width override",
        },
        {
          name: "groundTrackWidth",
          type: "number",
          defaultValue: "-",
          description: "Per-orbit ground track stroke width override",
        },
        {
          name: "orbitLineStyle",
          type: '"solid" | "dash" | "dot"',
          defaultValue: '"solid"',
          description: "Per-orbit orbit line style",
        },
        {
          name: "groundTrackLineStyle",
          type: '"solid" | "dash" | "dot"',
          defaultValue: '"dash"',
          description: "Per-orbit ground track line style",
        },
        {
          name: "name",
          type: "string",
          defaultValue: "-",
          description: "Optional label shown for that orbit entry",
        },
      ],
    },
    {
      title: "SatelliteAnimationConfig",
      props: [
        {
          name: "duration",
          type: "number",
          defaultValue: "16000",
          description: "Animation duration in milliseconds",
        },
      ],
    },
  ],
};

export const satelliteComponentDocs: readonly ComponentDoc[] = [
  satelliteComponentDoc,
  satelliteOrbitsComponentDoc,
] as const;

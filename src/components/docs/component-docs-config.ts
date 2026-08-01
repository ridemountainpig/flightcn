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
    | "flight-tracker"
    | "flight-route-label"
    | "flight-network"
    | "flight-range"
    | "aircraft-trail"
    | "flight-flow"
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

const flightRouteAnimateConfigProps = [
  {
    name: "duration",
    type: "number",
    defaultValue: "4000",
    description: "Animation duration in milliseconds",
  },
  {
    name: "progress",
    type: "number",
    defaultValue: "-",
    description:
      "Controlled progress from 0 to 1; disables the internal animation timer",
  },
  {
    name: "loop",
    type: "boolean",
    defaultValue: "true",
    description: "Restart after completing the route",
  },
  {
    name: "roundTrip",
    type: "boolean",
    defaultValue: "false",
    description: "Fly back to the origin within the same animation cycle",
  },
  {
    name: "icon",
    type: "ReactNode",
    defaultValue: "built-in plane",
    description: "Custom aircraft icon; design it pointing up for alignment",
  },
  {
    name: "iconClassName",
    type: "string",
    defaultValue: "-",
    description: "Additional classes for the aircraft icon wrapper",
  },
  {
    name: "iconSize",
    type: "number",
    defaultValue: "24",
    description: "Aircraft icon size in pixels",
  },
  {
    name: "onProgress",
    type: "(progress: number) => void",
    defaultValue: "-",
    description:
      "Callback fired on each animation frame with progress from 0 to 1",
  },
  {
    name: "onComplete",
    type: "() => void",
    defaultValue: "-",
    description: "Callback fired after one animation cycle completes",
  },
] satisfies readonly PropDoc[];

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
        description: "IATA code; use this or a longitude/latitude pair",
      },
      {
        name: "longitude",
        type: "number",
        defaultValue: "-",
        description: "Custom marker longitude; must be used with latitude",
      },
      {
        name: "latitude",
        type: "number",
        defaultValue: "-",
        description: "Custom marker latitude; must be used with longitude",
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
        name: "labelClassName",
        type: "string",
        defaultValue: "-",
        description: "Additional classes for the airport label",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "-",
        description: "Additional classes for the marker container",
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
      {
        name: "dedupeKey",
        type: "string",
        defaultValue: "-",
        description:
          "Shared key used to suppress duplicate markers for the same airport",
      },
      {
        name: "children",
        type: "ReactNode",
        defaultValue: "-",
        description: "Popup content shown when the marker is clicked",
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
        name: "id",
        type: "string",
        defaultValue: "auto-generated",
        description: "Unique identifier for the route map layer",
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
        name: "npoints",
        type: "number",
        defaultValue: "100",
        description: "Great-circle route sampling density",
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
        name: "labelClassName",
        type: "string",
        defaultValue: "-",
        description: "Additional classes for auto-rendered airport labels",
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
        name: "onMouseEnter",
        type: "() => void",
        defaultValue: "-",
        description: "Callback fired when the pointer enters the route",
      },
      {
        name: "onMouseLeave",
        type: "() => void",
        defaultValue: "-",
        description: "Callback fired when the pointer leaves the route",
      },
      {
        name: "interactive",
        type: "boolean",
        defaultValue: "true",
        description: "Enable route pointer events and callbacks",
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
        props: flightRouteAnimateConfigProps,
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
        name: "npoints",
        type: "number",
        defaultValue: "100",
        description: "Great-circle sampling density for each route",
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
        name: "labelClassName",
        type: "string",
        defaultValue: "-",
        description: "Additional classes for auto-rendered airport labels",
      },
      {
        name: "markerContent",
        type: "ReactNode",
        defaultValue: "theme-aware dot",
        description: "Custom marker content for auto-rendered airports",
      },
      {
        name: "interactive",
        type: "boolean",
        defaultValue: "true",
        description: "Default pointer interaction setting for all routes",
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
        name: "onMouseEnter",
        type: "(routeIndex, route) => void",
        defaultValue: "-",
        description: "Shared pointer-enter callback",
      },
      {
        name: "onMouseLeave",
        type: "(routeIndex, route) => void",
        defaultValue: "-",
        description: "Shared pointer-leave callback",
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
            name: "onMouseEnter",
            type: "() => void",
            defaultValue: "-",
            description: "Per-route pointer-enter callback",
          },
          {
            name: "onMouseLeave",
            type: "() => void",
            defaultValue: "-",
            description: "Per-route pointer-leave callback",
          },
          {
            name: "interactive",
            type: "boolean",
            defaultValue: "inherits from FlightRoutes",
            description: "Per-route interaction override",
          },
          {
            name: "animate",
            type: "boolean | FlightRouteAnimateConfig",
            defaultValue: "inherits from FlightRoutes",
            description: "Per-route animation override",
          },
        ],
      },
      {
        title: "FlightRouteAnimateConfig",
        props: flightRouteAnimateConfigProps,
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
        name: "id",
        type: "string",
        defaultValue: "auto-generated",
        description: "Unique identifier prefix for the route map layers",
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
        name: "npoints",
        type: "number",
        defaultValue: "100",
        description: "Great-circle sampling density for each route leg",
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
        name: "labelClassName",
        type: "string",
        defaultValue: "-",
        description: "Additional classes for auto-rendered airport labels",
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
        name: "interactive",
        type: "boolean",
        defaultValue: "true",
        description: "Enable route-leg pointer events and callbacks",
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
    extra: [
      {
        title: "FlightRouteAnimateConfig",
        props: flightRouteAnimateConfigProps,
      },
    ],
  },
  {
    id: "flight-route-label",
    name: "FlightRouteLabel",
    description:
      "Places a fixed annotation on a route or pairs it with an aircraft so the label follows the flight while remaining readable.",
    snippet: `<Map center={[122, 26]} zoom={2.15}>
  <FlightRoute from="TPE" to="HND" showAirports />
  <FlightRouteLabel
    from="TPE"
    to="HND"
    mode="aircraft"
    position={0.08}
    labelPosition="right"
    animate={{ duration: 7200, loop: true }}
  >
    BR 198 · 42 min
  </FlightRouteLabel>
</Map>`,
    mapCenter: [122, 26],
    mapZoom: 2.15,
    props: [
      {
        name: "from",
        type: "AirportRef",
        defaultValue: "-",
        description: "Route origin",
      },
      {
        name: "to",
        type: "AirportRef",
        defaultValue: "-",
        description: "Route destination",
      },
      {
        name: "children",
        type: "ReactNode",
        defaultValue: "-",
        description: "Label content",
      },
      {
        name: "mode",
        type: '"route" | "aircraft"',
        defaultValue: '"route"',
        description: "Fixed route annotation or aircraft-following label",
      },
      {
        name: "position",
        type: "number",
        defaultValue: "0.5",
        description: "Route position or static aircraft progress from 0 to 1",
      },
      {
        name: "rotate",
        type: "boolean",
        defaultValue: "false",
        description: "Align a fixed route label to the route heading",
      },
      {
        name: "offset",
        type: "[number, number]",
        defaultValue: "[0, 0]",
        description: "Pixel offset from the route",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        defaultValue: '"md"',
        description: "Label type scale and spacing preset",
      },
      {
        name: "labelPosition",
        type: '"top" | "right" | "bottom" | "left"',
        defaultValue: '"right"',
        description: "Label placement around the aircraft",
      },
      {
        name: "animate",
        type: "boolean | FlightRouteLabelAnimateConfig",
        defaultValue: "false",
        description: "Animate the aircraft and attached label along the route",
      },
      {
        name: "icon",
        type: "ReactNode",
        defaultValue: "built-in plane",
        description: "Custom aircraft icon in aircraft mode",
      },
      {
        name: "iconSize",
        type: "number",
        defaultValue: "22",
        description: "Aircraft icon size in pixels",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "-",
        description: "Additional label classes",
      },
      {
        name: "npoints",
        type: "number",
        defaultValue: "100",
        description: "Great-circle route sampling density",
      },
    ],
    extra: [
      {
        title: "FlightRouteLabelAnimateConfig",
        props: [
          {
            name: "duration",
            type: "number",
            defaultValue: "7200",
            description: "Milliseconds for a complete route traversal",
          },
          {
            name: "loop",
            type: "boolean",
            defaultValue: "true",
            description: "Restart after reaching the destination",
          },
        ],
      },
    ],
  },
  {
    id: "flight-tracker",
    name: "FlightTracker",
    description:
      "Tracks one flight along a great-circle route with completed and remaining path segments, heading-aware aircraft UI, progress, and optional operational details.",
    snippet: `<Map center={[66, 38]} zoom={1.2}>
  <FlightTracker
    from="TPE"
    to="LHR"
    progress={0.58}
    altitude={36000}
    speed={486}
  >
    <span className="flex items-center gap-2">
      <span>CI 081</span>
      <span className="text-emerald-600">En route</span>
    </span>
  </FlightTracker>
</Map>`,
    mapCenter: [66, 38],
    mapZoom: 1.2,
    props: [
      {
        name: "from",
        type: "AirportRef",
        defaultValue: "-",
        description: "Origin airport or coordinate",
      },
      {
        name: "to",
        type: "AirportRef",
        defaultValue: "-",
        description: "Destination airport or coordinate",
      },
      {
        name: "progress",
        type: "number",
        defaultValue: "-",
        description: "Controlled progress from 0 to 1",
      },
      {
        name: "id",
        type: "string",
        defaultValue: "auto-generated",
        description: "Unique identifier for the tracker map layers",
      },
      {
        name: "completedColor",
        type: "string",
        defaultValue: '"#0f172a"',
        description: "Completed path color",
      },
      {
        name: "remainingColor",
        type: "string",
        defaultValue: '"#94a3b8"',
        description: "Remaining path color",
      },
      {
        name: "width",
        type: "number",
        defaultValue: "3",
        description: "Completed and remaining route width",
      },
      {
        name: "showAirports",
        type: "boolean",
        defaultValue: "true",
        description: "Render origin and destination markers",
      },
      {
        name: "showLabel",
        type: "boolean",
        defaultValue: "true",
        description: "Show labels on endpoint markers",
      },
      {
        name: "children",
        type: "ReactNode",
        defaultValue: "route codes",
        description: "Custom content shown in the info card beside progress",
      },
      {
        name: "altitude",
        type: "number",
        defaultValue: "-",
        description: "Altitude in feet",
      },
      {
        name: "speed",
        type: "number",
        defaultValue: "-",
        description: "Speed in knots",
      },
      {
        name: "showInfo",
        type: "boolean",
        defaultValue: "true",
        description: "Whether to show the aircraft info card",
      },
      {
        name: "icon",
        type: "ReactNode",
        defaultValue: "built-in plane",
        description: "Custom aircraft icon",
      },
      {
        name: "iconSize",
        type: "number",
        defaultValue: "26",
        description: "Aircraft icon size in pixels",
      },
      {
        name: "npoints",
        type: "number",
        defaultValue: "140",
        description: "Great-circle route sampling density",
      },
    ],
  },
  {
    id: "aircraft-trail",
    name: "AircraftTrail",
    description:
      "Plots observed positions as a fading trail with a current-aircraft marker and smooth altitude-based route colors.",
    snippet: `<Map center={[130.5, 30.2]} zoom={3.15}>
  <AircraftTrail
    positions={[
      { longitude: 139.78, latitude: 35.55, altitude: 200 },
      { longitude: 135.4, latitude: 32.95, altitude: 23600 },
      { longitude: 129.5, latitude: 30.25, altitude: 39000 },
      { longitude: 127.95, latitude: 28.85, altitude: 35000 },
      { longitude: 126.9, latitude: 27.45, altitude: 27000 },
    ]}
    altitudeColorStops={[
      { altitude: 0, color: "#22c55e" },
      { altitude: 10000, color: "#06b6d4" },
      { altitude: 24000, color: "#2563eb" },
      { altitude: 39000, color: "#7c3aed" },
    ]}
    startOpacity={0.42}
  />
</Map>`,
    mapCenter: [130.5, 30.2],
    mapZoom: 3.15,
    props: [
      {
        name: "positions",
        type: "readonly AircraftTrailPosition[]",
        defaultValue: "-",
        description: "Ordered historical positions",
      },
      {
        name: "to",
        type: "AirportRef",
        defaultValue: "-",
        description: "Destination for an automatic dashed continuation",
      },
      {
        name: "plannedPositions",
        type: "readonly AircraftTrailPosition[]",
        defaultValue: "-",
        description:
          "Explicit future route points; takes precedence over the destination arc",
      },
      {
        name: "id",
        type: "string",
        defaultValue: "auto-generated",
        description: "Unique identifier for the trail map layers",
      },
      {
        name: "color",
        type: "string",
        defaultValue: '"#0f172a"',
        description:
          "Single-color trail fallback used when altitudeColorStops is omitted",
      },
      {
        name: "altitudeColorStops",
        type: "readonly AircraftTrailAltitudeColorStop[]",
        defaultValue: "-",
        description:
          "Altitude-to-color scale with smooth transitions along the recorded path",
      },
      {
        name: "width",
        type: "number",
        defaultValue: "2.5",
        description: "Trail width",
      },
      {
        name: "startOpacity",
        type: "number",
        defaultValue: "0.04",
        description: "Oldest trail opacity",
      },
      {
        name: "endOpacity",
        type: "number",
        defaultValue: "1",
        description: "Recent trail opacity",
      },
      {
        name: "showGlow",
        type: "boolean",
        defaultValue: "true",
        description: "Render a soft halo beneath the recorded path",
      },
      {
        name: "showAircraft",
        type: "boolean",
        defaultValue: "true",
        description: "Show aircraft at latest position",
      },
      {
        name: "icon",
        type: "ReactNode",
        defaultValue: "built-in plane",
        description: "Custom aircraft icon",
      },
      {
        name: "iconSize",
        type: "number",
        defaultValue: "24",
        description: "Current aircraft icon size in pixels",
      },
      {
        name: "plannedColor",
        type: "string",
        defaultValue: "trail color",
        description: "Dashed continuation color",
      },
      {
        name: "plannedWidth",
        type: "number",
        defaultValue: "82% of trail width",
        description: "Dashed continuation width",
      },
      {
        name: "plannedOpacity",
        type: "number",
        defaultValue: "0.62",
        description: "Dashed continuation opacity",
      },
      {
        name: "plannedDashArray",
        type: "readonly [number, number]",
        defaultValue: "[2, 2]",
        description: "Dash and gap lengths for the continuation",
      },
      {
        name: "plannedCurvature",
        type: "number",
        defaultValue: "0.14",
        description:
          "Automatic destination route bend; use 0 for a great-circle path or a negative value to bend the opposite way",
      },
      {
        name: "npoints",
        type: "number",
        defaultValue: "72",
        description: "Generated destination arc sampling density",
      },
    ],
    extra: [
      {
        title: "AircraftTrailPosition",
        props: [
          {
            name: "longitude",
            type: "number",
            defaultValue: "-",
            description: "Recorded longitude",
          },
          {
            name: "latitude",
            type: "number",
            defaultValue: "-",
            description: "Recorded latitude",
          },
          {
            name: "timestamp",
            type: "number | string",
            defaultValue: "-",
            description: "Optional observation time",
          },
          {
            name: "altitude",
            type: "number",
            defaultValue: "-",
            description: "Altitude used by the color scale, typically feet",
          },
        ],
      },
      {
        title: "AircraftTrailAltitudeColorStop",
        props: [
          {
            name: "altitude",
            type: "number",
            defaultValue: "-",
            description: "Altitude threshold in the same unit as each position",
          },
          {
            name: "color",
            type: "string",
            defaultValue: "-",
            description: "Color at this altitude threshold",
          },
        ],
      },
    ],
  },
  {
    id: "flight-network",
    name: "FlightNetwork",
    description:
      "Renders a weighted airport network and highlights linked routes when an airport is hovered or selected.",
    snippet: `<Map center={[121, 23]} zoom={1.9}>
  <FlightNetwork
    routes={[
      { from: "TPE", to: "HND", value: 18 },
      { from: "TPE", to: "SIN", value: 11 },
      { from: "TPE", to: "BKK", value: 8 },
    ]}
  />
</Map>`,
    mapCenter: [121, 23],
    mapZoom: 1.9,
    props: [
      {
        name: "routes",
        type: "readonly FlightNetworkRoute[]",
        defaultValue: "-",
        description:
          "Origin/destination routes whose relative values scale route width and connected airport node size",
      },
      {
        name: "id",
        type: "string",
        defaultValue: "auto-generated",
        description: "Unique identifier for the network map layers",
      },
      {
        name: "color",
        type: "string",
        defaultValue: '"#64748b"',
        description: "Inactive route and node color",
      },
      {
        name: "highlightColor",
        type: "string",
        defaultValue: '"#0f172a"',
        description: "Focused route and node color",
      },
      {
        name: "minRouteWidth",
        type: "number",
        defaultValue: "0.75",
        description: "Route width used at zero weight",
      },
      {
        name: "maxRouteWidth",
        type: "number",
        defaultValue: "2.75",
        description: "Route width used by the highest-weight route",
      },
      {
        name: "minNodeSize",
        type: "number",
        defaultValue: "3",
        description: "Airport node radius used at zero total connected weight",
      },
      {
        name: "maxNodeSize",
        type: "number",
        defaultValue: "7.5",
        description:
          "Airport node radius used by the highest total connected weight",
      },
      {
        name: "showLabels",
        type: "boolean",
        defaultValue: "true",
        description: "Show airport labels",
      },
      {
        name: "selectedAirport",
        type: "string | null",
        defaultValue: "null",
        description:
          "Airport label to focus; connected routes are highlighted and others fade",
      },
      {
        name: "onAirportSelect",
        type: "(airport: string | null) => void",
        defaultValue: "-",
        description: "Callback fired when an airport node is clicked",
      },
      {
        name: "npoints",
        type: "number",
        defaultValue: "100",
        description: "Great-circle route sampling density",
      },
    ],
    extra: [
      {
        title: "FlightNetworkRoute",
        props: [
          {
            name: "from",
            type: "AirportRef",
            defaultValue: "-",
            description: "Route origin as an IATA code or coordinate pair",
          },
          {
            name: "to",
            type: "AirportRef",
            defaultValue: "-",
            description: "Route destination as an IATA code or coordinate pair",
          },
          {
            name: "value",
            type: "number",
            defaultValue: "1",
            description:
              "Relative non-negative weight; increases route width and contributes to both connected node sizes",
          },
        ],
      },
    ],
  },
  {
    id: "flight-range",
    name: "FlightRange",
    description:
      "Draws true geodesic range bands in kilometres. Large ranges naturally distort in Mercator, so use globe projection when geographic shape matters.",
    snippet: `<Map projection={{ type: "globe" }} center={[121, 24]} zoom={1.9}>
  <FlightRange
    origin="TPE"
    ranges={[
      { distance: 800, color: "#bfdbfe", opacity: 0.08 },
      { distance: 1800, color: "#60a5fa", opacity: 0.055 },
      { distance: 3200, color: "#2563eb", opacity: 0.035 },
    ]}
  />
</Map>`,
    mapCenter: [121, 24],
    mapZoom: 1.9,
    projection: { type: "globe" },
    props: [
      {
        name: "origin",
        type: "AirportRef",
        defaultValue: "-",
        description: "Range centre",
      },
      {
        name: "ranges",
        type: "readonly FlightRangeBand[]",
        defaultValue: "-",
        description: "Distance bands in kilometres",
      },
      {
        name: "id",
        type: "string",
        defaultValue: "auto-generated",
        description: "Unique identifier for the range map layers",
      },
      {
        name: "outlineWidth",
        type: "number",
        defaultValue: "1.5",
        description: "Band outline width",
      },
      {
        name: "showOrigin",
        type: "boolean",
        defaultValue: "true",
        description: "Render the origin marker",
      },
      {
        name: "showLabel",
        type: "boolean",
        defaultValue: "true",
        description: "Show the origin label",
      },
      {
        name: "steps",
        type: "number",
        defaultValue: "128",
        description: "Geodesic polygon sampling density",
      },
    ],
    extra: [
      {
        title: "FlightRangeBand",
        props: [
          {
            name: "distance",
            type: "number",
            defaultValue: "-",
            description: "Range radius in kilometres",
          },
          {
            name: "color",
            type: "string",
            defaultValue: "palette by band order",
            description: "Fill and outline color for this band",
          },
          {
            name: "opacity",
            type: "number",
            defaultValue: "0.065",
            description: "Fill opacity for this band",
          },
        ],
      },
    ],
  },
  {
    id: "flight-flow",
    name: "FlightFlow",
    description:
      "Distributes multiple aircraft silhouettes across weighted routes and supports both animated traffic flow and a static traffic snapshot.",
    snippet: `<Map center={[123.5, 25]} zoom={3.05}>
  <FlightFlow
    routes={[
      { from: "HND", to: "TPE", value: 14 },
      { from: "ICN", to: "TPE", value: 8 },
      { from: "HKG", to: "TPE", value: 11 },
      { from: "BKK", to: "TPE", value: 7 },
      { from: "MNL", to: "TPE", value: 6 },
    ]}
    aircraftCount={30}
    animate
  />
</Map>`,
    mapCenter: [123.5, 25],
    mapZoom: 3.05,
    props: [
      {
        name: "routes",
        type: "readonly FlightFlowRoute[]",
        defaultValue: "-",
        description:
          "Aircraft routes with relative weights or exact per-route aircraft counts",
      },
      {
        name: "id",
        type: "string",
        defaultValue: "auto-generated",
        description: "Unique identifier for the traffic-flow map layers",
      },
      {
        name: "color",
        type: "string",
        defaultValue: '"#f59e0b"',
        description: "Aircraft icon color",
      },
      {
        name: "showRoutes",
        type: "boolean",
        defaultValue: "false",
        description: "Show subtle guide routes beneath the aircraft",
      },
      {
        name: "routeColor",
        type: "string",
        defaultValue: '"#94a3b8"',
        description: "Guide route color",
      },
      {
        name: "routeOpacity",
        type: "number",
        defaultValue: "0.16",
        description: "Guide route opacity",
      },
      {
        name: "routeWidth",
        type: "number",
        defaultValue: "1",
        description: "Base guide route width",
      },
      {
        name: "animate",
        type: "boolean",
        defaultValue: "true",
        description: "Move aircraft continuously along their routes",
      },
      {
        name: "aircraftCount",
        type: "number",
        defaultValue: "24",
        description:
          "Approximate total aircraft count distributed by route value",
      },
      {
        name: "aircraftSize",
        type: "number",
        defaultValue: "18",
        description: "Aircraft icon size in pixels",
      },
      {
        name: "duration",
        type: "number",
        defaultValue: "12000",
        description: "Milliseconds per route traversal",
      },
      {
        name: "npoints",
        type: "number",
        defaultValue: "100",
        description: "Great-circle route sampling density",
      },
      {
        name: "particleCount",
        type: "number",
        defaultValue: "-",
        description: "Deprecated alias for aircraftCount",
      },
      {
        name: "particleSize",
        type: "number",
        defaultValue: "-",
        description: "Deprecated size input; use aircraftSize instead",
      },
      {
        name: "tailLength",
        type: "number",
        defaultValue: "-",
        description:
          "Deprecated and ignored; aircraft tails are no longer rendered",
      },
    ],
    extra: [
      {
        title: "FlightFlowRoute",
        props: [
          {
            name: "from",
            type: "AirportRef",
            defaultValue: "-",
            description: "Route origin and aircraft travel direction",
          },
          {
            name: "to",
            type: "AirportRef",
            defaultValue: "-",
            description: "Route destination",
          },
          {
            name: "value",
            type: "number",
            defaultValue: "1",
            description:
              "Relative traffic weight used to distribute aircraftCount and scale guide route width",
          },
          {
            name: "aircraftCount",
            type: "number",
            defaultValue: "-",
            description:
              "Exact aircraft count for this route; overrides weighted distribution",
          },
        ],
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
      name: "samples",
      type: "number",
      defaultValue: "300",
      description: "Orbit path sampling density",
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
      name: "duration",
      type: "number",
      defaultValue: "16000",
      description: "Animation duration in milliseconds",
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

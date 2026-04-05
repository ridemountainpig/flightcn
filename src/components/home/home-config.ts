import { type FlightRouteData } from "@/registry/flight";
import { airports, type AirportInfo } from "@/registry/flight-airports";

export const mapStyles = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
} as const;

export const installCommand = "npx shadcn@latest add @flightcn/flight";

export const routeExamples: readonly FlightRouteData[] = [
  { from: "TPE", to: "HND", tripType: "round-trip" },
  { from: "TPE", to: "ICN" },
  { from: "TPE", to: "HKG" },
  { from: "TPE", to: "SIN" },
  { from: "TPE", to: "BKK" },
  { from: "TPE", to: "MNL" },
];

export const allAirports: AirportInfo[] = Object.values(airports);

const FEATURED_AIRPORT_CODES = [
  "TPE",
  "HND",
  "ICN",
  "SIN",
  "HKG",
  "DXB",
  "LHR",
  "LAX",
] as const;

export const featuredAirportsForSearch: AirportInfo[] =
  FEATURED_AIRPORT_CODES.map((code) => airports[code]).filter(
    (a): a is AirportInfo => a != null,
  );

export type ExampleId =
  | "airport-dot"
  | "flight-route"
  | "route-hover"
  | "flight-routes"
  | "multiple-leg"
  | "animation"
  | "globe";

export type ExampleConfig = {
  id: ExampleId;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  code: string;
  center: [number, number];
  zoom: number;
  projection?: { type: "globe" };
};

export const exampleConfigs: readonly ExampleConfig[] = [
  {
    id: "airport-dot",
    label: "Airport Markers",
    eyebrow: "Marker",
    title: "Standalone airport markers",
    description:
      "Render airport dots by IATA code, attach labels, and keep the map focused on a compact regional view.",
    code: `<Map>
  <FlightAirport code="TPE" showLabel />
  <FlightAirport code="HND" showLabel />
  <FlightAirport code="ICN" showLabel />
</Map>`,
    center: [128, 29],
    zoom: 2.35,
  },
  {
    id: "flight-route",
    label: "Direct Route",
    eyebrow: "Single Route",
    title: "One great-circle route",
    description:
      "Display a single route between two airports with endpoint markers, labels, and the default route styling.",
    code: `<Map>
  <FlightRoute
    from="JFK"
    to="LHR"
    showAirports
    showLabel
  />
</Map>`,
    center: [-37, 49],
    zoom: 2.55,
  },
  {
    id: "route-hover",
    label: "Route Hover",
    eyebrow: "Interactive",
    title: "Hover tooltips on route focus",
    description:
      "Hover the route to reveal built-in flight info, including trip type, distance, and estimated duration.",
    code: `<Map>
  <FlightRoute
    from="TPE"
    to="HND"
    showAirports
    showLabel
    hoverEffect
    tripType="round-trip"
  />
</Map>`,
    center: [122, 26],
    zoom: 2.15,
  },
  {
    id: "flight-routes",
    label: "Route Network",
    eyebrow: "Batch Routes",
    title: "Multiple routes from one dataset",
    description:
      "Batch render multiple routes with shared defaults while still keeping hover states and airport markers visible.",
    code: `<Map>
  <FlightRoutes
    routes={[
      { from: "TPE", to: "HND", tripType: "round-trip" },
      { from: "TPE", to: "ICN" },
      { from: "TPE", to: "HKG" },
    ]}
    showAirports
    showLabel
  />
</Map>`,
    center: [118, 18],
    zoom: 2.05,
  },
  {
    id: "multiple-leg",
    label: "Multi-Stop Journey",
    eyebrow: "Waypoints",
    title: "Sequential waypoint routing",
    description:
      "Connect multiple airports in order and show each stopover as part of a single multi-leg path.",
    code: `<Map>
  <FlightMultiRoute
    waypoints={["TPE", "DXB", "ZRH", "JFK"]}
    showAirports
    showLabel
  />
</Map>`,
    center: [28, 28],
    zoom: 1.2,
  },
  {
    id: "animation",
    label: "Animated Flight",
    eyebrow: "Animated",
    title: "Round-trip plane animation",
    description:
      'Animate a plane across the route; use tripType="round-trip" for a return leg, or one-way for a single direction.',
    code: `<Map>
  <FlightRoute
    from="NRT"
    to="TPE"
    showAirports
    showLabel
    tripType="round-trip"
    animate={{ duration: 5000 }}
  />
  <FlightRoute
    from="TPE"
    to="DXB"
    showAirports
    showLabel
    tripType="one-way"
    animate={{ duration: 8000 }}
  />
</Map>`,
    center: [120, 18],
    zoom: 1.95,
  },
  {
    id: "globe",
    label: "Globe View",
    eyebrow: "Projection",
    title: "Globe projection preview",
    description:
      "Switch to globe projection and preview long-haul routes on a spherical map instead of the flat Mercator view.",
    code: `<Map projection={{ type: "globe" }}>
  <FlightRoute from="CDG" to="SYD" showAirports showLabel />
</Map>`,
    center: [25, 6],
    zoom: 0.9,
    projection: { type: "globe" },
  },
];

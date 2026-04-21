import type { ProductKey } from "@/components/product-switcher";
import { type FlightRouteData } from "@/registry/flight";
import { airports, type AirportInfo } from "@/registry/flight-airports";

export const mapStyles = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
} as const;

export const flightInstallCommand = "npx shadcn@latest add @flightcn/flight";
export const satelliteInstallCommand =
  "npx shadcn@latest add @flightcn/satellite";
export const installCommandByProduct: Record<ProductKey, string> = {
  flight: flightInstallCommand,
  satellite: satelliteInstallCommand,
};

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

export type FlightExampleId =
  | "airport-dot"
  | "flight-route"
  | "route-hover"
  | "flight-routes"
  | "multiple-leg"
  | "animation"
  | "globe";

export type SatelliteExampleId =
  | "satellite-orbit"
  | "satellite-orbits"
  | "satellite-custom-icon";

export type ExampleId = FlightExampleId | SatelliteExampleId;

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

export const flightExamples: readonly ExampleConfig[] = [
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

export const satelliteExamples: readonly ExampleConfig[] = [
  {
    id: "satellite-orbit",
    label: "Single Orbit",
    eyebrow: "Globe Overlay",
    title: "Animated orbital overlay on the globe",
    description:
      "Render an orbital path, ground track, and animated satellite marker to present space or telecom coverage scenarios alongside the mapcn globe.",
    code: `<Map projection={{ type: "globe" }}>
  <SatelliteOrbit
    inclination={51.6}
    ascendingNode={-28}
    name="ISS"
    showLabel
    animate={{ duration: 12000 }}
  />
</Map>`,
    center: [8, 16],
    zoom: 1.05,
    projection: { type: "globe" },
  },
  {
    id: "satellite-orbits",
    label: "Multiple Orbits",
    eyebrow: "Orbit Dataset",
    title: "Multiple orbits from one dataset",
    description:
      "Render a constellation of orbital paths from a single array; animation, labels, and marker styling stay shared while each orbit can override inclination and ascending node.",
    code: `<Map projection={{ type: "globe" }}>
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
    center: [8, 16],
    zoom: 1.05,
    projection: { type: "globe" },
  },
  {
    id: "satellite-custom-icon",
    label: "Custom Icon",
    eyebrow: "SVG Icon",
    title: "Render two custom SVG satellites",
    description:
      "Use separate SVG markers per orbit so the same globe scene can mix an ISS silhouette with an asteroid icon instead of reusing one shared marker.",
    code: `<Map projection={{ type: "globe" }}>
  <SatelliteOrbit
    inclination={46}
    ascendingNode={10}
    name="ISS"
    showLabel
    animate={{ duration: 8000 }}
    satelliteIconSvg={issSvg}
    satelliteIconRotationOffset={-90}
  />
  <SatelliteOrbit
    inclination={-18}
    ascendingNode={116}
    name="Asteroid"
    showLabel
    animate={{ duration: 10000 }}
    satelliteIconSvg={asteroidSvg}
  />
</Map>`,
    center: [58, 12],
    zoom: 1.05,
    projection: { type: "globe" },
  },
];

export const examplesByProduct: Record<ProductKey, readonly ExampleConfig[]> = {
  flight: flightExamples,
  satellite: satelliteExamples,
};

export type HeroCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export const heroCopy: Record<ProductKey, HeroCopy> = {
  flight: {
    eyebrow: "flightcn + mapcn",
    title: "Build flight route maps for mapcn and MapLibre.",
    subtitle:
      "Render airport markers, great-circle paths, and multi-leg journeys from IATA codes with the flightcn component set.",
    ctaPrimary: "Get Started",
    ctaSecondary: "View Docs",
  },
  satellite: {
    eyebrow: "flightcn + mapcn",
    title: "Render orbital overlays on the mapcn globe.",
    subtitle:
      "Drop animated orbits, ground tracks, and custom satellite markers onto a MapLibre globe projection with the flightcn satellite component.",
    ctaPrimary: "Get Started",
    ctaSecondary: "View Docs",
  },
};

export type ShowcaseCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

export const showcaseCopy: Record<ProductKey, ShowcaseCopy> = {
  flight: {
    eyebrow: "Live Examples",
    title: "Preview airport markers, routes, and multi-leg flight paths",
    description:
      "Explore real flightcn usage patterns before installing the component into your own mapcn project.",
  },
  satellite: {
    eyebrow: "Live Examples",
    title: "Preview orbital paths, ground tracks, and animated satellites",
    description:
      "Explore real satellite overlay patterns on the mapcn globe before installing the component into your own project.",
  },
};

export type InstallStepsCopy = {
  heroTitle: string;
  heroSubtitle: string;
  step1Title: string;
  step1Description: string;
  step2ImportCode: string;
  step3Title: string;
  step3RenderCode: string;
  docsHref: string;
  docsLabel: string;
  crossLinkHref: string;
  crossLinkLabel: string;
  crossLinkPrefix: string;
};

export const installSteps: Record<ProductKey, InstallStepsCopy> = {
  flight: {
    heroTitle: "Flight Install Guide",
    heroSubtitle: "Install the route components for mapcn + flightcn",
    step1Title: "Install the flight components",
    step1Description:
      "Use `shadcn add` to pull the flight route components into your current project.",
    step2ImportCode: `import { Map } from "@/components/ui/map";
import { FlightRoute } from "@/components/ui/flight";`,
    step3Title: "Render your first route",
    step3RenderCode: `export default function Demo() {
  return (
    <div className="h-screen w-screen">
      <Map className="h-full w-full" center={[121.5, 25]} zoom={3}>
        <FlightRoute from="TPE" to="LAX" showAirports showLabel />
      </Map>
    </div>
  );
}`,
    docsHref: "/docs/flight",
    docsLabel: "flight docs page",
    crossLinkHref: "/docs/install/satellite",
    crossLinkLabel: "satellite install guide",
    crossLinkPrefix: "Need the orbital overlay instead? See the",
  },
  satellite: {
    heroTitle: "Satellite Install Guide",
    heroSubtitle: "Install the orbital overlay component for mapcn",
    step1Title: "Install the satellite component",
    step1Description:
      "Use `shadcn add` to pull the `SatelliteOrbit` component into your current project.",
    step2ImportCode: `import { Map } from "@/components/ui/map";
import { SatelliteOrbit } from "@/components/ui/satellite-orbit";`,
    step3Title: "Render your first orbit",
    step3RenderCode: `export default function Demo() {
  return (
    <div className="h-screen w-screen">
      <Map
        className="h-full w-full"
        projection={{ type: "globe" }}
        center={[8, 16]}
        zoom={1.05}
      >
        <SatelliteOrbit
          inclination={51.6}
          ascendingNode={-28}
          name="ISS"
          showLabel
          animate={{ duration: 12000 }}
        />
      </Map>
    </div>
  );
}`,
    docsHref: "/docs/satellite",
    docsLabel: "satellite docs page",
    crossLinkHref: "/docs/install/flight",
    crossLinkLabel: "flight install guide",
    crossLinkPrefix: "Need the route components instead? See the",
  },
};

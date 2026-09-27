import type { ComponentType } from "react";

import { LiveFlightTrackerDemo } from "@/components/recipes/demos/live-flight-tracker-demo";
import { AirlineRouteMapDemo } from "@/components/recipes/demos/airline-route-map-demo";
import { FlightHistoryMapDemo } from "@/components/recipes/demos/flight-history-map-demo";

export type RecipeStep = {
  title: string;
  /** Prose paragraphs, separated by blank lines. */
  body: string;
  code?: string;
};

export type RecipeConfig = {
  /** URL segment under /recipes/. */
  slug: string;
  /** SEO-facing page title, e.g. "Build a Live Flight Tracker in React". */
  title: string;
  /** Short name for cards, chips and prev/next links. */
  navTitle: string;
  /** Meta description; also the card blurb on the index page. */
  description: string;
  /** Lead paragraph rendered under the h1. */
  intro: string;
  keywords: readonly string[];
  /** flightcn components this recipe uses, linked to their docs sections. */
  components: readonly { name: string; href: string }[];
  /** Registry item the install step adds, e.g. "@flightcn/flight". */
  installItem: string;
  demo: ComponentType<{ className?: string }>;
  /** One line under the live demo explaining what it shows. */
  demoNote: string;
  steps: readonly RecipeStep[];
  /** The complete component users copy at the end. */
  fullCode: string;
};

export const recipesConfig: readonly RecipeConfig[] = [
  {
    slug: "live-flight-tracker",
    title: "Build a Live Flight Tracker in React",
    navTitle: "Live Flight Tracker",
    description:
      "Build a live flight tracker in React with a controlled FlightTracker fed by any flight data API — completed and remaining route, aircraft position, altitude and speed.",
    intro:
      "FlightTracker is a controlled component: you hand it a progress value between 0 and 1 and it draws the completed route, the remaining route, and the aircraft in between. That makes live tracking a data problem, not a rendering problem — poll any flight API, turn the latest position into progress, and the map follows.",
    keywords: [
      "react flight tracker",
      "live flight tracking react",
      "flight tracker component",
      "opensky react",
      "real-time flight map",
    ],
    components: [
      { name: "FlightTracker", href: "/docs/flight#flight-tracker" },
    ],
    installItem: "@flightcn/flight",
    demo: LiveFlightTrackerDemo,
    demoNote:
      "The feed here is simulated — progress advances the way a polled API would. Wire the steps below to a real data source and nothing else changes.",
    steps: [
      {
        title: "Start with a controlled tracker",
        body: "Render a FlightTracker between two IATA codes and drive it with a static progress value first. The component splits the great-circle route at that fraction, places the aircraft on the split, and shows altitude and speed in the info card when you pass them.",
        code: `import { Map } from "@/components/ui/map";
import { FlightTracker } from "@/components/ui/flight";

export function LiveFlight() {
  return (
    <Map center={[131.2, 30.9]} zoom={3}>
      <FlightTracker
        from="TPE"
        to="NRT"
        progress={0.63}
        altitude={37000}
        speed={905}
      />
    </Map>
  );
}`,
      },
      {
        title: "Turn a live position into progress",
        body: "Flight APIs give you the aircraft's current coordinates, not a fraction. Convert the position into progress by comparing the distance already flown against the distance still to go — this stays accurate even when the aircraft drifts off the ideal great circle.\n\nThe built-in airport registry resolves both endpoints from their IATA codes, so the only input you need from your feed is a [longitude, latitude] pair.",
        code: `import { getAirportInfo } from "@/components/ui/flight";

function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Fraction of the trip completed, from the aircraft's current position. */
function progressFromPosition(
  from: string,
  to: string,
  position: [number, number], // [longitude, latitude]
) {
  const origin = getAirportInfo(from);
  const destination = getAirportInfo(to);
  if (!origin || !destination) return 0;

  const flown = haversineKm([origin.longitude, origin.latitude], position);
  const remaining = haversineKm(position, [
    destination.longitude,
    destination.latitude,
  ]);
  return flown / (flown + remaining);
}`,
      },
      {
        title: "Poll your flight data source",
        body: "flightcn is a pure visualization layer, so the data source is entirely yours — OpenSky, FlightAware AeroAPI, an airline API, or your own backend over WebSocket. A small polling hook keeps the last known state when a request fails, so the aircraft never disappears mid-flight.\n\nOnly mapFeedToFlight knows your provider's response shape. With OpenSky state vectors, for example, longitude and latitude sit at indexes 5 and 6.",
        code: `import { useEffect, useState } from "react";

type LiveFlightState = {
  position: [number, number];
  altitude?: number;
  speed?: number;
};

/** Adapt this to your provider's response shape. */
function mapFeedToFlight(data: unknown): LiveFlightState | null {
  const state = (data as { states?: (number | string | null)[][] })
    .states?.[0];
  if (!state || state[5] == null || state[6] == null) return null;
  return {
    position: [Number(state[5]), Number(state[6])],
    altitude: state[7] != null ? Math.round(Number(state[7]) * 3.28) : undefined,
    speed: state[9] != null ? Math.round(Number(state[9]) * 3.6) : undefined,
  };
}

function useLiveFlight(url: string, intervalMs = 15000) {
  const [flight, setFlight] = useState<LiveFlightState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(url);
        if (!response.ok) return;
        const next = mapFeedToFlight(await response.json());
        if (!cancelled && next) setFlight(next);
      } catch {
        // Keep the last known position on transient errors.
      }
    }

    poll();
    const timer = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [url, intervalMs]);

  return flight;
}`,
      },
      {
        title: "Render the tracker from the feed",
        body: "Wire the hook and the progress helper into FlightTracker. Every poll updates progress, altitude and speed; the completed segment, the remaining segment and the aircraft marker all move together.",
        code: `export function LiveFlightTracker({
  from,
  to,
  feedUrl,
}: {
  from: string;
  to: string;
  feedUrl: string;
}) {
  const flight = useLiveFlight(feedUrl);
  const progress = flight
    ? progressFromPosition(from, to, flight.position)
    : 0;

  return (
    <Map center={[131.2, 30.9]} zoom={3}>
      <FlightTracker
        from={from}
        to={to}
        progress={progress}
        altitude={flight?.altitude}
        speed={flight?.speed}
      />
    </Map>
  );
}`,
      },
    ],
    fullCode: `"use client";

import { useEffect, useState } from "react";

import { Map } from "@/components/ui/map";
import { FlightTracker, getAirportInfo } from "@/components/ui/flight";

type LiveFlightState = {
  position: [number, number]; // [longitude, latitude]
  altitude?: number;
  speed?: number;
};

function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Fraction of the trip completed, from the aircraft's current position. */
function progressFromPosition(
  from: string,
  to: string,
  position: [number, number],
) {
  const origin = getAirportInfo(from);
  const destination = getAirportInfo(to);
  if (!origin || !destination) return 0;

  const flown = haversineKm([origin.longitude, origin.latitude], position);
  const remaining = haversineKm(position, [
    destination.longitude,
    destination.latitude,
  ]);
  return flown / (flown + remaining);
}

/** Adapt this to your provider's response shape (OpenSky shown here). */
function mapFeedToFlight(data: unknown): LiveFlightState | null {
  const state = (data as { states?: (number | string | null)[][] })
    .states?.[0];
  if (!state || state[5] == null || state[6] == null) return null;
  return {
    position: [Number(state[5]), Number(state[6])],
    altitude: state[7] != null ? Math.round(Number(state[7]) * 3.28) : undefined,
    speed: state[9] != null ? Math.round(Number(state[9]) * 3.6) : undefined,
  };
}

function useLiveFlight(url: string, intervalMs = 15000) {
  const [flight, setFlight] = useState<LiveFlightState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(url);
        if (!response.ok) return;
        const next = mapFeedToFlight(await response.json());
        if (!cancelled && next) setFlight(next);
      } catch {
        // Keep the last known position on transient errors.
      }
    }

    poll();
    const timer = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [url, intervalMs]);

  return flight;
}

export function LiveFlightTracker({
  from,
  to,
  feedUrl,
}: {
  from: string;
  to: string;
  feedUrl: string;
}) {
  const flight = useLiveFlight(feedUrl);
  const progress = flight
    ? progressFromPosition(from, to, flight.position)
    : 0;

  return (
    <Map center={[131.2, 30.9]} zoom={3}>
      <FlightTracker
        from={from}
        to={to}
        progress={progress}
        altitude={flight?.altitude}
        speed={flight?.speed}
      />
    </Map>
  );
}`,
  },
  {
    slug: "airline-route-map",
    title: "Build an Airline Route Map in React",
    navTitle: "Airline Route Map",
    description:
      "Build an airline route map in React with FlightNetwork — weighted hub-and-spoke routes, airport nodes sized by traffic, and click-to-inspect selection.",
    intro:
      "An airline route map is a weighted network: busy routes should read thicker, busy airports bigger. FlightNetwork does both from a single routes array — each route's value drives its width and contributes to the size of both connected airport nodes, with hover and selection highlighting built in.",
    keywords: [
      "airline route map react",
      "flight network visualization",
      "hub and spoke map",
      "react route network",
      "airline network map",
    ],
    components: [
      { name: "FlightNetwork", href: "/docs/flight#flight-network" },
    ],
    installItem: "@flightcn/flight",
    demo: AirlineRouteMapDemo,
    demoNote:
      "A TPE hub network weighted by weekly departures. Hover any airport to highlight its routes, click to select it and read its traffic.",
    steps: [
      {
        title: "Shape your route data",
        body: "Each route is an origin, a destination and a relative weight. Use whatever metric matters to you — weekly departures, seats, passengers — the network only cares that values are comparable. Airports are referenced by IATA code and resolved from the built-in registry, so there are no coordinates to manage.",
        code: `import type { FlightNetworkRoute } from "@/components/ui/flight";

/** Weekly departures per route — value drives width and node size. */
const AIRLINE_ROUTES: FlightNetworkRoute[] = [
  { from: "TPE", to: "HND", value: 21 },
  { from: "TPE", to: "NRT", value: 17 },
  { from: "TPE", to: "KIX", value: 14 },
  { from: "TPE", to: "ICN", value: 14 },
  { from: "TPE", to: "HKG", value: 18 },
  { from: "TPE", to: "SIN", value: 12 },
  { from: "TPE", to: "BKK", value: 10 },
  { from: "TPE", to: "MNL", value: 7 },
  { from: "TPE", to: "SGN", value: 6 },
  { from: "TPE", to: "SYD", value: 4 },
  { from: "TPE", to: "LAX", value: 9 },
  { from: "TPE", to: "SFO", value: 7 },
  { from: "TPE", to: "SEA", value: 4 },
  { from: "TPE", to: "YVR", value: 5 },
];`,
      },
      {
        title: "Render the network",
        body: "Drop FlightNetwork on a Map and pass the routes. Route widths interpolate between minRouteWidth and maxRouteWidth, node sizes between minNodeSize and maxNodeSize — tune those four props and the two colors to match your brand instead of restyling individual routes.",
        code: `import { Map } from "@/components/ui/map";
import { FlightNetwork } from "@/components/ui/flight";

export function AirlineRouteMap() {
  return (
    <Map center={[163, 26]} zoom={1.7}>
      <FlightNetwork
        routes={AIRLINE_ROUTES}
        color="#64748b"
        highlightColor="#0f172a"
        minRouteWidth={0.75}
        maxRouteWidth={2.75}
      />
    </Map>
  );
}`,
      },
      {
        title: "Control the selection",
        body: 'Hover highlighting is built in. For click-to-inspect behavior, make the selection controlled: FlightNetwork reports clicks through onAirportSelect, and whatever airport you pass back through selectedAirport stays highlighted. From there the same routes array answers questions like "how many routes serve this airport" for a side panel or stats card.',
        code: `import { useMemo, useState } from "react";

export function AirlineRouteMap() {
  const [selected, setSelected] = useState<string | null>(null);

  const selectedRoutes = useMemo(
    () =>
      AIRLINE_ROUTES.filter(
        (route) => route.from === selected || route.to === selected,
      ),
    [selected],
  );

  return (
    <Map center={[163, 26]} zoom={1.7}>
      <FlightNetwork
        routes={AIRLINE_ROUTES}
        selectedAirport={selected}
        onAirportSelect={setSelected}
      />
    </Map>
  );
}`,
      },
    ],
    fullCode: `"use client";

import { useMemo, useState } from "react";

import { Map } from "@/components/ui/map";
import { FlightNetwork, getAirportInfo } from "@/components/ui/flight";
import type { FlightNetworkRoute } from "@/components/ui/flight";

/** Weekly departures per route — value drives width and node size. */
const AIRLINE_ROUTES: FlightNetworkRoute[] = [
  { from: "TPE", to: "HND", value: 21 },
  { from: "TPE", to: "NRT", value: 17 },
  { from: "TPE", to: "KIX", value: 14 },
  { from: "TPE", to: "ICN", value: 14 },
  { from: "TPE", to: "HKG", value: 18 },
  { from: "TPE", to: "SIN", value: 12 },
  { from: "TPE", to: "BKK", value: 10 },
  { from: "TPE", to: "MNL", value: 7 },
  { from: "TPE", to: "SGN", value: 6 },
  { from: "TPE", to: "SYD", value: 4 },
  { from: "TPE", to: "LAX", value: 9 },
  { from: "TPE", to: "SFO", value: 7 },
  { from: "TPE", to: "SEA", value: 4 },
  { from: "TPE", to: "YVR", value: 5 },
];

export function AirlineRouteMap() {
  const [selected, setSelected] = useState<string | null>(null);

  const summary = useMemo(() => {
    if (!selected) return null;
    const info = getAirportInfo(selected);
    const routes = AIRLINE_ROUTES.filter(
      (route) => route.from === selected || route.to === selected,
    );
    const weeklyFlights = routes.reduce(
      (total, route) => total + (route.value ?? 1),
      0,
    );
    return { info, routes: routes.length, weeklyFlights };
  }, [selected]);

  return (
    <div className="relative h-[480px] overflow-hidden rounded-xl">
      <Map center={[163, 26]} zoom={1.7}>
        <FlightNetwork
          routes={AIRLINE_ROUTES}
          selectedAirport={selected}
          onAirportSelect={setSelected}
        />
      </Map>
      {summary && (
        <div className="absolute bottom-4 left-4 rounded-xl border bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
          <p className="font-mono text-sm font-semibold">
            {selected}
            <span className="ml-2 font-sans font-normal text-slate-500">
              {summary.info?.city}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {summary.routes} routes · {summary.weeklyFlights} weekly flights
          </p>
        </div>
      )}
    </div>
  );
}`,
  },
  {
    slug: "flight-history-map",
    title: "Visualize Your Flight History in React",
    navTitle: "Flight History Map",
    description:
      "Visualize your flight history in React with FlightRoutes — draw a year of flights from IATA codes and compute flights, airports, countries and distance from the same log.",
    intro:
      "A personal flight map needs exactly one input: a log of where you flew. FlightRoutes draws every leg as a great-circle arc straight from IATA codes, and because the built-in airport registry knows each airport's city, country and coordinates, the same log also yields your travel stats — flights, airports, countries and total distance.",
    keywords: [
      "flight history map react",
      "personal flight map",
      "visualize flights react",
      "travel map component",
      "flight log visualization",
    ],
    components: [{ name: "FlightRoutes", href: "/docs/flight#flight-routes" }],
    installItem: "@flightcn/flight",
    demo: FlightHistoryMapDemo,
    demoNote:
      "Twelve flights from one year of travel — the stats bar is computed from the same array that draws the routes.",
    steps: [
      {
        title: "Log your flights",
        body: "One entry per leg: origin, destination, and optionally the date. Round trips are just two entries. This is deliberately the simplest format you could export from a spreadsheet, a notes app, or an airline's booking history.",
        code: `const FLIGHTS = [
  { from: "TPE", to: "HND", date: "2026-01-09" },
  { from: "HND", to: "TPE", date: "2026-01-14" },
  { from: "TPE", to: "ICN", date: "2026-03-02" },
  { from: "ICN", to: "TPE", date: "2026-03-06" },
  { from: "TPE", to: "SIN", date: "2026-04-18" },
  { from: "SIN", to: "BKK", date: "2026-04-23" },
  { from: "BKK", to: "TPE", date: "2026-04-27" },
  { from: "TPE", to: "SFO", date: "2026-06-11" },
  { from: "SFO", to: "JFK", date: "2026-06-15" },
  { from: "JFK", to: "TPE", date: "2026-06-24" },
  { from: "TPE", to: "KIX", date: "2026-09-04" },
  { from: "KIX", to: "TPE", date: "2026-09-08" },
];`,
      },
      {
        title: "Draw every route",
        body: "FlightRoutes takes the whole log at once — extra fields like date pass through untouched. Airport markers and code labels come from the same two props you'd use on a single route.",
        code: `import { Map } from "@/components/ui/map";
import { FlightRoutes } from "@/components/ui/flight";

export function FlightHistoryMap() {
  return (
    <Map center={[178, 34]} zoom={1.6}>
      <FlightRoutes routes={FLIGHTS} showAirports showLabel width={1.75} />
    </Map>
  );
}`,
      },
      {
        title: "Compute your travel stats",
        body: "Every stat derives from the log. getAirportInfo resolves each IATA code to its name, city, country and coordinates, so unique airports and countries are set lookups, and total distance is a haversine sum over the legs.",
        code: `import { getAirportInfo } from "@/components/ui/flight";

function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function computeStats(flights: { from: string; to: string }[]) {
  const airports = new Set<string>();
  const countries = new Set<string>();
  let distanceKm = 0;

  for (const flight of flights) {
    const from = getAirportInfo(flight.from);
    const to = getAirportInfo(flight.to);
    if (!from || !to) continue;
    airports.add(from.code).add(to.code);
    countries.add(from.country);
    countries.add(to.country);
    distanceKm += haversineKm(
      [from.longitude, from.latitude],
      [to.longitude, to.latitude],
    );
  }

  return {
    flights: flights.length,
    airports: airports.size,
    countries: countries.size,
    distanceKm: Math.round(distanceKm),
  };
}`,
      },
      {
        title: "Show the stats with the map",
        body: "Render the numbers wherever fits your layout — a bar under the map, an overlay card, or a share image. The demo above overlays them on the map; the full code below does the same, ready to screenshot and post.",
        code: `const stats = computeStats(FLIGHTS);

<div className="grid grid-cols-4 divide-x rounded-xl border bg-white/95">
  {[
    { label: "Flights", value: stats.flights },
    { label: "Airports", value: stats.airports },
    { label: "Countries", value: stats.countries },
    { label: "Distance", value: \`\${stats.distanceKm.toLocaleString()} km\` },
  ].map((item) => (
    <div key={item.label} className="px-4 py-2.5">
      <p className="font-mono text-sm font-semibold">{item.value}</p>
      <p className="text-[10px] uppercase text-slate-500">{item.label}</p>
    </div>
  ))}
</div>`,
      },
    ],
    fullCode: `"use client";

import { useMemo } from "react";

import { Map } from "@/components/ui/map";
import { FlightRoutes, getAirportInfo } from "@/components/ui/flight";

const FLIGHTS = [
  { from: "TPE", to: "HND", date: "2026-01-09" },
  { from: "HND", to: "TPE", date: "2026-01-14" },
  { from: "TPE", to: "ICN", date: "2026-03-02" },
  { from: "ICN", to: "TPE", date: "2026-03-06" },
  { from: "TPE", to: "SIN", date: "2026-04-18" },
  { from: "SIN", to: "BKK", date: "2026-04-23" },
  { from: "BKK", to: "TPE", date: "2026-04-27" },
  { from: "TPE", to: "SFO", date: "2026-06-11" },
  { from: "SFO", to: "JFK", date: "2026-06-15" },
  { from: "JFK", to: "TPE", date: "2026-06-24" },
  { from: "TPE", to: "KIX", date: "2026-09-04" },
  { from: "KIX", to: "TPE", date: "2026-09-08" },
];

function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function computeStats(flights: { from: string; to: string }[]) {
  const airports = new Set<string>();
  const countries = new Set<string>();
  let distanceKm = 0;

  for (const flight of flights) {
    const from = getAirportInfo(flight.from);
    const to = getAirportInfo(flight.to);
    if (!from || !to) continue;
    airports.add(from.code).add(to.code);
    countries.add(from.country);
    countries.add(to.country);
    distanceKm += haversineKm(
      [from.longitude, from.latitude],
      [to.longitude, to.latitude],
    );
  }

  return {
    flights: flights.length,
    airports: airports.size,
    countries: countries.size,
    distanceKm: Math.round(distanceKm),
  };
}

export function FlightHistoryMap() {
  const stats = useMemo(() => computeStats(FLIGHTS), []);

  const items = [
    { label: "Flights", value: String(stats.flights) },
    { label: "Airports", value: String(stats.airports) },
    { label: "Countries", value: String(stats.countries) },
    { label: "Distance", value: \`\${stats.distanceKm.toLocaleString()} km\` },
  ];

  return (
    <div className="relative h-[480px] overflow-hidden rounded-xl">
      <Map center={[178, 34]} zoom={1.6}>
        <FlightRoutes routes={FLIGHTS} showAirports showLabel width={1.75} />
      </Map>
      <div className="absolute bottom-4 left-4 grid grid-cols-4 divide-x rounded-xl border bg-white/95 shadow-sm backdrop-blur">
        {items.map((item) => (
          <div key={item.label} className="px-4 py-2.5">
            <p className="font-mono text-sm font-semibold">{item.value}</p>
            <p className="mt-0.5 text-[10px] uppercase text-slate-500">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}`,
  },
];

export function getRecipeBySlug(slug: string): RecipeConfig | undefined {
  return recipesConfig.find((recipe) => recipe.slug === slug);
}

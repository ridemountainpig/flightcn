import type { ComponentType } from "react";

import { FlightRoutePicker } from "@/registry/blocks/flight-route-picker/flight-route-picker";
import { FlightTrackerDashboard } from "@/registry/blocks/flight-tracker-dashboard/flight-tracker-dashboard";
import { FlightOpsOverview } from "@/registry/blocks/flight-ops-overview/flight-ops-overview";
import { LiveTrafficFlow } from "@/registry/blocks/live-traffic-flow/live-traffic-flow";
import { DeparturesBoard } from "@/registry/blocks/departures-board/departures-board";
import { AircraftRangeExplorer } from "@/registry/blocks/aircraft-range-explorer/aircraft-range-explorer";
import { NetworkCoverageGrid } from "@/registry/blocks/network-coverage-grid/network-coverage-grid";
import { AirlineNetworkDashboard } from "@/registry/blocks/airline-network-dashboard/airline-network-dashboard";
import { AirportSearchMap } from "@/registry/blocks/airport-search-map/airport-search-map";
import { AircraftTrailReplay } from "@/registry/blocks/aircraft-trail-replay/aircraft-trail-replay";
import { SatelliteOrbitTracker } from "@/registry/blocks/satellite-orbit-tracker/satellite-orbit-tracker";

export type BlockConfig = {
  id: string;
  title: string;
  description: string;
  category: "Flight" | "Satellite";
  /** Registry item name, e.g. "@flightcn/flight-ops-overview". */
  installItem: string;
  component: ComponentType;
};

export const blocksConfig: readonly BlockConfig[] = [
  {
    id: "flight-ops-overview",
    title: "Flight Ops Overview",
    description:
      "Operations dashboard with live KPI cards, a multi-flight tracking map, and an en-route sidebar that focuses flights on selection.",
    category: "Flight",
    installItem: "@flightcn/flight-ops-overview",
    component: FlightOpsOverview,
  },
  {
    id: "flight-tracker-dashboard",
    title: "Flight Tracker Dashboard",
    description:
      "Live flight progress on the map beside an operations card with altitude, speed, remaining distance, and a playback scrubber.",
    category: "Flight",
    installItem: "@flightcn/flight-tracker-dashboard",
    component: FlightTrackerDashboard,
  },
  {
    id: "flight-route-picker",
    title: "Flight Route Picker",
    description:
      "Search airports, explore featured routes, and arrange multiple stopovers to compare flight legs, distance and estimated time in the air.",
    category: "Flight",
    installItem: "@flightcn/flight-route-picker",
    component: FlightRoutePicker,
  },
  {
    id: "airline-network-dashboard",
    title: "Airline Network Dashboard",
    description:
      "Weighted hub-and-spoke route network with a ranked destination sidebar and two-way airport highlighting.",
    category: "Flight",
    installItem: "@flightcn/airline-network-dashboard",
    component: AirlineNetworkDashboard,
  },
  {
    id: "airport-search-map",
    title: "Airport Search Map",
    description:
      "Searchable panel over the built-in 500+ airport database with fly-to markers on selection.",
    category: "Flight",
    installItem: "@flightcn/airport-search-map",
    component: AirportSearchMap,
  },
  {
    id: "aircraft-trail-replay",
    title: "Aircraft Trail Replay",
    description:
      "Recorded flight track replay with an altitude-graded trail, dashed planned continuation, and a playback scrubber.",
    category: "Flight",
    installItem: "@flightcn/aircraft-trail-replay",
    component: AircraftTrailReplay,
  },
  {
    id: "live-traffic-flow",
    title: "Live Traffic Flow",
    description:
      "Animated aircraft flowing along weighted global corridors with density presets and toggleable route guides.",
    category: "Flight",
    installItem: "@flightcn/live-traffic-flow",
    component: LiveTrafficFlow,
  },
  {
    id: "departures-board",
    title: "Departures Board",
    description:
      "Status-filterable departure list that draws the selected flight on the map — live progress for airborne flights, dashed routes for the rest.",
    category: "Flight",
    installItem: "@flightcn/departures-board",
    component: DeparturesBoard,
  },
  {
    id: "aircraft-range-explorer",
    title: "Aircraft Range Explorer",
    description:
      "Compare aircraft reach from a departure airport, with labeled 75% and maximum-range boundaries and a live destination count.",
    category: "Flight",
    installItem: "@flightcn/aircraft-range-explorer",
    component: AircraftRangeExplorer,
  },
  {
    id: "network-coverage-grid",
    title: "Network Coverage Grid",
    description:
      "Region-filtered airport coverage map above a stats card grid with two-way selection between cards and markers.",
    category: "Flight",
    installItem: "@flightcn/network-coverage-grid",
    component: NetworkCoverageGrid,
  },
  {
    id: "satellite-orbit-tracker",
    title: "Satellite Orbit Tracker",
    description:
      "Multi-satellite orbit constellation on a globe with per-satellite visibility toggles and orbital metadata.",
    category: "Satellite",
    installItem: "@flightcn/satellite-orbit-tracker",
    component: SatelliteOrbitTracker,
  },
];

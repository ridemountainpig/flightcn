import type { Metadata } from "next";

import { AirportsMapView } from "@/components/airports/airports-map-view";

export const metadata: Metadata = {
  title: "Airports",
  description: "Search flightcn airport data and locate airports on the map.",
};

export default function AirportsPage() {
  return <AirportsMapView />;
}

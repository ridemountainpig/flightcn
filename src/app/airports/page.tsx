import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { AirportsMapView } from "@/components/airports/airports-map-view";
import { allAirports } from "@/components/home/home-config";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Airport Search",
  description:
    "Search the built-in flightcn airport registry by IATA code, city, country, or airport name and preview each airport on the map.",
  path: "/airports",
  keywords: ["IATA airport search", "airport registry", "airport map lookup"],
});

const airportsJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "flightcn airport registry",
    description:
      "Search and explore the airport dataset bundled with flightcn.",
    url: absoluteUrl("/airports"),
    mainEntity: {
      "@type": "Dataset",
      name: "flightcn airport registry",
      description: `Built-in airport dataset with ${allAirports.length} airports used by the flightcn components.`,
      url: absoluteUrl("/airports"),
      isBasedOn: "https://ourairports.com/data/",
    },
  },
  buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Airports", path: "/airports" },
  ]),
];

export default function AirportsPage() {
  return (
    <>
      <JsonLd id="airports-jsonld" data={airportsJsonLd} />
      <AirportsMapView />
    </>
  );
}

import type { Metadata } from "next";
import { Orbit, Plane } from "lucide-react";

import { DocsHubPage } from "@/components/docs/docs-hub-page";
import { JsonLd } from "@/components/seo/json-ld";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Documentation",
  description:
    "Choose the flight or satellite documentation for flightcn and browse the API reference, props tables, and live examples for each mapcn component set.",
  path: "/docs",
  keywords: [
    "flightcn documentation",
    "flightcn flight docs",
    "flightcn satellite docs",
    "mapcn component docs",
  ],
});

const docsHubJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "flightcn documentation",
    description:
      "Documentation hub for the flight and satellite component sets in flightcn.",
    url: absoluteUrl("/docs"),
    hasPart: [
      {
        "@type": "TechArticle",
        headline: "Flight Documentation",
        url: absoluteUrl("/docs/flight"),
      },
      {
        "@type": "TechArticle",
        headline: "Satellite Documentation",
        url: absoluteUrl("/docs/satellite"),
      },
    ],
  },
  buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Documentation", path: "/docs" },
  ]),
];

const docsLinks = [
  {
    label: "Flight",
    title: "Flight Documentation",
    description:
      "Airport markers, direct routes, route networks, and multi-leg flight APIs.",
    href: "/docs/flight",
    ctaLabel: "Open flight docs",
    points: [
      "FlightAirport, FlightRoute, FlightRoutes, and FlightMultiRoute",
      "Props tables, usage examples, and preview sections",
      "Direct path into the flight install guide",
    ],
    icon: Plane,
  },
  {
    label: "Satellite",
    title: "Satellite Documentation",
    description:
      "Orbital paths, ground tracks, animated satellites, and globe overlay APIs.",
    href: "/docs/satellite",
    ctaLabel: "Open satellite docs",
    points: [
      "SatelliteOrbit and SatelliteOrbits for globe overlays",
      "Animated orbit previews with styling and SVG marker controls",
      "Direct path into the satellite install guide",
    ],
    icon: Orbit,
  },
] as const;

export default function DocsIndexPage() {
  return (
    <>
      <JsonLd id="docs-hub-jsonld" data={docsHubJsonLd} />
      <DocsHubPage
        headerTitle="Documentation"
        headerSubtitle="Choose the component family you want to integrate"
        eyebrow="Developer Docs"
        title="One place to enter the flightcn documentation system"
        description="Choose the component family you need first, then dive into the API reference, props tables, examples, and install steps that match that product line."
        cards={docsLinks}
      />
    </>
  );
}

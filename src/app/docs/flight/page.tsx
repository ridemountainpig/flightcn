import type { Metadata } from "next";

import { ComponentDocsPage } from "@/components/docs/component-docs-page";
import { componentDocs } from "@/components/docs/component-docs-config";
import { JsonLd } from "@/components/seo/json-ld";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Flight Documentation",
  description:
    "Read the API reference, props tables, and live examples for the flightcn flight route components (FlightAirport, FlightRoute, FlightRoutes, FlightMultiRoute) built for mapcn.",
  path: "/docs/flight",
  keywords: [
    "flightcn docs",
    "flight route component API",
    "FlightRoute props",
    "airport marker component",
    "mapcn examples",
  ],
});

const docsJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "flightcn flight documentation",
    description:
      "API reference and live component previews for the flightcn flight route component set.",
    url: absoluteUrl("/docs/flight"),
    mainEntity: componentDocs.map((component) => ({
      "@type": "TechArticle",
      headline: component.name,
      description: component.description,
      url: absoluteUrl(`/docs/flight#${component.id}`),
    })),
  },
  buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Documentation", path: "/docs" },
    { name: "Flight", path: "/docs/flight" },
  ]),
];

export default function DocsFlightPage() {
  return (
    <>
      <JsonLd id="docs-flight-jsonld" data={docsJsonLd} />
      <ComponentDocsPage product="flight" />
    </>
  );
}

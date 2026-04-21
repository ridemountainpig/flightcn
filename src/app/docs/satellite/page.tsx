import type { Metadata } from "next";

import { ComponentDocsPage } from "@/components/docs/component-docs-page";
import { satelliteComponentDocs } from "@/components/docs/component-docs-config";
import { JsonLd } from "@/components/seo/json-ld";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Satellite Documentation",
  description:
    "Read the API reference, props tables, and live playground for the flightcn SatelliteOrbit and SatelliteOrbits globe overlay components.",
  path: "/docs/satellite",
  keywords: [
    "flightcn satellite docs",
    "SatelliteOrbit component",
    "SatelliteOrbits props",
    "mapcn globe overlay",
    "MapLibre satellite orbit",
  ],
});

const satelliteDocsJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "flightcn satellite documentation",
    description:
      "API reference and live orbital playground for the flightcn satellite overlay components.",
    url: absoluteUrl("/docs/satellite"),
    mainEntity: satelliteComponentDocs.map((component) => ({
      "@type": "TechArticle",
      headline: component.name,
      description: component.description,
      url: absoluteUrl(`/docs/satellite#${component.id}`),
    })),
  },
  buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Documentation", path: "/docs" },
    { name: "Satellite", path: "/docs/satellite" },
  ]),
];

export default function DocsSatellitePage() {
  return (
    <>
      <JsonLd id="docs-satellite-jsonld" data={satelliteDocsJsonLd} />
      <ComponentDocsPage product="satellite" />
    </>
  );
}

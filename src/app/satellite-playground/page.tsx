import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { SatelliteDemoPage } from "@/components/satellite/satellite-demo-page";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Satellite Orbit Playground",
  description:
    "Compose flightcn satellite overlays live — tune inclination, ground tracks, labels, and styling on a globe, then copy the generated React code.",
  path: "/satellite-playground",
  keywords: [
    "satellite orbit playground",
    "maplibre satellite overlay",
    "react satellite ground track",
    "orbital visualization generator",
  ],
});

const satellitePlaygroundJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "flightcn satellite playground",
    description:
      "Interactive playground for composing flightcn satellite orbit overlays and copying the generated React code.",
    url: absoluteUrl("/satellite-playground"),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  },
  buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Satellite playground", path: "/satellite-playground" },
  ]),
];

export default function Page() {
  return (
    <>
      <JsonLd
        id="satellite-playground-jsonld"
        data={satellitePlaygroundJsonLd}
      />
      <SatelliteDemoPage />
    </>
  );
}

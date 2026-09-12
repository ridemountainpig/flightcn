import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { FlightPlaygroundPage } from "@/components/playground/flight-playground";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Flight Map Playground",
  description:
    "Compose flightcn visualizations live — stack routes, trackers, networks, and trails on one map, tune every prop, and copy the generated React code.",
  path: "/playground",
  keywords: [
    "flight route playground",
    "react flight map builder",
    "flight visualization generator",
    "maplibre flight route",
  ],
  ogImage: {
    url: "/playground/opengraph-image",
    alt: "flightcn playground — compose flight visualizations",
  },
});

const playgroundJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "flightcn playground",
    description:
      "Interactive playground for composing flightcn flight visualizations layer by layer and copying the generated React code.",
    url: absoluteUrl("/playground"),
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
    { name: "Playground", path: "/playground" },
  ]),
];

export default function Page() {
  return (
    <>
      <JsonLd id="playground-jsonld" data={playgroundJsonLd} />
      <FlightPlaygroundPage />
    </>
  );
}

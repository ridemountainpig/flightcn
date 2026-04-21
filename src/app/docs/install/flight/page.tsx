import type { Metadata } from "next";

import { InstallGuide } from "@/components/docs/install-guide";
import { JsonLd } from "@/components/seo/json-ld";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  siteConfig,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Flight Install Guide",
  description:
    "Follow the step-by-step guide to install the flight route components from the shadcn registry and render your first route with mapcn.",
  path: "/docs/install/flight",
  keywords: [
    "install flightcn flight",
    "shadcn registry guide",
    "mapcn flight setup",
    "FlightRoute installation",
  ],
});

const installJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "How to install the flightcn flight components",
    description:
      "Step-by-step installation guide for adding the flight route components from flightcn to a mapcn project.",
    url: absoluteUrl("/docs/install/flight"),
    author: {
      "@type": "Person",
      name: siteConfig.creator.name,
      url: siteConfig.creator.url,
    },
    about: {
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  },
  buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Install Guide", path: "/docs/install" },
    { name: "Flight", path: "/docs/install/flight" },
  ]),
];

export default function InstallFlightPage() {
  return (
    <>
      <JsonLd id="install-flight-jsonld" data={installJsonLd} />
      <InstallGuide product="flight" />
    </>
  );
}

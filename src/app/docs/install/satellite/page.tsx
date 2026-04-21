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
  title: "Satellite Install Guide",
  description:
    "Follow the step-by-step guide to install the SatelliteOrbit component from the shadcn registry and render your first orbital overlay with mapcn.",
  path: "/docs/install/satellite",
  keywords: [
    "install flightcn satellite",
    "satellite orbit shadcn registry",
    "mapcn satellite setup",
    "SatelliteOrbit installation",
  ],
});

const installJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "How to install the flightcn satellite component",
    description:
      "Step-by-step installation guide for adding the SatelliteOrbit component from flightcn to a mapcn project.",
    url: absoluteUrl("/docs/install/satellite"),
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
    { name: "Satellite", path: "/docs/install/satellite" },
  ]),
];

export default function InstallSatellitePage() {
  return (
    <>
      <JsonLd id="install-satellite-jsonld" data={installJsonLd} />
      <InstallGuide product="satellite" />
    </>
  );
}

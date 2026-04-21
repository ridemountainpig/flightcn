import type { Metadata } from "next";
import { Orbit, PlaneTakeoff } from "lucide-react";

import { DocsHubPage } from "@/components/docs/docs-hub-page";
import { JsonLd } from "@/components/seo/json-ld";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Install Guides",
  description:
    "Choose the flight or satellite install guide for flightcn and follow the setup steps for each mapcn component package.",
  path: "/docs/install",
  keywords: [
    "flightcn install guide",
    "flightcn flight install",
    "flightcn satellite install",
    "mapcn component install",
  ],
});

const installHubJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "flightcn install guides",
    description:
      "Install guide hub for the flight and satellite component sets in flightcn.",
    url: absoluteUrl("/docs/install"),
    hasPart: [
      {
        "@type": "TechArticle",
        headline: "Flight Install Guide",
        url: absoluteUrl("/docs/install/flight"),
      },
      {
        "@type": "TechArticle",
        headline: "Satellite Install Guide",
        url: absoluteUrl("/docs/install/satellite"),
      },
    ],
  },
  buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Install Guide", path: "/docs/install" },
  ]),
];

const installLinks = [
  {
    label: "Flight",
    title: "Flight Install Guide",
    description:
      "Install the flight route components and render airport markers, direct routes, and multi-leg paths.",
    href: "/docs/install/flight",
    ctaLabel: "Open flight install guide",
    points: [
      "shadcn add command for the flight component package",
      "Import snippet for map and route components",
      "Starter render example for route and airport flows",
    ],
    icon: PlaneTakeoff,
  },
  {
    label: "Satellite",
    title: "Satellite Install Guide",
    description:
      "Install the satellite overlay component and render animated orbits on a globe projection.",
    href: "/docs/install/satellite",
    ctaLabel: "Open satellite install guide",
    points: [
      "shadcn add command for the satellite component package",
      "Import snippet for globe map and orbit overlays",
      "Starter render example for animated orbital scenes",
    ],
    icon: Orbit,
  },
] as const;

export default function InstallIndexPage() {
  return (
    <>
      <JsonLd id="install-hub-jsonld" data={installHubJsonLd} />
      <DocsHubPage
        headerTitle="Install Guides"
        headerSubtitle="Choose the setup flow that matches the component family"
        eyebrow="Setup"
        title="Start with the install flow that matches your component family"
        description="Each guide walks through the package install command, the import shape, and a minimal starter implementation so you can get to a working map scene quickly."
        cards={installLinks}
      />
    </>
  );
}

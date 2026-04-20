import type { Metadata } from "next";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { HomeExperience } from "@/components/home/home-experience";
import { JsonLd } from "@/components/seo/json-ld";
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  siteConfig,
  websiteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Flight Route & Satellite Orbit Components for mapcn",
  description:
    "Build MapLibre flight route maps and orbital overlays with airport markers, animated paths, an IATA airport dataset, and satellite orbits using the flightcn shadcn registry package.",
  path: "/",
  keywords: [
    "MapLibre flight routes",
    "airport markers",
    "React flight map",
    "MapLibre satellite orbit",
    "mapcn satellite overlay",
  ],
});

const homeJsonLd = [
  websiteJsonLd,
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: siteConfig.description,
    url: siteConfig.url,
    creator: {
      "@type": "Person",
      name: siteConfig.creator.name,
      url: siteConfig.creator.url,
    },
    codeRepository: siteConfig.githubUrl,
    programmingLanguage: "TypeScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Flight route components (airport markers, great-circle routes, multi-leg journeys)",
      "Satellite orbit overlays (orbital paths, ground tracks, animated satellites)",
    ],
  },
  buildBreadcrumbJsonLd([{ name: "Home", path: "/" }]),
];

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-100 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.1)_1px,transparent_0)] bg-size-[24px_24px] text-slate-950">
      <JsonLd id="home-jsonld" data={homeJsonLd} />
      <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8">
        <AppHeader
          title="flightcn"
          subtitle="Flight route and satellite overlay visualizations for mapcn"
        />
        <HomeExperience />
        <AppFooter />
      </div>
    </main>
  );
}

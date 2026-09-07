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
  title: "Beautiful Flight Visualizations for React",
  description:
    "Build MapLibre flight tracking, route networks, geodesic range maps, aircraft trails, traffic flows, and satellite overlays with the flightcn shadcn registry package.",
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
    image: `${siteConfig.url}${siteConfig.ogImage}`,
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
      "Flight tracking, weighted networks, geodesic ranges, recorded trails, and animated traffic flows",
      "Satellite orbit overlays (orbital paths, ground tracks, animated satellites)",
    ],
  },
  buildBreadcrumbJsonLd([{ name: "Home", path: "/" }]),
];

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-[#fafaf8] text-slate-950"
    >
      <JsonLd id="home-jsonld" data={homeJsonLd} />
      <div className="site-shell">
        <AppHeader
          title="flightcn"
          subtitle="Flight visualization components for React"
        />
        <HomeExperience />
        <AppFooter />
      </div>
    </main>
  );
}

import type { Metadata } from "next";

import { AirportSearchSection } from "@/components/home/airport-search-section";
import { AppFooter } from "@/components/app-footer";
import { HeroSection } from "@/components/home/hero-section";
import { ShowcaseSection } from "@/components/home/showcase-section";
import { AppHeader } from "@/components/app-header";
import { JsonLd } from "@/components/seo/json-ld";
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  siteConfig,
  websiteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Flight Route Components for mapcn",
  description:
    "Build MapLibre flight route maps with airport markers, animated paths, and an IATA airport dataset using the flightcn shadcn registry package.",
  path: "/",
  keywords: ["MapLibre flight routes", "airport markers", "React flight map"],
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
          subtitle="Flight route visualizations for mapcn"
        />
        <HeroSection />
        <ShowcaseSection />
        <AirportSearchSection />
        <AppFooter />
      </div>
    </main>
  );
}

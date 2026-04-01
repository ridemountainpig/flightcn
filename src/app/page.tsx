import { AirportSearchSection } from "@/components/home/airport-search-section";
import { AppFooter } from "@/components/app-footer";
import { HeroSection } from "@/components/home/hero-section";
import { ShowcaseSection } from "@/components/home/showcase-section";
import { AppHeader } from "@/components/app-header";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-100 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.1)_1px,transparent_0)] bg-size-[24px_24px] text-slate-950">
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

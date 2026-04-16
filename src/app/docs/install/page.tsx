import type { Metadata } from "next";
import Link from "next/link";

import { InstallCommandCopy } from "@/components/home/install-command-copy";
import { ShikiCodeBlock } from "@/components/ui/shiki-code-block";
import { installCommand } from "@/components/home/home-config";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { JsonLd } from "@/components/seo/json-ld";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  siteConfig,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Install Guide",
  description:
    "Follow the step-by-step guide to install flightcn from the shadcn registry and render your first route with mapcn.",
  path: "/docs/install",
  keywords: ["install flightcn", "shadcn registry guide", "mapcn setup"],
});

const installJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "How to install flightcn from the shadcn registry",
    description:
      "Step-by-step installation guide for adding flightcn components to a mapcn project.",
    url: absoluteUrl("/docs/install"),
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
    { name: "Documentation", path: "/docs" },
    { name: "Install Guide", path: "/docs/install" },
  ]),
];

export default function InstallPage() {
  return (
    <main className="min-h-screen bg-stone-100 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.1)_1px,transparent_0)] bg-size-[24px_24px] text-slate-950">
      <JsonLd id="install-jsonld" data={installJsonLd} />
      <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8">
        <AppHeader
          title="Install Guide"
          subtitle="Complete setup guide for mapcn + flightcn"
        />

        <section className="mt-6 rounded-[1.8rem] border border-black/10 bg-white/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Step 1
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Install from registry
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Use `shadcn add` to pull the flight component into your current
            project.
          </p>
          <InstallCommandCopy
            command={installCommand}
            className="mt-6 max-w-3xl"
          />
        </section>

        <section className="mt-4 rounded-[1.8rem] border border-black/10 bg-white/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Step 2
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
            Import components
          </h2>
          <div className="mt-4 max-w-full overflow-x-auto rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
            <ShikiCodeBlock
              code={`import { Map } from "@/components/ui/map";
import { FlightRoute } from "@/components/ui/flight";`}
            />
          </div>
        </section>

        <section className="mt-4 rounded-[1.8rem] border border-black/10 bg-white/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Step 3
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
            Render your first route
          </h2>
          <div className="mt-4 max-w-full overflow-x-auto rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
            <ShikiCodeBlock
              code={`export default function Demo() {
  return (
    <div className="h-screen w-screen">
      <Map className="h-full w-full" center={[121.5, 25]} zoom={3}>
        <FlightRoute from="TPE" to="LAX" showAirports showLabel />
      </Map>
    </div>
  );
}`}
            />
          </div>

          <div className="mt-5 text-sm text-slate-600">
            Full component API can be found on the
            <Link href="/docs" className="ml-1 font-semibold text-slate-900">
              docs page
            </Link>
            .
          </div>
        </section>
        <AppFooter />
      </div>
    </main>
  );
}

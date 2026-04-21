import Link from "next/link";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import {
  ProductSwitcherLinks,
  type ProductKey,
} from "@/components/product-switcher";

import { ComponentDocSection } from "./component-doc-section";
import {
  componentDocs,
  satelliteComponentDocs,
  type ComponentDoc,
} from "./component-docs-config";

type DocsCopy = {
  eyebrow: string;
  title: string;
  description: string;
  sidebarLabel: string;
  installHref: string;
  installLabel: string;
  crossLinkHref: string;
  crossLinkLabel: string;
  crossLinkPrefix: string;
  headerTitle: string;
  headerSubtitle: string;
};

const DOCS_COPY: Record<ProductKey, DocsCopy> = {
  flight: {
    headerTitle: "Flight Documentation",
    headerSubtitle: "API reference and live component previews",
    eyebrow: "Developer Docs",
    title: "flightcn API reference and component examples",
    description:
      "Browse the airport marker, flight route, network, and multi-leg APIs, then preview each component with a live map example before adding it to your mapcn project.",
    sidebarLabel: "Components",
    installHref: "/docs/install/flight",
    installLabel: "flight install guide",
    crossLinkHref: "/docs/satellite",
    crossLinkLabel: "satellite docs",
    crossLinkPrefix: "Looking for orbital overlays instead? See the",
  },
  satellite: {
    headerTitle: "Satellite Documentation",
    headerSubtitle: "API reference and live orbital playground",
    eyebrow: "Developer Docs",
    title: "Satellite orbit overlays for mapcn",
    description:
      "Explore the dedicated `SatelliteOrbit` and `SatelliteOrbits` APIs with a full globe playground, custom SVG icon support, and orbital styling controls.",
    sidebarLabel: "Satellite",
    installHref: "/docs/install/satellite",
    installLabel: "satellite install guide",
    crossLinkHref: "/docs/flight",
    crossLinkLabel: "flight docs",
    crossLinkPrefix: "Need the flight route APIs too? See the",
  },
};

const DOCS_HREFS: Record<ProductKey, string> = {
  flight: "/docs/flight",
  satellite: "/docs/satellite",
};

export function ComponentDocsPage({ product }: { product: ProductKey }) {
  const components: readonly ComponentDoc[] =
    product === "satellite" ? satelliteComponentDocs : componentDocs;
  const copy = DOCS_COPY[product];

  return (
    <main className="min-h-screen bg-stone-100 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.1)_1px,transparent_0)] bg-size-[24px_24px] text-slate-950">
      <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8">
        <AppHeader title={copy.headerTitle} subtitle={copy.headerSubtitle} />

        <section className="mt-6 rounded-[1.8rem] border border-black/10 bg-white/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {copy.description}
          </p>
          <div className="mt-5">
            <ProductSwitcherLinks value={product} hrefs={DOCS_HREFS} />
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="h-fit min-w-0 rounded-[1.5rem] border border-black/10 bg-white/85 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:sticky lg:top-6">
            <p className="px-2 pb-2 text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              {copy.sidebarLabel}
            </p>
            <nav className="space-y-2">
              {components.map((component) => (
                <a
                  key={component.id}
                  href={`#${component.id}`}
                  className="flex min-h-14 items-center rounded-xl border border-black/8 bg-slate-50/90 px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  {component.name}
                </a>
              ))}
            </nav>
            <div className="mt-4 border-t border-black/8 px-2 pt-4 text-xs text-slate-500">
              Need setup help? See the
              <Link
                href={copy.installHref}
                className="ml-1 font-semibold text-slate-800 transition-colors hover:text-slate-600"
              >
                {copy.installLabel}
              </Link>
              . {copy.crossLinkPrefix}
              <Link
                href={copy.crossLinkHref}
                className="ml-1 font-semibold text-slate-800 transition-colors hover:text-slate-600"
              >
                {copy.crossLinkLabel}
              </Link>
              .
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            {components.map((component) => (
              <ComponentDocSection key={component.id} component={component} />
            ))}
          </div>
        </div>
        <AppFooter />
      </div>
    </main>
  );
}

import Link from "next/link";
import { DocsNavigation } from "./docs-navigation";

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
    title: "Flight components.",
    description:
      "Browse route, tracking, network, range, trail, and traffic-flow APIs, then preview every component on a live map before adding it to your project.",
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
    title: "Satellite components.",
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
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-[#fafaf8] text-slate-950"
    >
      <div className="site-shell">
        <AppHeader title={copy.headerTitle} subtitle={copy.headerSubtitle} />

        <section
          id="page-content"
          tabIndex={-1}
          className="mt-10 border-b border-slate-200 pb-8 sm:pb-10"
        >
          <p className="section-kicker">{copy.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-medium tracking-[-0.05em] text-slate-950 sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {copy.description}
          </p>
          <div className="mt-5">
            <ProductSwitcherLinks value={product} hrefs={DOCS_HREFS} />
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="h-fit min-w-0 border-b border-slate-200 pb-4 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:border-0 lg:pr-3">
            <p className="section-kicker px-2 pb-2">{copy.sidebarLabel}</p>
            <DocsNavigation
              items={components.map(({ id, name }) => ({ id, name }))}
            />
            <div className="mt-4 border-t border-slate-200 px-2 pt-4 text-xs text-slate-500">
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

          <div className="min-w-0 space-y-8">
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

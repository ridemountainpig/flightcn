import Link from "next/link";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { InstallSnippet } from "./install-snippet";
import {
  installCommandByProduct,
  installSteps,
} from "@/components/home/home-config";
import {
  ProductSwitcherLinks,
  type ProductKey,
} from "@/components/product-switcher";
import { ShikiCodeBlock } from "@/components/ui/shiki-code-block";

const INSTALL_HREFS: Record<ProductKey, string> = {
  flight: "/docs/install/flight",
  satellite: "/docs/install/satellite",
};

export function InstallGuide({ product }: { product: ProductKey }) {
  const copy = installSteps[product];
  const installCommand = installCommandByProduct[product];

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-[#fafaf8] text-slate-950"
    >
      <div className="site-shell">
        <AppHeader title={copy.heroTitle} subtitle={copy.heroSubtitle} />

        <section
          id="page-content"
          tabIndex={-1}
          className="mx-auto mt-10 max-w-4xl border-b border-slate-200 pb-8 sm:pb-10"
        >
          <div className="mb-4">
            <ProductSwitcherLinks value={product} hrefs={INSTALL_HREFS} />
          </div>
          <p className="section-kicker">Step 1</p>
          <h1 className="mt-4 text-4xl font-medium tracking-[-0.05em] text-slate-950 sm:text-5xl">
            {copy.step1Title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {copy.step1Description}
          </p>
          <InstallSnippet command={installCommand} />
        </section>

        <section className="mx-auto mt-6 max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
          <p className="section-kicker">Step 2</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
            Import components
          </h2>
          <div className="scrollbar-none mt-4 max-w-full overflow-x-auto rounded-lg border border-slate-200 bg-[#fafaf8] px-4 py-3 text-xs leading-6 text-slate-800">
            <ShikiCodeBlock theme="github-light" code={copy.step2ImportCode} />
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
          <p className="section-kicker">Step 3</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
            {copy.step3Title}
          </h2>
          <div className="scrollbar-none mt-4 max-w-full overflow-x-auto rounded-lg border border-slate-200 bg-[#fafaf8] px-4 py-3 text-xs leading-6 text-slate-800">
            <ShikiCodeBlock theme="github-light" code={copy.step3RenderCode} />
          </div>

          <div className="mt-5 text-sm text-slate-600">
            Full component API can be found on the
            <Link
              href={copy.docsHref}
              className="ml-1 font-semibold text-orange-700 hover:text-orange-800"
            >
              {copy.docsLabel}
            </Link>
            . {copy.crossLinkPrefix}
            <Link
              href={copy.crossLinkHref}
              className="ml-1 font-semibold text-orange-700 hover:text-orange-800"
            >
              {copy.crossLinkLabel}
            </Link>
            .
          </div>
        </section>
        <AppFooter />
      </div>
    </main>
  );
}

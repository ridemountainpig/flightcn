import Link from "next/link";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { InstallCommandCopy } from "@/components/home/install-command-copy";
import { SatelliteCommandCopy } from "@/components/home/satellite-command-copy";
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
  const CommandCopy =
    product === "satellite" ? SatelliteCommandCopy : InstallCommandCopy;

  return (
    <main className="min-h-screen bg-stone-100 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.1)_1px,transparent_0)] bg-size-[24px_24px] text-slate-950">
      <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8">
        <AppHeader title={copy.heroTitle} subtitle={copy.heroSubtitle} />

        <section className="mt-6 rounded-[1.8rem] border border-black/10 bg-white/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
          <div className="mb-4">
            <ProductSwitcherLinks value={product} hrefs={INSTALL_HREFS} />
          </div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Step 1
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {copy.step1Title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {copy.step1Description}
          </p>
          <CommandCopy command={installCommand} className="mt-6 max-w-3xl" />
        </section>

        <section className="mt-4 rounded-[1.8rem] border border-black/10 bg-white/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Step 2
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
            Import components
          </h2>
          <div className="mt-4 max-w-full overflow-x-auto rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
            <ShikiCodeBlock code={copy.step2ImportCode} />
          </div>
        </section>

        <section className="mt-4 rounded-[1.8rem] border border-black/10 bg-white/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Step 3
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
            {copy.step3Title}
          </h2>
          <div className="mt-4 max-w-full overflow-x-auto rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
            <ShikiCodeBlock code={copy.step3RenderCode} />
          </div>

          <div className="mt-5 text-sm text-slate-600">
            Full component API can be found on the
            <Link
              href={copy.docsHref}
              className="ml-1 font-semibold text-slate-900"
            >
              {copy.docsLabel}
            </Link>
            . {copy.crossLinkPrefix}
            <Link
              href={copy.crossLinkHref}
              className="ml-1 font-semibold text-slate-900"
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

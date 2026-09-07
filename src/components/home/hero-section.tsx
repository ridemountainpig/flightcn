"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { InstallCommandCopy } from "./install-command-copy";
import { SatelliteCommandCopy } from "./satellite-command-copy";
import { heroCopy, installCommandByProduct } from "./home-config";
import {
  ProductSwitcher,
  type ProductKey,
} from "@/components/product-switcher";

const HeroRouteDemo = dynamic(
  () => import("./hero-route-demo").then((m) => m.HeroRouteDemo),
  {
    ssr: false,
    loading: () => (
      <div className="h-[510px] animate-pulse rounded-2xl bg-slate-100" />
    ),
  },
);

const HeroSatelliteDemo = dynamic(
  () => import("./hero-satellite-demo").then((m) => m.HeroSatelliteDemo),
  {
    ssr: false,
    loading: () => (
      <div className="h-[510px] animate-pulse rounded-2xl bg-slate-100" />
    ),
  },
);

export function HeroSection({
  product,
  onProductChange,
}: {
  product: ProductKey;
  onProductChange: (next: ProductKey) => void;
}) {
  const copy = heroCopy[product];
  const CommandCopy =
    product === "flight" ? InstallCommandCopy : SatelliteCommandCopy;
  return (
    <section
      id="page-content"
      tabIndex={-1}
      className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16 lg:py-20"
    >
      <div className="hero-entry min-w-0">
        <p className="section-kicker mb-7">Open source · Built for React</p>
        <ProductSwitcher value={product} onChange={onProductChange} />
        <h1 className="mt-7 max-w-xl text-[44px] leading-[1.02] font-medium tracking-[-0.06em] text-slate-950 sm:text-[60px] xl:text-[76px]">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-slate-500">
          {product === "flight"
            ? "Bring your flight data to life. Routes, tracking and networks, starting with two airport codes."
            : copy.subtitle}
        </p>
        <div className="mt-7 flex items-center gap-6 text-sm font-medium">
          <Link
            href={
              product === "flight"
                ? "/docs/install/flight"
                : "/docs/install/satellite"
            }
            className="pressable inline-flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-3.5 text-white hover:bg-slate-800"
          >
            Start building <ArrowRight size={16} />
          </Link>
          <a
            href="#showcase"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-orange-700"
          >
            Examples <ArrowUpRight size={15} className="link-arrow" />
          </a>
        </div>
        <CommandCopy
          command={installCommandByProduct[product]}
          className="mt-7 w-full max-w-lg"
        />
        <p className="mt-3 text-xs text-slate-500">
          Built with MapLibre & mapcn. Copy the components. Make them yours.
        </p>
      </div>
      <div className="hero-entry min-w-0">
        <div key={product} className="demo-swap">
          {product === "flight" ? <HeroRouteDemo /> : <HeroSatelliteDemo />}
        </div>
      </div>
    </section>
  );
}

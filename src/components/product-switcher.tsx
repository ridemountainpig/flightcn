"use client";

import Link from "next/link";
import { Orbit, Plane } from "lucide-react";

import { cn } from "@/lib/utils";

export type ProductKey = "flight" | "satellite";

export const PRODUCT_KEYS: readonly ProductKey[] = ["flight", "satellite"];

type ProductMeta = {
  key: ProductKey;
  label: string;
  description: string;
};

export const PRODUCT_META: Record<ProductKey, ProductMeta> = {
  flight: {
    key: "flight",
    label: "Flight",
    description: "Airports, routes, networks, and multi-leg journeys.",
  },
  satellite: {
    key: "satellite",
    label: "Satellite",
    description: "Orbital paths, ground tracks, and animated satellites.",
  },
};

function ProductIcon({ product }: { product: ProductKey }) {
  const Icon = product === "flight" ? Plane : Orbit;
  return <Icon className="size-4" />;
}

type BaseProps = {
  size?: "sm" | "md";
  className?: string;
};

const baseContainerClass =
  "inline-flex rounded-full border border-black/10 bg-white/85 p-1 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm";

function itemClass({
  size,
  isActive,
}: {
  size: "sm" | "md";
  isActive: boolean;
}) {
  return cn(
    "inline-flex items-center gap-2 rounded-full font-medium transition-colors",
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm sm:px-5",
    isActive
      ? "bg-slate-950 text-white shadow-sm"
      : "text-slate-600 hover:text-slate-900",
  );
}

export function ProductSwitcher({
  value,
  onChange,
  size = "md",
  className,
}: BaseProps & {
  value: ProductKey;
  onChange: (next: ProductKey) => void;
}) {
  return (
    <div
      className={cn(baseContainerClass, className)}
      role="tablist"
      aria-label="Choose product"
    >
      {PRODUCT_KEYS.map((key) => {
        const isActive = value === key;
        const meta = PRODUCT_META[key];
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={itemClass({ size, isActive })}
          >
            <ProductIcon product={key} />
            <span>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ProductSwitcherLinks({
  value,
  hrefs,
  size = "md",
  className,
}: BaseProps & {
  value: ProductKey;
  hrefs: Record<ProductKey, string>;
}) {
  return (
    <div
      className={cn(baseContainerClass, className)}
      role="tablist"
      aria-label="Choose product"
    >
      {PRODUCT_KEYS.map((key) => {
        const isActive = value === key;
        const meta = PRODUCT_META[key];
        return (
          <Link
            key={key}
            href={hrefs[key]}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            scroll={false}
            prefetch
            className={itemClass({ size, isActive })}
          >
            <ProductIcon product={key} />
            <span>{meta.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

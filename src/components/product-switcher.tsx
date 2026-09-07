"use client";

import Link from "next/link";
import { Orbit, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductKey = "flight" | "satellite";
export const PRODUCT_KEYS: readonly ProductKey[] = ["flight", "satellite"];
export const PRODUCT_META = {
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
} as const;

function ProductIcon({ product }: { product: ProductKey }) {
  const Icon = product === "flight" ? Plane : Orbit;
  return <Icon className="size-4" aria-hidden="true" />;
}

type BaseProps = { size?: "sm" | "md"; className?: string };
const container =
  "product-switcher relative inline-grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1";
const item =
  "relative z-10 inline-flex items-center justify-center gap-2 rounded-lg font-medium text-slate-500 data-[active=true]:text-slate-950";
const sizes = { sm: "px-3 py-2 text-xs", md: "px-5 py-2.5 text-sm" };

function Indicator({ value }: { value: ProductKey }) {
  return (
    <span
      aria-hidden="true"
      className="product-indicator absolute inset-y-1 left-1 w-[calc(50%-6px)] rounded-lg bg-white shadow-[0_1px_4px_#20252214]"
      style={{
        transform:
          value === "flight" ? "translateX(0)" : "translateX(calc(100% + 4px))",
      }}
    />
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
      className={cn(container, className)}
      role="group"
      aria-label="Choose product"
    >
      <Indicator value={value} />
      {PRODUCT_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          data-active={value === key}
          onClick={() => onChange(key)}
          className={cn(item, sizes[size])}
        >
          <ProductIcon product={key} />
          <span>{PRODUCT_META[key].label}</span>
        </button>
      ))}
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
    <nav
      className={cn(container, className)}
      aria-label="Product documentation"
    >
      <Indicator value={value} />
      {PRODUCT_KEYS.map((key) => (
        <Link
          key={key}
          href={hrefs[key]}
          aria-current={value === key ? "page" : undefined}
          data-active={value === key}
          className={cn(item, sizes[size])}
        >
          <ProductIcon product={key} />
          <span>{PRODUCT_META[key].label}</span>
        </Link>
      ))}
    </nav>
  );
}

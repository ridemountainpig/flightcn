"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type SiteNavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export const defaultSiteNavItems: SiteNavItem[] = [
  { label: "Home", href: "/" },
  { label: "Documentation", href: "/docs" },
  { label: "Install Guide", href: "/docs/install" },
  { label: "Airports", href: "/airports" },
];

export function SiteNavMenu({
  items = defaultSiteNavItems,
  buttonClassName,
  panelClassName,
  itemClassName,
  menuLabel = "Open navigation menu",
  iconClassName,
}: {
  items?: SiteNavItem[];
  buttonClassName?: string;
  panelClassName?: string;
  itemClassName?: string;
  menuLabel?: string;
  iconClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={menuLabel}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-black/10 transition-colors sm:size-11",
          buttonClassName,
        )}
      >
        <Menu className={cn("size-4", iconClassName)} />
      </button>

      {open ? (
        <div
          className={cn(
            "absolute top-full right-0 mt-2 w-48 rounded-xl border border-black/10 bg-white/95 p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur",
            panelClassName,
          )}
        >
          {items.map((item) => {
            const commonClassName = cn(
              "block rounded-lg px-3 py-2 text-sm transition-colors",
              itemClassName,
            );

            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className={commonClassName}
                >
                  {item.label}
                </a>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={commonClassName}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

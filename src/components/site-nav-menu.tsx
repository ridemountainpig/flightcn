"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/utils";

export type SiteNavItem = { label: string; href: string; external?: boolean };
export const defaultSiteNavItems: SiteNavItem[] = [
  { label: "Home", href: "/" },
  { label: "Documentation", href: "/docs" },
  { label: "Install Guide", href: "/docs/install" },
  { label: "Airports", href: "/airports" },
  { label: "Satellite playground", href: "/satellite-demo" },
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
  const pathname = usePathname();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={menuLabel}
          className={cn(
            "pressable inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white",
            buttonClassName,
          )}
        >
          <Menu className={cn("size-4", iconClassName)} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className={cn(
            "nav-popover z-[1300] w-60 rounded-2xl border border-slate-200 bg-white p-2 text-slate-950 shadow-xl shadow-slate-900/10",
            panelClassName,
          )}
        >
          {items.map((item) => (
            <DropdownMenu.Item key={item.href} asChild>
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={cn("nav-menu-item", itemClassName)}
                >
                  {item.label} ↗
                </a>
              ) : (
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={cn("nav-menu-item", itemClassName)}
                >
                  {item.label}
                </Link>
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

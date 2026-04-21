"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { SiteNavMenu, defaultSiteNavItems } from "@/components/site-nav-menu";

const appHeaderNavItems = [
  ...defaultSiteNavItems,
  {
    label: "GitHub",
    href: "https://github.com/ridemountainpig/flightcn",
    external: true,
  },
];

export function AppHeader({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "border-border bg-card/90 text-card-foreground relative z-[1200] rounded-3xl border px-4 py-4 shadow-sm backdrop-blur-xl sm:px-6",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label="Go to homepage"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black text-white shadow-lg sm:size-11"
          >
            <Image
              src="/favicon.ico"
              alt="flightcn icon"
              width={24}
              height={24}
              className="h-5 w-5 shrink-0 object-contain sm:h-7 sm:w-7"
            />
          </Link>
          <div className="min-w-0">
            <p className="text-sm font-semibold sm:text-base">{title}</p>
            <p className="text-muted-foreground text-[11px] leading-4 sm:text-xs sm:leading-5">
              {subtitle}
            </p>
          </div>
        </div>

        <SiteNavMenu
          items={appHeaderNavItems}
          buttonClassName="border-border text-foreground hover:bg-accent"
          itemClassName="text-foreground hover:bg-accent"
        />
      </div>
    </header>
  );
}

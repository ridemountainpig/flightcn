"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Github } from "lucide-react";

import { cn } from "@/lib/utils";
import { SiteNavMenu, defaultSiteNavItems } from "@/components/site-nav-menu";

const appHeaderNavItems = [
  ...defaultSiteNavItems,
  { label: "Examples", href: "/#showcase" },
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
  const pathname = usePathname();
  return (
    <header
      className={cn(
        "relative z-[1200] border-b border-slate-200 bg-transparent py-5 text-slate-950",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label="Go to homepage"
            className="pressable group flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white sm:size-9"
          >
            <Image
              src="/flightcn-icon.svg"
              alt="flightcn icon"
              width={24}
              height={24}
              className="app-logo-plane h-5 w-5 shrink-0 object-contain sm:h-7 sm:w-7"
            />
          </Link>
          <div className="min-w-0">
            <p className="text-xl font-semibold tracking-[-0.055em]">
              flightcn
            </p>
            <p className="hidden text-[10px] leading-4 text-slate-500 sm:block">
              {title === "flightcn" ? subtitle : title}
            </p>
          </div>
        </div>

        <nav
          aria-label="Main navigation"
          className="hidden shrink-0 items-center gap-1 text-sm text-slate-600 md:flex"
        >
          <Link href="/#showcase" className="app-nav-link">
            Examples
          </Link>
          <Link
            href="/docs"
            aria-current={
              pathname.startsWith("/docs") &&
              !pathname.startsWith("/docs/install")
                ? "page"
                : undefined
            }
            className="app-nav-link"
          >
            Docs
          </Link>
          <Link
            href="/docs/install"
            aria-current={
              pathname.startsWith("/docs/install") ? "page" : undefined
            }
            className="app-nav-link"
          >
            Install
          </Link>
          <Link
            href="/airports"
            aria-current={pathname === "/airports" ? "page" : undefined}
            className="app-nav-link"
          >
            Airports
          </Link>
          <a
            href="https://github.com/ridemountainpig/flightcn"
            className="pressable ml-3 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-white hover:bg-slate-800"
          >
            <Github size={15} aria-hidden="true" />
            GitHub
            <ArrowUpRight
              size={14}
              className="link-arrow -ml-0.5 text-slate-400"
            />
          </a>
        </nav>
        <div className="md:hidden">
          <SiteNavMenu items={appHeaderNavItems} />
        </div>
      </div>
    </header>
  );
}

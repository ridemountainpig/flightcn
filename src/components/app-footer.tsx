import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PLAYGROUND_HREFS } from "@/components/product-links";
import { cn } from "@/lib/utils";

const footerNav: {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}[] = [
  {
    heading: "Explore",
    links: [
      { label: "Flight playground", href: PLAYGROUND_HREFS.flight },
      { label: "Satellite playground", href: PLAYGROUND_HREFS.satellite },
      { label: "Blocks", href: "/blocks" },
      { label: "Airports", href: "/airports" },
      { label: "Examples", href: "/#showcase" },
    ],
  },
  {
    heading: "Docs",
    links: [
      { label: "Overview", href: "/docs" },
      { label: "Flight", href: "/docs/flight" },
      { label: "Satellite", href: "/docs/satellite" },
      { label: "Install", href: "/docs/install" },
    ],
  },
  {
    heading: "Resources",
    links: [
      {
        label: "GitHub",
        href: "https://github.com/ridemountainpig/flightcn",
        external: true,
      },
      { label: "Mapcn", href: "https://www.mapcn.dev/", external: true },
      {
        label: "MIT License",
        href: "https://github.com/ridemountainpig/flightcn/blob/main/LICENSE",
        external: true,
      },
    ],
  },
];

export function AppFooter({ className }: { className?: string } = {}) {
  return (
    <footer className={cn("mt-14 sm:mt-16", className)}>
      <div className="footer-ruler" aria-hidden="true" />

      <div className="flex flex-col gap-10 py-10 sm:py-12 lg:flex-row lg:justify-between lg:gap-16">
        <div className="max-w-xs">
          <Link
            href="/"
            aria-label="Go to homepage"
            className="group inline-flex items-center gap-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-950">
              <Image
                src="/flightcn-icon.svg"
                alt=""
                width={24}
                height={24}
                className="app-logo-plane h-6 w-6 object-contain"
              />
            </span>
            <span className="text-lg font-semibold tracking-[-0.055em] text-slate-950">
              flightcn
            </span>
          </Link>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Flight visualization components for React and MapLibre. Open source,
            copy-paste ready through the shadcn registry.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:gap-x-20"
        >
          {footerNav.map((group) => (
            <div key={group.heading}>
              <p className="footer-heading">{group.heading}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {group.links.map((link) =>
                  link.external ? (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-slate-600 transition-colors hover:text-slate-950"
                      >
                        {link.label}
                        <ArrowUpRight
                          size={12}
                          aria-hidden="true"
                          className="link-arrow text-slate-400"
                        />
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-slate-600 transition-colors hover:text-slate-950"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-slate-200 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-[13px] text-slate-500">
          © flightcn · Built by{" "}
          <a
            href="https://github.com/ridemountainpig"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-900 transition-colors hover:text-slate-600"
          >
            ridemountainpig
          </a>
        </p>
        <p className="footer-coords" aria-hidden="true">
          25.08° N · 121.23° E — TPE
        </p>
      </div>
    </footer>
  );
}

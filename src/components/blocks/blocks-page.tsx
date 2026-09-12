"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { BlockCard } from "@/components/blocks/block-card";
import { blocksConfig } from "@/components/blocks/blocks-config";
import { PLAYGROUND_HREFS } from "@/components/product-switcher";

/** Chip groups follow the block categories so the satellite block isn't buried. */
const BLOCK_CATEGORIES = ["Flight", "Satellite"] as const;

const PLAYGROUND_LINKS = [
  { href: PLAYGROUND_HREFS.flight, label: "Flight playground" },
  { href: PLAYGROUND_HREFS.satellite, label: "Satellite playground" },
];

export function BlocksPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-[#fafaf8] text-slate-950"
    >
      <div className="site-shell">
        <AppHeader title="Blocks" subtitle="Prebuilt map blocks for React" />
        <section id="page-content" tabIndex={-1} className="pt-10 sm:pt-14">
          <p className="section-kicker">Blocks</p>
          <h1 className="section-title mt-4">
            Building blocks for flight and orbital interfaces.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Larger, production-ready compositions built from flightcn components
            — dashboards, pickers, and trackers you can drop into your app with
            a single shadcn command, then own and restyle.
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>Want to compose your own?</span>
            {PLAYGROUND_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1 font-medium text-orange-700 hover:text-orange-800"
              >
                {link.label}
                <ArrowUpRight
                  size={14}
                  className="link-arrow"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </p>
          <nav
            aria-label="Blocks on this page"
            className="mt-6 flex flex-col gap-4"
          >
            {BLOCK_CATEGORIES.map((category) => {
              const blocks = blocksConfig.filter(
                (block) => block.category === category,
              );
              if (blocks.length === 0) return null;
              return (
                <div key={category} className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] font-medium tracking-[0.15em] text-slate-500 uppercase">
                    {category}
                  </span>
                  <ul className="flex flex-wrap gap-2">
                    {blocks.map((block) => (
                      <li key={block.id}>
                        <a
                          href={`#${block.id}`}
                          className="pressable inline-flex rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-mono text-[11px] text-slate-600 hover:border-orange-600/40 hover:text-slate-950"
                        >
                          {block.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </section>
        <div className="mt-10 flex flex-col gap-8 sm:mt-14 sm:gap-10">
          {blocksConfig.map((block) => (
            <BlockCard key={block.id} block={block} />
          ))}
        </div>
        <AppFooter />
      </div>
    </main>
  );
}

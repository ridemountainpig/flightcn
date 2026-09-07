import Link from "next/link";
import { ProductDiagram } from "./product-diagram";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";

type HubCard = {
  label: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  points: readonly string[];
  icon: LucideIcon;
};

export function DocsHubPage({
  headerTitle,
  headerSubtitle,
  eyebrow,
  title,
  description,
  cards,
}: {
  headerTitle: string;
  headerSubtitle: string;
  eyebrow: string;
  title: string;
  description: string;
  cards: readonly [HubCard, HubCard];
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-[#fafaf8] text-slate-950"
    >
      <div className="site-shell flex min-h-screen flex-col">
        <AppHeader title={headerTitle} subtitle={headerSubtitle} />

        <section
          id="page-content"
          tabIndex={-1}
          className="mx-auto mt-8 w-full max-w-6xl flex-1"
        >
          <div className="overflow-hidden">
            <div className="hero-entry py-6 sm:py-8 lg:py-10">
              <p className="section-kicker">{eyebrow}</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-medium tracking-[-0.05em] text-slate-950 sm:text-6xl">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                {description}
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {cards.map((card) => {
                const Icon = card.icon;

                return (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="hub-card hero-entry group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
                  >
                    <ProductDiagram satellite={card.label === "Satellite"} />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="section-kicker">{card.label}</p>
                          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                            {card.title}
                          </h2>
                        </div>
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 shadow-sm">
                          <Icon className="size-5 shrink-0 text-slate-900" />
                        </div>
                      </div>

                      <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                        {card.description}
                      </p>

                      <div className="mt-6 grid gap-2">
                        {card.points.map((point) => (
                          <div
                            key={point}
                            className="flex items-start gap-3 text-sm text-slate-700"
                          >
                            <span className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-slate-400" />
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 inline-flex items-center gap-2 border-t border-slate-100 pt-5 text-sm font-semibold text-orange-800">
                      {card.ctaLabel}
                      <ArrowUpRight className="link-arrow size-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <AppFooter />
      </div>
    </main>
  );
}

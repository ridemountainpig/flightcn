import Link from "next/link";
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
    <main className="min-h-screen bg-stone-100 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.1)_1px,transparent_0)] bg-size-[24px_24px] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1520px] flex-col px-4 py-6 sm:px-6 lg:px-8">
        <AppHeader title={headerTitle} subtitle={headerSubtitle} />

        <section className="mt-6 flex-1">
          <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white/85 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-500 uppercase">
                {eyebrow}
              </p>
              <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                {description}
              </p>
            </div>

            <div className="grid gap-px border-t border-black/8 bg-black/8 lg:grid-cols-2">
              {cards.map((card) => {
                const Icon = card.icon;

                return (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="group flex h-full flex-col bg-white/90 p-6 transition-colors hover:bg-white sm:p-8"
                  >
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-500 uppercase">
                            {card.label}
                          </p>
                          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                            {card.title}
                          </h2>
                        </div>
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white/80 shadow-sm">
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

                    <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                      {card.ctaLabel}
                      <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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

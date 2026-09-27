"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { DocsMapMountWhenVisible } from "@/components/docs/docs-map-mount-when-visible";
import { recipesConfig } from "@/components/recipes/recipes-config";

export function RecipesPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-[#fafaf8] text-slate-950"
    >
      <div className="site-shell">
        <AppHeader title="Recipes" subtitle="Step-by-step flight features" />

        <section id="page-content" tabIndex={-1} className="pt-10 sm:pt-14">
          <p className="section-kicker">Recipes</p>
          <h1 className="section-title mt-4">
            Real flight features, step by step.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Complete walkthroughs for the things people actually build with
            flightcn — a live tracker, an airline network, a personal flight
            map. Each recipe ships a working demo, the data format, and the full
            component to copy.
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>Want ready-made UI instead?</span>
            <Link
              href="/blocks"
              className="inline-flex items-center gap-1 font-medium text-orange-700 hover:text-orange-800"
            >
              Browse blocks
              <ArrowUpRight
                size={14}
                className="link-arrow"
                aria-hidden="true"
              />
            </Link>
          </p>
        </section>

        <div className="mt-10 flex flex-col gap-8 sm:mt-14 sm:gap-10">
          {recipesConfig.map((recipe, index) => {
            const Demo = recipe.demo;
            return (
              <section
                key={recipe.slug}
                aria-label={recipe.title}
                className="relative min-w-0 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-orange-600/40 sm:p-7"
              >
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0">
                    <p className="section-kicker">
                      Recipe {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="mt-3 font-mono text-xl font-medium tracking-tight text-slate-950 sm:text-2xl">
                      <Link
                        href={`/recipes/${recipe.slug}`}
                        className="after:absolute after:inset-0 after:content-['']"
                      >
                        {recipe.title}
                      </Link>
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      {recipe.description}
                    </p>
                  </div>
                  <ul className="flex shrink-0 flex-wrap gap-2">
                    {recipe.components.map((component) => (
                      <li
                        key={component.name}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-mono text-[11px] text-slate-600"
                      >
                        {component.name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  aria-hidden="true"
                  inert
                  className="pointer-events-none -mx-2 mt-4 sm:mx-0"
                >
                  <DocsMapMountWhenVisible placeholderClassName="flex h-72 w-full items-center justify-center rounded-xl bg-[#d9d8d6] text-sm text-slate-500 sm:h-80">
                    <Demo className="lg:h-80" />
                  </DocsMapMountWhenVisible>
                </div>

                <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-orange-700">
                  Read the recipe
                  <ArrowUpRight
                    size={14}
                    className="link-arrow"
                    aria-hidden="true"
                  />
                </p>
              </section>
            );
          })}
        </div>

        <AppFooter />
      </div>
    </main>
  );
}

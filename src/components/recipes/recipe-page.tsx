"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { DocsMapMountWhenVisible } from "@/components/docs/docs-map-mount-when-visible";
import { InstallCommandCopy } from "@/components/home/install-command-copy";
import {
  recipesConfig,
  type RecipeConfig,
} from "@/components/recipes/recipes-config";
import { CopyButton } from "@/components/ui/copy-button";
import { ShikiCodeBlock } from "@/components/ui/shiki-code-block";

function RecipeCodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-white/10 px-4 font-mono text-[10px] text-slate-300">
        <span>{label}</span>
        <CopyButton
          text={code}
          label={`Copy ${label.toLowerCase()}`}
          className="hover:bg-white/10"
        />
      </div>
      <div className="custom-scrollbar max-h-[560px] max-w-full overflow-auto px-4 py-4 text-xs leading-6">
        <ShikiCodeBlock code={code} />
      </div>
    </div>
  );
}

export function RecipePage({ recipe }: { recipe: RecipeConfig }) {
  const Demo = recipe.demo;
  const moreRecipes = recipesConfig.filter(
    (other) => other.slug !== recipe.slug,
  );

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-[#fafaf8] text-slate-950"
    >
      <div className="site-shell">
        <AppHeader title="Recipes" subtitle="Step-by-step flight features" />

        <section id="page-content" tabIndex={-1} className="pt-10 sm:pt-14">
          <Link
            href="/recipes"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] text-slate-500 uppercase transition-colors hover:text-slate-950"
          >
            <ArrowLeft size={12} aria-hidden="true" />
            All recipes
          </Link>
          <p className="section-kicker mt-6">Recipe · Flight</p>
          <h1 className="section-title mt-4 max-w-3xl">{recipe.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
            {recipe.intro}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-mono text-[10px] font-medium tracking-[0.15em] text-slate-500 uppercase">
              Built with
            </span>
            <ul className="flex flex-wrap gap-2">
              {recipe.components.map((component) => (
                <li key={component.name}>
                  <Link
                    href={component.href}
                    className="pressable inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-mono text-[11px] text-slate-600 hover:border-orange-600/40 hover:text-slate-950"
                  >
                    {component.name}
                    <ArrowUpRight
                      size={11}
                      className="link-arrow text-slate-400"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <InstallCommandCopy
            item={recipe.installItem}
            className="mt-4 max-w-xl bg-slate-50"
          />
        </section>

        <section
          aria-label={`${recipe.navTitle} demo`}
          className="mt-10 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:mt-14 sm:p-7"
        >
          <p className="section-kicker">Live demo</p>
          <div className="-mx-2 mt-4 sm:mx-0">
            <DocsMapMountWhenVisible placeholderClassName="flex h-72 w-full items-center justify-center rounded-xl bg-[#d9d8d6] text-sm text-slate-500 sm:h-96 lg:h-[480px]">
              <Demo />
            </DocsMapMountWhenVisible>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            {recipe.demoNote}
          </p>
        </section>

        <div className="mt-10 flex flex-col gap-8 sm:mt-14 sm:gap-10">
          {recipe.steps.map((step, index) => (
            <section
              key={step.title}
              aria-label={step.title}
              className="min-w-0 scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-7"
            >
              <p className="font-mono text-[11px] font-medium tracking-[0.15em] text-orange-700">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-2 font-mono text-lg font-medium tracking-tight text-slate-950 sm:text-xl">
                {step.title}
              </h2>
              {step.body.split("\n\n").map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className="mt-3 max-w-3xl text-sm leading-6 text-slate-600"
                >
                  {paragraph}
                </p>
              ))}
              {step.code ? (
                <div className="-mx-2 mt-4 sm:mx-0">
                  <RecipeCodeBlock label="TSX" code={step.code} />
                </div>
              ) : null}
            </section>
          ))}

          <section
            aria-label="Full recipe code"
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-7"
          >
            <p className="section-kicker">Full recipe</p>
            <h2 className="mt-3 font-mono text-lg font-medium tracking-tight text-slate-950 sm:text-xl">
              Copy the complete component
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Everything from the steps above in one file — paste it into your
              app after installing{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-slate-800">
                {recipe.installItem}
              </code>
              .
            </p>
            <div className="-mx-2 mt-4 sm:mx-0">
              <RecipeCodeBlock
                label="FULL RECIPE · TSX"
                code={recipe.fullCode}
              />
            </div>
          </section>
        </div>

        <section aria-label="More recipes" className="mt-12 sm:mt-16">
          <p className="section-kicker">More recipes</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {moreRecipes.map((other) => (
              <Link
                key={other.slug}
                href={`/recipes/${other.slug}`}
                className="hub-card group flex flex-col rounded-2xl border border-slate-200 bg-white p-5"
              >
                <p className="font-mono text-lg font-medium tracking-tight text-slate-950">
                  {other.navTitle}
                </p>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                  {other.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-orange-700">
                  Read recipe
                  <ArrowUpRight
                    size={14}
                    className="link-arrow"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <AppFooter />
      </div>
    </main>
  );
}

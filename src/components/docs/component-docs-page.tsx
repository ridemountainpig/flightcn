"use client";

import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";

import { componentDocs } from "./component-docs-config";
import { ComponentDocSection } from "./component-doc-section";

export function ComponentDocsPage() {
  return (
    <main className="min-h-screen bg-stone-100 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.1)_1px,transparent_0)] bg-size-[24px_24px] text-slate-950">
      <div className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8">
        <AppHeader
          title="Documentation"
          subtitle="API reference and live component previews"
        />

        <section className="mt-6 rounded-[1.8rem] border border-black/10 bg-white/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Developer Docs
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            flightcn API reference and component examples
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Browse the flight route, airport marker, multi-route, and waypoint
            APIs, then preview each component with a live map example before
            adding it to your mapcn project.
          </p>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="h-fit min-w-0 rounded-[1.5rem] border border-black/10 bg-white/85 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:sticky lg:top-6">
            <p className="px-2 pb-2 text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Components
            </p>
            <nav className="space-y-2">
              {componentDocs.map((component) => (
                <a
                  key={component.id}
                  href={`#${component.id}`}
                  className="flex min-h-14 items-center rounded-xl border border-black/8 bg-slate-50/90 px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  {component.name}
                </a>
              ))}
            </nav>
            <div className="mt-4 border-t border-black/8 px-2 pt-4 text-xs text-slate-500">
              Need setup help? See the
              <Link
                href="/docs/install"
                className="ml-1 font-semibold text-slate-800 transition-colors hover:text-slate-600"
              >
                install tutorial
              </Link>
              .
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            {componentDocs.map((component) => (
              <ComponentDocSection key={component.id} component={component} />
            ))}
          </div>
        </div>
        <AppFooter />
      </div>
    </main>
  );
}

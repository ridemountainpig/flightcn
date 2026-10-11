"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane } from "lucide-react";

import { AppHeader } from "@/components/app-header";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-[#fafaf8] text-slate-950"
    >
      <div className="site-shell">
        <AppHeader
          title="Something went wrong"
          subtitle="Flight visualization components"
        />
      </div>
      <section
        id="page-content"
        tabIndex={-1}
        className="hero-entry mx-auto flex min-h-[65dvh] max-w-3xl flex-col items-center justify-center px-6 py-12 text-center"
      >
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
          <span>flightcn</span>
          <Plane className="size-3.5" aria-hidden="true" />
          <span>Error</span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-6xl">
          This page hit turbulence.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-xl sm:leading-8">
          Something stopped it from rendering. If you opened a shared link, it
          may be incomplete or out of date.
        </p>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          {/* A full load without the query string drops broken ?s= share
              state, which retrying in place would only hit again. */}
          <a
            href={pathname}
            className="pressable inline-flex w-full max-w-44 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Reload page
          </a>
          <Link
            href="/"
            className="pressable inline-flex w-full max-w-44 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}

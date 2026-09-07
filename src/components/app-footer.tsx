import Link from "next/link";

import { cn } from "@/lib/utils";

export function AppFooter({ className }: { className?: string } = {}) {
  return (
    <footer
      className={cn(
        "mt-14 border-t border-slate-200 py-6 sm:mt-16 sm:py-8",
        className,
      )}
    >
      <div className="flex flex-col gap-3 px-1 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <p className="flex items-center justify-center text-sm tracking-wide text-slate-500 sm:justify-start">
          <span
            aria-hidden="true"
            className="mr-3 inline-block h-px w-[18px] bg-orange-600"
          />
          <span className="font-semibold text-slate-900">flightcn</span>
          <span className="ml-1">built by</span>
          <a
            href="https://github.com/ridemountainpig"
            target="_blank"
            rel="noreferrer"
            className="ml-1 font-semibold text-slate-900 transition-colors hover:text-slate-600"
          >
            ridemountainpig
          </a>
          <span className="ml-2 hidden text-slate-400 sm:inline" aria-hidden>
            ·
          </span>
          <a
            href="https://github.com/ridemountainpig/flightcn/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
            className="ml-2 hidden transition-colors hover:text-slate-900 sm:inline"
          >
            MIT License
          </a>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-500 sm:justify-end">
          <Link
            href="/docs/flight"
            className="transition-colors hover:text-slate-900"
          >
            Flight Docs
          </Link>
          <Link
            href="/docs/satellite"
            className="transition-colors hover:text-slate-900"
          >
            Satellite Docs
          </Link>
          <Link
            href="/docs/install/flight"
            className="transition-colors hover:text-slate-900"
          >
            Flight Install
          </Link>
          <Link
            href="/docs/install/satellite"
            className="transition-colors hover:text-slate-900"
          >
            Satellite Install
          </Link>
          <a
            href="https://www.mapcn.dev/"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-slate-900"
          >
            Mapcn
          </a>
          <a
            href="https://github.com/ridemountainpig/flightcn"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-slate-900"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

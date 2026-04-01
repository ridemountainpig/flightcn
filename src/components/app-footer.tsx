import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="mt-14 border-t border-black/8 py-6 sm:mt-16 sm:py-8">
      <div className="flex flex-col gap-3 px-1 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <p className="text-sm tracking-wide text-slate-500">
          <span className="font-semibold text-slate-900">flightcn</span>
          <span className="ml-1 text-slate-900">built by</span>
          <a
            href="https://github.com/ridemountainpig"
            target="_blank"
            rel="noreferrer"
            className="ml-1 font-semibold text-slate-900 transition-colors hover:text-slate-600"
          >
            ridemountainpig
          </a>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-500 sm:justify-end">
          <Link href="/docs" className="transition-colors hover:text-slate-900">
            Documentation
          </Link>
          <Link
            href="/docs/install"
            className="transition-colors hover:text-slate-900"
          >
            Install Guide
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

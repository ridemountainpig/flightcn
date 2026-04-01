import Link from "next/link";
import { Plane } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-stone-100 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.1)_1px,transparent_0)] bg-size-[24px_24px] text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
          <span>flightcn</span>
          <Plane className="size-3.5" aria-hidden="true" />
          <span>404</span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          This route does not exist.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-xl sm:leading-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex w-full max-w-44 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Back to home
          </Link>
          <Link
            href="/docs"
            className="inline-flex w-full max-w-44 items-center justify-center rounded-2xl border border-slate-300/90 bg-white/90 px-5 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-white"
          >
            Open docs
          </Link>
        </div>
      </section>
    </main>
  );
}

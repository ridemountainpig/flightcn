"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { ShareLinkButton } from "@/components/playground/share-link-button";
import { FlightList } from "@/components/passport/flight-list";
import { FlightPicker } from "@/components/passport/flight-picker";
import { PassportExportDialog } from "@/components/passport/passport-export-dialog";
import {
  usePassportColor,
  usePassportDraft,
  usePassportFooter,
} from "@/components/passport/use-passport-draft";
import { usePassportShare } from "@/components/passport/use-passport-share";
import {
  builtInLookup,
  composeLookup,
  loadExtendedLookup,
  lookupFromRecord,
} from "@/lib/passport/airport-lookup";
import { normalizeFooterText } from "@/lib/passport/footer-text";
import {
  DEFAULT_ROUTE_COLOR,
  normalizeRouteColor,
  ROUTE_COLORS,
} from "@/lib/passport/route-colors";
import { cn } from "@/lib/utils";
import {
  FlightPassport,
  type PassportYear,
} from "@/registry/blocks/flight-passport/flight-passport";
import {
  formatFlightLog,
  formatInteger,
  listFlightYears,
  parseFlightLog,
  resolveFlights,
  SAMPLE_PASSPORT_FLIGHTS,
  type AirportLookup,
  type DistanceUnit,
  type PassportFlightInput,
} from "@/registry/blocks/flight-passport/flight-passport-stats";
import type { AirportInfo } from "@/registry/flight-airports";

export type SharedPassportProps = {
  flights: PassportFlightInput[];
  d: string;
  year?: number;
  unit: DistanceUnit;
  color: string;
  footer?: string;
  extraAirports: Record<string, AirportInfo>;
  headline: string;
  description: string;
};

const SAMPLE_LOG = formatFlightLog(SAMPLE_PASSPORT_FLIGHTS);
const SAMPLE_YEARS = listFlightYears(
  resolveFlights(SAMPLE_PASSPORT_FLIGHTS, builtInLookup).flights,
);
const PLACEHOLDER = [
  "2026-01-09 TPE HND",
  "2026-01-14 HND TPE",
  "2026-03 TPE-NRT-HNL",
  "SFO JFK",
].join("\n");
const MAX_LISTED_ISSUES = 5;

const toolbarButton =
  "pressable inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-slate-600 hover:bg-slate-100";
const settingLabel = "block text-xs font-medium text-slate-700";
const NO_FLIGHTS: PassportFlightInput[] = [];
const primaryShareButton =
  "pressable inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-slate-800";
const CUSTOM_COLOR_SWATCH =
  "conic-gradient(from 180deg, #ef4444, #f59e0b, #22c55e, #06b6d4, #3b82f6, #a855f7, #ef4444)";

export function PassportPage({
  shared,
  invalidShare,
}: {
  shared: SharedPassportProps | null;
  invalidShare: boolean;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-[#fafaf8] text-slate-950"
    >
      <div className="site-shell">
        <AppHeader title="Passport" subtitle="Your flight history, mapped" />
        {shared ? (
          <SharedPassportView shared={shared} />
        ) : (
          <PassportEditor invalidShare={invalidShare} />
        )}
        <DeveloperNote />
        <AppFooter />
      </div>
    </main>
  );
}

function PassportEditor({ invalidShare }: { invalidShare: boolean }) {
  const [draft, setDraft] = usePassportDraft();
  const [inputMode, setInputMode] = useState<"type" | "pick">("pick");
  // The last change made with a button (add, remove, Load example, Clear),
  // so it can be undone. Typing forgets it.
  const [recordedChange, setLastChange] = useState<{
    message: string;
    previous: string;
    next: string;
  } | null>(null);
  // Another tab may have changed the log since, and undoing would write
  // over that, so the undo only lasts while the log is what it left.
  const lastChange =
    recordedChange && recordedChange.next === (draft ?? "")
      ? recordedChange
      : null;
  const editDraft = (text: string) => {
    setLastChange(null);
    setDraft(text);
  };
  const changeDraft = (text: string, message: string) => {
    // A repeated click (Load example twice) would make the undo point at
    // the text it just set, losing the flights before it.
    if (text === (draft ?? "")) return;
    setLastChange({ message, previous: draft ?? "", next: text });
    setDraft(text);
  };
  const addFlights = (lines: string[], message: string) => {
    const body = (draft ?? "").trimEnd();
    changeDraft(`${body ? `${body}\n` : ""}${lines.join("\n")}\n`, message);
  };
  const removeLine = (line: number, label: string) => {
    const rows = (draft ?? "").split(/\r?\n/);
    rows.splice(line - 1, 1);
    changeDraft(rows.join("\n"), `Removed ${label}.`);
  };
  const undoChange = () => {
    if (!lastChange) return;
    setDraft(lastChange.previous);
    setLastChange(null);
  };
  // Both read the deferred draft, so the stored log and the hydrated flag
  // arrive in the same render and the example never flashes in between.
  const deferredDraft = useDeferredValue(draft);
  const hydrated = deferredDraft !== null;
  const deferredText = deferredDraft ?? "";
  const parsed = useMemo(() => parseFlightLog(deferredText), [deferredText]);
  // The flight list removes lines by number, so it reads the current text,
  // not the deferred one the passport renders from.
  const liveParsed = useMemo(
    () => (inputMode === "pick" ? parseFlightLog(draft ?? "") : null),
    [inputMode, draft],
  );
  // Codes outside the built-in database load a larger list on demand.
  const [extendedLookup, setExtendedLookup] = useState<AirportLookup | null>(
    null,
  );
  // The unknown codes when loading the list last failed.
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const lookup = useMemo(
    () =>
      extendedLookup
        ? composeLookup(builtInLookup, extendedLookup)
        : builtInLookup,
    [extendedLookup],
  );
  const resolved = useMemo(
    () => resolveFlights(parsed.flights, lookup),
    [parsed, lookup],
  );
  const isExample = parsed.flights.length === 0;
  const unknownCodes = resolved.unknown.map((entry) => entry.code).join();
  const lookingUp =
    !!unknownCodes && !extendedLookup && failedFor !== unknownCodes;
  // The larger list didn't load, so these codes were never checked in it.
  const lookupFailed =
    !!unknownCodes && !extendedLookup && failedFor === unknownCodes;
  useEffect(() => {
    if (!lookingUp) return;
    let cancelled = false;
    loadExtendedLookup().then(
      // Wrapped because a function passed to a state setter is an updater.
      (loaded) => !cancelled && setExtendedLookup(() => loaded),
      () => !cancelled && setFailedFor(unknownCodes),
    );
    return () => {
      cancelled = true;
    };
  }, [lookingUp, unknownCodes]);

  const [pickedYear, setYear] = useState<PassportYear>("all");
  // A year picked on the example doesn't carry over to the user's own log.
  const [yearFor, setYearFor] = useState(isExample);
  if (yearFor !== isExample) {
    setYearFor(isExample);
    setYear("all");
  }
  // A year whose flights were all removed falls back to all time, so the
  // link and the exports never ask for an empty year.
  const shownYears = useMemo(
    () => (isExample ? SAMPLE_YEARS : listFlightYears(resolved.flights)),
    [isExample, resolved],
  );
  const year: PassportYear =
    pickedYear !== "all" && shownYears.includes(pickedYear)
      ? pickedYear
      : "all";
  const [unit, setUnit] = useState<DistanceUnit>("km");
  const [exactDates, setExactDates] = useState(false);
  const [storedColor, setRouteColor] = usePassportColor();
  const routeColor = normalizeRouteColor(storedColor) ?? DEFAULT_ROUTE_COLOR;
  const [footerText, setFooterText] = usePassportFooter();
  const shareFlights = useMemo(
    () =>
      resolved.flights.map((flight) => ({
        from: flight.from.code,
        to: flight.to.code,
        date: flight.date,
      })),
    [resolved],
  );
  const share = usePassportShare({
    // Flights waiting on the larger airport list would be left out of the
    // link, though the shared page could map them.
    flights: lookingUp || lookupFailed ? NO_FLIGHTS : shareFlights,
    exactDates,
    year: year === "all" ? undefined : year,
    unit,
    color: routeColor,
    footer: normalizeFooterText(footerText),
  });

  const flightCount = resolved.flights.length;
  const skipped = parsed.flights.length - flightCount;

  return (
    <>
      <section id="page-content" tabIndex={-1} className="pt-10 sm:pt-14">
        <p className="section-kicker">Flight passport</p>
        <h1 className="section-title mt-4">
          Every flight you&apos;ve taken, on one map.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Paste your flights, one per line, and get a lifetime map, travel
          stats, and a year in review you can share. Free and no sign-up. Your
          log stays in your browser.
        </p>
        {invalidShare ? (
          <p
            role="status"
            className="fade-rise mt-4 max-w-2xl rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900"
          >
            That share link is incomplete or out of date, so here&apos;s the
            editor instead.
          </p>
        ) : null}
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
        {/* Stays beside the passport on wide screens, and scrolls on its own
            when it is taller than the window. */}
        <div className="custom-scrollbar min-w-0 space-y-4 xl:sticky xl:top-6 xl:max-h-[calc(100dvh-3rem)] xl:overflow-y-auto">
          <section
            aria-labelledby="passport-log-label"
            className="rounded-2xl border border-slate-200 bg-white"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <h2
                id="passport-log-label"
                className="font-mono text-[10px] tracking-widest text-slate-500 uppercase"
              >
                Your flights
              </h2>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => changeDraft(SAMPLE_LOG, "Loaded the example.")}
                  className={toolbarButton}
                >
                  Load example
                </button>
                <button
                  type="button"
                  onClick={() => changeDraft("", "Cleared your flights.")}
                  disabled={!draft}
                  className={cn(
                    toolbarButton,
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="border-b border-slate-200 px-4 py-2.5">
              <div
                role="group"
                aria-label="How to add flights"
                className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
              >
                {(
                  [
                    ["pick", "Pick airports"],
                    ["type", "Type or paste"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={inputMode === mode}
                    onClick={() => setInputMode(mode)}
                    className={cn(
                      "pressable flex-1 rounded-md px-2 py-1.5 text-xs font-medium",
                      inputMode === mode
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:text-slate-950",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {inputMode === "pick" ? (
              <>
                <FlightPicker
                  onAdd={addFlights}
                  notice={
                    lastChange
                      ? { message: lastChange.message, onUndo: undoChange }
                      : null
                  }
                />
                <FlightList
                  flights={liveParsed?.flights ?? []}
                  lookup={lookup}
                  onRemove={removeLine}
                />
                <p
                  id="passport-log-help"
                  className="border-t border-slate-200 px-4 py-3 text-xs leading-5 text-slate-500"
                >
                  Search by city, airport name or code. Flights you add show up
                  in Type or paste too, where you can edit them.
                </p>
              </>
            ) : (
              <>
                <textarea
                  id="passport-log"
                  aria-label="Your flights, one per line"
                  value={draft ?? ""}
                  onChange={(event) => editDraft(event.target.value)}
                  placeholder={PLACEHOLDER}
                  rows={10}
                  spellCheck={false}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  autoComplete="off"
                  wrap="off"
                  aria-describedby="passport-log-help passport-log-issues"
                  className="custom-scrollbar block w-full resize-y border-0 bg-transparent px-4 py-3 font-mono text-base leading-7 text-slate-950 placeholder:text-slate-400 focus:outline-none sm:text-sm sm:leading-6"
                />
                <p
                  id="passport-log-help"
                  className="border-t border-slate-200 px-4 py-3 text-xs leading-5 text-slate-500"
                >
                  One flight per line: an optional date (YYYY-MM-DD or YYYY-MM)
                  and two airport codes. Join legs with a dash, like
                  TPE-NRT-HNL.
                </p>
              </>
            )}
            <div
              id="passport-log-issues"
              aria-live="polite"
              className="border-t border-slate-200 px-4 py-3 text-xs leading-5"
            >
              <p className="text-slate-600">
                {isExample
                  ? "Showing an example passport."
                  : `${formatInteger(flightCount)} ${flightCount === 1 ? "flight" : "flights"} mapped${
                      skipped > 0 ? `, ${formatInteger(skipped)} skipped` : ""
                    }.`}
              </p>
              {inputMode === "type" && lastChange ? (
                <p className="mt-2 text-slate-600">
                  {lastChange.message}{" "}
                  <button
                    type="button"
                    onClick={undoChange}
                    className="font-medium text-slate-950 underline underline-offset-2"
                  >
                    Undo
                  </button>
                </p>
              ) : null}
              {lookingUp ? (
                <p className="mt-2 text-slate-500">Looking up more airports…</p>
              ) : resolved.unknown.length > 0 ? (
                <>
                  {lookupFailed ? (
                    <p className="mt-2 text-slate-600">
                      Couldn&apos;t load the full airport list, so these
                      weren&apos;t checked.{" "}
                      {/* The bundler keeps a failed chunk load for the
                          page's lifetime, so only a reload retries it. The
                          log is saved, so nothing is lost. */}
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="font-medium text-slate-950 underline underline-offset-2"
                      >
                        Reload to try again
                      </button>
                    </p>
                  ) : null}
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {resolved.unknown.map((entry) => (
                      <li
                        key={entry.code}
                        className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[11px] text-red-700"
                      >
                        {entry.code}
                        {entry.hint ? (
                          <span className="font-sans"> → try {entry.hint}</span>
                        ) : lookupFailed ? (
                          <span className="font-sans"> not checked</span>
                        ) : (
                          <span className="font-sans"> not found</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {parsed.issues.length > 0 ? (
                <ul className="mt-2 space-y-1 text-red-700">
                  {parsed.issues.slice(0, MAX_LISTED_ISSUES).map((issue) => (
                    <li key={`${issue.line}-${issue.message}`}>
                      <span className="font-mono">Line {issue.line}:</span>{" "}
                      {issue.message}
                    </li>
                  ))}
                  {parsed.issues.length > MAX_LISTED_ISSUES ? (
                    <li>and {parsed.issues.length - MAX_LISTED_ISSUES} more</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          </section>

          <section
            aria-labelledby="passport-style-label"
            className="rounded-2xl border border-slate-200 bg-white"
          >
            <h2
              id="passport-style-label"
              className="border-b border-slate-200 px-4 py-3 font-mono text-[10px] tracking-widest text-slate-500 uppercase"
            >
              Customize
            </h2>
            <div className="space-y-4 px-4 py-4">
              <div>
                <span id="passport-unit-label" className={settingLabel}>
                  Distance
                </span>
                <div
                  role="group"
                  aria-labelledby="passport-unit-label"
                  className="mt-2 flex w-fit rounded-lg border border-slate-200 bg-slate-50 p-0.5"
                >
                  {(["km", "mi"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setUnit(option)}
                      aria-pressed={unit === option}
                      className={cn(
                        "pressable rounded-md px-2 py-1 font-mono text-[11px]",
                        unit === option
                          ? "bg-slate-950 text-white"
                          : "text-slate-600 hover:text-slate-950",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <RouteColorPicker value={routeColor} onChange={setRouteColor} />
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={exactDates}
                  onChange={(event) => setExactDates(event.target.checked)}
                  className="size-4 accent-orange-600"
                />
                Include exact dates in the link
              </label>
            </div>
          </section>
        </div>

        <div className="min-w-0">
          {/* Sharing sits on the passport itself, so a long flight list in
              the sidebar never pushes it out of sight. */}
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            {hydrated && isExample ? (
              <p className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-[11px] text-slate-600">
                Example passport — paste your flights to replace it
              </p>
            ) : (
              <ShareHint
                status={share.status}
                waitingForAirports={lookupFailed}
              />
            )}
            <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
              <ShareLinkButton
                getUrl={() =>
                  new URL(share.pagePath ?? "/passport", window.location.origin)
                    .href
                }
                title={
                  share.pagePath
                    ? "Copy a link to this passport"
                    : "Add your flights to get a share link"
                }
                label="Copy link"
                disabled={!share.pagePath}
                className="flex-1 justify-center bg-white px-4 py-2 text-sm sm:flex-none"
              />
              <PassportExportDialog
                flights={resolved.flights}
                params={share.params}
                footerText={footerText ?? ""}
                onFooterTextChange={setFooterText}
                triggerClassName={cn(
                  primaryShareButton,
                  "flex-1 justify-center sm:flex-none",
                )}
                iconSize={14}
              />
            </div>
          </div>
          <FlightPassport
            flights={isExample ? SAMPLE_PASSPORT_FLIGHTS : parsed.flights}
            year={year}
            onYearChange={setYear}
            unit={unit}
            lookupAirport={lookup}
            routeColor={routeColor}
          />
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Share links carry your flights, with dates rounded to the month
            unless you include exact dates. flightcn renders the shared page and
            image from the link and stores nothing.
          </p>
        </div>
      </div>
    </>
  );
}

function RouteColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const custom = !ROUTE_COLORS.some((color) => color.value === value);
  const swatchClass = (selected: boolean) =>
    cn(
      "pressable relative size-6 shrink-0 rounded-full border-2 border-white",
      selected
        ? "ring-2 ring-slate-950"
        : "ring-1 ring-slate-200 hover:ring-slate-400",
    );
  return (
    <div>
      <span id="passport-color-label" className={settingLabel}>
        Route color
      </span>
      <div
        role="group"
        aria-labelledby="passport-color-label"
        className="mt-2 flex flex-wrap items-center gap-1.5"
      >
        {ROUTE_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            title={color.name}
            aria-label={color.name}
            aria-pressed={value === color.value}
            onClick={() => onChange(color.value)}
            className={swatchClass(value === color.value)}
            style={{ backgroundColor: color.value }}
          />
        ))}
        <label
          title="Custom color"
          className={cn(
            swatchClass(custom),
            "cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-[#c65d24]",
          )}
          style={{ background: custom ? value : CUSTOM_COLOR_SWATCH }}
        >
          <span className="sr-only">Custom color</span>
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}

function ShareHint({
  status,
  waitingForAirports,
}: {
  status: ReturnType<typeof usePassportShare>["status"];
  waitingForAirports: boolean;
}) {
  if (waitingForAirports) {
    return (
      <p className="text-xs text-slate-500">
        Sharing waits until every airport is checked.
      </p>
    );
  }
  if (status === "long") {
    return (
      <p className="text-xs text-slate-500">
        This link is long. It works, but some apps may shorten or cut it.
      </p>
    );
  }
  if (status === "too-long") {
    return (
      <p className="text-xs text-red-700">
        Too many flights for a link. Turn off exact dates or remove some
        flights.
      </p>
    );
  }
  return null;
}

const sharedButton =
  "pressable inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100";

function SharedPassportView({ shared }: { shared: SharedPassportProps }) {
  const lookup = useMemo(
    () => composeLookup(builtInLookup, lookupFromRecord(shared.extraAirports)),
    [shared.extraAirports],
  );
  const resolvedFlights = useMemo(
    () => resolveFlights(shared.flights, lookup).flights,
    [shared.flights, lookup],
  );
  // The viewer can browse other years; the exports follow what's on screen.
  const [year, setYear] = useState<PassportYear>(shared.year ?? "all");
  const shareParams = {
    d: shared.d,
    year: year === "all" ? undefined : year,
    unit: shared.unit,
    color: shared.color,
    footer: shared.footer,
  };

  return (
    <>
      <section id="page-content" tabIndex={-1} className="pt-10 sm:pt-14">
        <p className="section-kicker">Shared flight passport</p>
        <h1 className="section-title mt-4">{shared.headline}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {shared.description}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href="/passport"
            className="pressable inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Make your own passport
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
          <PassportExportDialog
            flights={resolvedFlights}
            params={shareParams}
            triggerClassName={sharedButton}
            iconSize={14}
          />
          <ShareLinkButton
            getUrl={() => {
              // The year on screen, like the exports, so the link opens
              // where the viewer is looking.
              const url = new URL(window.location.href);
              if (shareParams.year) {
                url.searchParams.set("year", String(shareParams.year));
              } else {
                url.searchParams.delete("year");
              }
              return url.href;
            }}
            title="Copy this passport's link"
            label="Copy link"
            className="px-4 py-2 text-sm"
          />
        </div>
      </section>
      <div className="mt-8">
        <FlightPassport
          flights={shared.flights}
          year={year}
          onYearChange={setYear}
          unit={shared.unit}
          lookupAirport={lookup}
          routeColor={shared.color}
        />
      </div>
    </>
  );
}

/**
 * A quiet pointer for developers: the page is for travellers, and the block
 * behind it lives on the blocks page.
 */
function DeveloperNote() {
  return (
    <p className="mt-12 text-xs leading-5 text-slate-500">
      For developers: this page is the open-source{" "}
      <Link
        href="/blocks#flight-passport"
        className="font-medium text-slate-700 underline underline-offset-2 hover:text-slate-950"
      >
        Flight Passport block
      </Link>{" "}
      from flightcn. Install it with the shadcn CLI and pass it your own
      flights.
    </p>
  );
}

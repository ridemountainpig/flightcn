"use client";

import { useMemo, useRef } from "react";
import { X } from "lucide-react";

import {
  formatFlightDate,
  formatInteger,
  type AirportLookup,
  type ParsedFlightLog,
} from "@/registry/blocks/flight-passport/flight-passport-stats";

/** One line of the log: a flight, or legs joined with "-". */
type LogEntry = { line: number; date?: string; codes: string[] };

function buildEntries(flights: ParsedFlightLog["flights"]): LogEntry[] {
  const byLine = new Map<number, LogEntry>();
  for (const flight of flights) {
    const entry = byLine.get(flight.line);
    if (entry) entry.codes.push(flight.to);
    else {
      byLine.set(flight.line, {
        line: flight.line,
        date: flight.date,
        codes: [flight.from, flight.to],
      });
    }
  }
  // Newest first; undated flights last, in the order they were written.
  return [...byLine.values()].sort((a, b) => {
    if (a.date && b.date && a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    if (!a.date !== !b.date) return a.date ? -1 : 1;
    return b.line - a.line;
  });
}

/**
 * The flights in the log, newest first, so people adding flights by
 * picking airports can see and remove what they added.
 */
export function FlightList({
  flights,
  lookup,
  onRemove,
}: {
  flights: ParsedFlightLog["flights"];
  lookup: AirportLookup;
  /** Removes a line of the log; `label` describes it for the undo message. */
  onRemove: (line: number, label: string) => void;
}) {
  const entries = useMemo(() => buildEntries(flights), [flights]);
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <section
      aria-labelledby="passport-added-label"
      className="border-t border-slate-200"
    >
      <div className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-1">
        <h3
          ref={heading}
          id="passport-added-label"
          tabIndex={-1}
          className="font-mono text-[10px] tracking-widest text-slate-500 uppercase focus:outline-none"
        >
          Added flights
        </h3>
        <span className="font-mono text-[10px] text-slate-500 tabular-nums">
          {formatInteger(flights.length)}
        </span>
      </div>
      {entries.length === 0 ? (
        <p className="px-4 pb-3 text-xs leading-5 text-slate-500">
          No flights yet. Pick two airports above to add one.
        </p>
      ) : (
        <ul className="custom-scrollbar max-h-72 overflow-y-auto pb-1">
          {entries.map((entry) => {
            const route = entry.codes.join(" → ");
            const cities = entry.codes.map((code) => lookup(code)?.city);
            const date = formatFlightDate(entry.date);
            return (
              <li
                // Keyed by content too, so a removed row's button doesn't
                // live on as the next flight's.
                key={`${entry.line}:${entry.date ?? ""}:${route}`}
                className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-medium text-slate-950">
                    {route}
                  </p>
                  {cities.every(Boolean) ? (
                    <p className="truncate text-xs text-slate-500">
                      {cities.join(" → ")}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                  {date}
                </span>
                <button
                  type="button"
                  onClick={(event) => {
                    // The next row moves under the pointer, so the second
                    // click of a double click would remove it too.
                    if (event.detail > 1) return;
                    onRemove(entry.line, route);
                    // The row is gone; keep keyboard focus in the list.
                    heading.current?.focus();
                  }}
                  aria-label={`Remove ${route}, ${date}`}
                  title="Remove"
                  className="pressable -mr-1.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-950"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

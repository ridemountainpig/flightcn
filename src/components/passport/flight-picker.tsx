"use client";

import {
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type Ref,
} from "react";
import { ArrowUpDown, Plus } from "lucide-react";

import { loadExtendedAirports } from "@/lib/passport/airport-lookup";
import {
  indexAirports,
  searchAirports,
  type AirportSearchEntry,
} from "@/lib/passport/airport-search";
import { cn } from "@/lib/utils";
import { MIN_FLIGHT_YEAR } from "@/registry/blocks/flight-passport/flight-passport-stats";
import type { AirportInfo } from "@/registry/flight-airports";
import { airports } from "@/registry/flight-airports-utils";

const fieldLabel = "block text-xs font-medium text-slate-700";
const fieldInput =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none sm:text-sm";

let builtInIndex: AirportSearchEntry[] | null = null;

function builtInAirportIndex() {
  builtInIndex ??= indexAirports(Object.values(airports), true);
  return builtInIndex;
}

/**
 * Searches the built-in airports right away and adds the extended list
 * (smaller airports) once a search box is focused.
 */
function useAirportSearch() {
  const [extended, setExtended] = useState<AirportSearchEntry[]>([]);
  const requested = useRef(false);
  const entries = useMemo(
    () => [...builtInAirportIndex(), ...extended],
    [extended],
  );

  const loadMore = () => {
    if (requested.current) return;
    requested.current = true;
    loadExtendedAirports().then(
      (list) => setExtended(indexAirports(list, false)),
      () => {
        requested.current = false;
      },
    );
  };
  const search = (query: string) => searchAirports(entries, query);
  return { search, loadMore };
}

function airportLabel(airport: AirportInfo) {
  return `${airport.city} (${airport.code})`;
}

function AirportCombobox({
  label,
  value,
  onChange,
  search,
  onFocus,
  inputRef,
}: {
  label: string;
  value: AirportInfo | null;
  onChange: (airport: AirportInfo | null) => void;
  search: (query: string) => AirportInfo[];
  onFocus: () => void;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState(value ? airportLabel(value) : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // A value picked elsewhere (swap, reset) replaces whatever was typed.
  const [shownValue, setShownValue] = useState(value);
  if (shownValue !== value) {
    setShownValue(value);
    setQuery(value ? airportLabel(value) : "");
  }

  const results = open && !value ? search(query) : [];
  const select = (airport: AirportInfo) => {
    setShownValue(airport);
    setQuery(airportLabel(airport));
    setOpen(false);
    onChange(airport);
  };

  return (
    <div className="relative">
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          results.length > 0 ? `${id}-option-${active}` : undefined
        }
        value={query}
        placeholder="City, airport or code"
        autoComplete="off"
        spellCheck={false}
        onFocus={(event) => {
          onFocus();
          setOpen(true);
          if (value) event.currentTarget.select();
        }}
        onBlur={() => {
          setOpen(false);
          // A typed code counts as picked when leaving with Tab or a tap.
          const typed = query.trim().toUpperCase();
          const match = value ? null : search(query)[0];
          if (match && match.code === typed) select(match);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
          if (value) {
            setShownValue(null);
            onChange(null);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && results.length > 0) {
            event.preventDefault();
            setActive((index) => (index + 1) % results.length);
          } else if (event.key === "ArrowUp" && results.length > 0) {
            event.preventDefault();
            setActive((index) => (index - 1 + results.length) % results.length);
          } else if (event.key === "Enter" && results.length > 0) {
            event.preventDefault();
            select(results[Math.min(active, results.length - 1)]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className={fieldInput}
      />
      {results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={`${label} airports`}
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/10"
        >
          {results.map((airport, index) => (
            <li
              key={airport.code}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === active}
              // Keep focus in the input so the click lands before blur closes the list.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(airport)}
              onMouseEnter={() => setActive(index)}
              className={cn(
                "flex cursor-pointer items-baseline gap-2.5 rounded-lg px-2.5 py-2",
                index === active && "bg-slate-100",
              )}
            >
              <span className="w-9 shrink-0 font-mono text-xs font-semibold text-slate-950">
                {airport.code}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-slate-950">
                  {airport.city}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {airport.name} · {airport.country}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Adds flights by picking airports and dates instead of typing codes. The
 * flights go into the same log as typed ones, so both ways stay in sync.
 */
export function FlightPicker({
  onAdd,
  notice,
}: {
  /** Adds lines to the flight log, in the format a person would type. */
  onAdd: (lines: string[], message: string) => void;
  /** The last change to the log, with a way to take it back. */
  notice: { message: string; onUndo: () => void } | null;
}) {
  const { search, loadMore } = useAirportSearch();
  const [from, setFrom] = useState<AirportInfo | null>(null);
  const [to, setTo] = useState<AirportInfo | null>(null);
  const [date, setDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const toInput = useRef<HTMLInputElement>(null);

  const sameAirport = !!from && !!to && from.code === to.code;
  const returnTooEarly = !!date && !!returnDate && returnDate < date;
  // The log reads years from MIN_FLIGHT_YEAR to next year; others would
  // show up as errors instead of flights.
  const outOfRange = (value: string) =>
    !!value &&
    (Number(value.slice(0, 4)) < MIN_FLIGHT_YEAR ||
      Number(value.slice(0, 4)) > new Date().getFullYear() + 1);
  const error = sameAirport
    ? "Pick two different airports."
    : returnTooEarly
      ? "The return is before the departure."
      : outOfRange(date) || outOfRange(returnDate)
        ? `Dates go from ${MIN_FLIGHT_YEAR} to next year.`
        : null;
  const canAdd = !!from && !!to && !error;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!from || !to || error) return;
    const line = (day: string, a: AirportInfo, b: AirportInfo) =>
      `${day ? `${day} ` : ""}${a.code} ${b.code}`;
    const lines = [line(date, from, to)];
    if (returnDate) lines.push(line(returnDate, to, from));
    onAdd(
      lines,
      `Added ${from.code} → ${to.code}${returnDate ? " and the flight back" : ""}.`,
    );
    // Trips usually start from the same airport, so keep it for the next one.
    setTo(null);
    setDate("");
    setReturnDate("");
    toInput.current?.focus();
  };

  return (
    <form onSubmit={submit} className="space-y-3 px-4 py-4">
      <AirportCombobox
        label="From"
        value={from}
        onChange={setFrom}
        search={search}
        onFocus={loadMore}
      />
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          disabled={!from && !to}
          aria-label="Swap the airports"
          title="Swap"
          className="pressable absolute top-0 right-0 z-10 -mt-1 inline-flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950 disabled:opacity-40"
        >
          <ArrowUpDown size={14} aria-hidden="true" />
        </button>
        <AirportCombobox
          label="To"
          value={to}
          onChange={setTo}
          search={search}
          onFocus={loadMore}
          inputRef={toInput}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <label htmlFor="passport-pick-date" className={fieldLabel}>
            Date <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="passport-pick-date"
            type="date"
            min={`${MIN_FLIGHT_YEAR}-01-01`}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={cn(fieldInput, "px-2")}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="passport-pick-return" className={fieldLabel}>
            Return{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="passport-pick-return"
            type="date"
            value={returnDate}
            min={date || `${MIN_FLIGHT_YEAR}-01-01`}
            onChange={(event) => setReturnDate(event.target.value)}
            className={cn(fieldInput, "px-2")}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="submit"
          disabled={!canAdd}
          className="pressable inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} aria-hidden="true" />
          {returnDate ? "Add both flights" : "Add flight"}
        </button>
        <p role="status" className="text-xs text-slate-600">
          {error ? (
            <span className="text-red-700">{error}</span>
          ) : notice ? (
            <>
              {notice.message}{" "}
              <button
                type="button"
                onClick={notice.onUndo}
                className="font-medium text-slate-950 underline underline-offset-2"
              >
                Undo
              </button>
            </>
          ) : null}
        </p>
      </div>
    </form>
  );
}

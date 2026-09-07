"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, ArrowUpRight } from "lucide-react";
import { searchAirports } from "@/lib/flight-airports-search";
import {
  allAirports,
  featuredAirportsForSearch,
} from "@/components/home/home-config";
import type { AirportInfo } from "@/registry/flight-airports";

export function AirportSearchPanel({
  selected,
  onSelect,
}: {
  selected: AirportInfo | null;
  onSelect: (airport: AirportInfo) => void;
}) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const results = useMemo(
    () =>
      query.trim()
        ? searchAirports(allAirports, query, 30)
        : featuredAirportsForSearch,
    [query],
  );
  return (
    <aside className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white lg:h-full">
      <div className="p-4 lg:p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-widest text-orange-700 uppercase">
            Airport directory
          </p>
          <button
            type="button"
            aria-label={
              collapsed ? "Expand airport search" : "Collapse airport search"
            }
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
            className="pressable rounded p-2 hover:bg-slate-100 lg:hidden"
          >
            <ChevronDown
              size={16}
              className={`collapse-chevron ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-[#fafaf8] px-3 py-3 focus-within:ring-2 focus-within:ring-orange-600">
          <Search size={16} className="shrink-0 text-slate-500" />
          <input
            aria-label="Search airports"
            placeholder="IATA code, city or country"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCollapsed(false);
            }}
            className="w-full min-w-0 bg-transparent text-sm outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="pressable rounded px-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              ×
            </button>
          ) : null}
        </label>
      </div>
      <div
        className={`${collapsed ? "hidden lg:flex" : "flex"} min-h-0 flex-1 flex-col`}
      >
        <p className="px-5 pb-3 text-xs text-slate-500" role="status">
          {query.trim()
            ? `${results.length}${results.length === 30 ? "+" : ""} matching airports`
            : "Start somewhere familiar"}
        </p>
        <div className="max-h-52 min-h-0 flex-1 overflow-y-auto px-2 pb-2 lg:max-h-none">
          {results.length ? (
            results.map((airport) => (
              <button
                type="button"
                key={airport.code}
                aria-pressed={selected?.code === airport.code}
                onClick={() => {
                  onSelect(airport);
                  setCollapsed(true);
                }}
                className="group flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-100 aria-pressed:bg-orange-50"
              >
                <span className="w-11 shrink-0 font-mono text-sm font-semibold text-slate-950">
                  {airport.code}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-700">
                    {airport.city || airport.name}
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-500">
                    {airport.name}
                  </span>
                </span>
                <ArrowUpRight
                  size={15}
                  className="shrink-0 text-slate-300 group-hover:text-orange-700"
                />
              </button>
            ))
          ) : (
            <p className="p-4 text-sm text-slate-500">
              No airports found. Try a city or a three-letter code such as TPE.
            </p>
          )}
        </div>
      </div>
      <p className="hidden border-t border-slate-100 px-5 py-4 text-xs text-slate-500 lg:block">
        {allAirports.length.toLocaleString()} airports
      </p>
    </aside>
  );
}

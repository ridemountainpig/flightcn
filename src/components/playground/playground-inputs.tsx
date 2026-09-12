"use client";

import { type ReactNode } from "react";

export function ControlSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="mb-2.5 font-mono text-[10px] font-medium tracking-widest text-slate-500 uppercase">
        {title}
      </p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  format?: (value: number) => string;
}) {
  return (
    <div className={disabled ? "pointer-events-none opacity-40" : ""}>
      <div className="mb-1 flex justify-between">
        <span className="text-xs text-slate-600">{label}</span>
        <span className="font-mono text-xs text-slate-900">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-slate-900"
      />
    </div>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center justify-between ${
        disabled ? "pointer-events-none opacity-40" : "cursor-pointer"
      }`}
    >
      <span className="text-xs text-slate-600">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-slate-900"
      />
    </label>
  );
}

export function SegmentedRow<Option extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: Option;
  options: readonly Option[];
  onChange: (value: Option) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 ${disabled ? "pointer-events-none opacity-40" : ""}`}
    >
      <span className="text-xs text-slate-600">{label}</span>
      <div className="flex gap-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`pressable rounded-md px-2 py-0.5 text-[10px] font-medium ${
              value === option
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ColorRow({
  label,
  value,
  onChange,
  fallback = "#b65320",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Color applied when switching from auto to custom */
  fallback?: string;
}) {
  const hasCustom = value !== "";

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        {hasCustom ? (
          <>
            <input
              type="color"
              value={value}
              aria-label={`${label} color picker`}
              onChange={(event) => onChange(event.target.value)}
              className="h-5 w-8 cursor-pointer rounded-md border border-slate-200"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="pressable text-[10px] text-slate-500 hover:text-slate-700"
            >
              auto
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onChange(fallback)}
            className="pressable text-[10px] text-slate-500 underline decoration-dotted underline-offset-2 hover:text-slate-800"
          >
            auto
          </button>
        )}
      </div>
    </div>
  );
}

export function FixedColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-slate-500 uppercase">
          {value}
        </span>
        <input
          type="color"
          value={value}
          aria-label={`${label} color picker`}
          onChange={(event) => onChange(event.target.value)}
          className="h-5 w-8 cursor-pointer rounded-md border border-slate-200"
        />
      </div>
    </div>
  );
}

/**
 * Bare 3-letter IATA input that commits only valid airport codes.
 * `blockedCodes` rejects codes already used by the caller (e.g. the
 * opposite endpoint of a route).
 */

export function TextRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-xs text-slate-600">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
        spellCheck={false}
        className="w-32 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-right text-xs text-slate-900 transition-colors hover:bg-slate-100 focus:border-slate-400"
      />
    </div>
  );
}

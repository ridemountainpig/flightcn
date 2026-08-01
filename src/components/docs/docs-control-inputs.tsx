"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

function normalizeHexColor(value: string) {
  const trimmed = value.trim().replace(/^#/, "");

  if (/^[\da-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toLowerCase()}`;
  }

  if (/^[\da-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }

  return null;
}

export function SelectInput({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative flex w-full">
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.currentTarget.value)}
        disabled={disabled}
        className="h-9 w-full appearance-none rounded-xl border border-black/10 bg-slate-50 px-3 pr-8 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

export function ColorInput({
  value,
  onChange,
  ariaLabel,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  const commitDraft = () => {
    const normalized = normalizeHexColor(draft);
    if (!normalized) {
      setDraft(value);
      return;
    }

    setDraft(normalized);
    if (normalized !== value) {
      onChange(normalized);
    }
  };

  return (
    <div className="relative flex w-full">
      <input
        value={isEditing ? draft : value}
        aria-label={ariaLabel}
        onFocus={() => {
          setDraft(value);
          setIsEditing(true);
        }}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onBlur={() => {
          commitDraft();
          setIsEditing(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        placeholder="#0a0a0a"
        spellCheck={false}
        disabled={disabled}
        className="h-9 w-full rounded-xl border border-black/10 bg-slate-50 px-3 pr-11 text-xs font-semibold text-slate-700 uppercase transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center rounded-r-xl px-2">
        <span
          className="size-4 rounded-md border border-black/10 shadow-sm"
          style={{ backgroundColor: value }}
        />
      </div>
      <input
        type="color"
        value={value}
        aria-label={`${ariaLabel} color picker`}
        disabled={disabled}
        onChange={(event) => {
          const nextColor = event.currentTarget.value.toLowerCase();
          setDraft(nextColor);
          onChange(nextColor);
        }}
        className="absolute inset-y-0 right-0 w-10 cursor-pointer opacity-0 disabled:pointer-events-none"
      />
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  ariaLabel,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder={placeholder}
      spellCheck={false}
      disabled={disabled}
      className="h-9 w-full rounded-xl border border-black/10 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
    />
  );
}

export function NumberInput({
  value,
  onChange,
  ariaLabel,
  placeholder,
  disabled = false,
  step,
}: {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  step?: number;
}) {
  const [draft, setDraft] = useState(String(value));
  const [isEditing, setIsEditing] = useState(false);

  const commitDraft = () => {
    const next = Number(draft);
    if (!Number.isFinite(next)) {
      setDraft(String(value));
      return;
    }

    onChange(next);
    setDraft(String(next));
  };

  return (
    <input
      value={isEditing ? draft : String(value)}
      type="number"
      step={step}
      aria-label={ariaLabel}
      onFocus={() => setIsEditing(true)}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={() => {
        commitDraft();
        setIsEditing(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      placeholder={placeholder}
      spellCheck={false}
      disabled={disabled}
      className="h-9 w-full rounded-xl border border-black/10 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
    />
  );
}

export function TextareaInput({
  value,
  onChange,
  ariaLabel,
  placeholder,
  minHeightClassName = "min-h-36",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  minHeightClassName?: string;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder={placeholder}
      spellCheck={false}
      disabled={disabled}
      className={`${minHeightClassName} w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40`}
    />
  );
}

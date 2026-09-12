"use client";

import { useState } from "react";

import { getAirportInfo } from "@/registry/flight-airports-utils";

export function AirportCodeInput({
  value,
  onChange,
  blockedCodes = [],
  ariaLabel,
  className = "",
  onValidityChange,
}: {
  value: string;
  onChange: (code: string) => void;
  blockedCodes?: readonly string[];
  ariaLabel: string;
  className?: string;
  onValidityChange?: (error: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  const [lastValue, setLastValue] = useState(value);

  // Sync the local draft when the committed value changes externally (swap).
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
    setError("");
  }

  const report = (nextError: string) => {
    setError(nextError);
    onValidityChange?.(nextError);
  };

  function handleChange(rawValue: string) {
    const code = rawValue.trim().toUpperCase();
    setDraft(code);

    if (code.length < 3) {
      report("");
      return;
    }
    if (!getAirportInfo(code)) {
      report("Unknown code");
      return;
    }
    if (blockedCodes.includes(code)) {
      report("Already used");
      return;
    }
    report("");
    if (code !== value) onChange(code);
  }

  return (
    <input
      value={draft}
      aria-label={ariaLabel}
      onChange={(event) => handleChange(event.currentTarget.value)}
      onBlur={() => {
        if (error || draft.length < 3) {
          setDraft(value);
          report("");
        }
      }}
      maxLength={3}
      autoComplete="off"
      spellCheck={false}
      aria-invalid={!!error}
      className={`block rounded-lg border bg-slate-50 px-2.5 py-1.5 font-mono text-sm text-slate-950 uppercase transition-colors ${
        error
          ? "border-red-300 bg-red-50"
          : "border-slate-200 hover:bg-slate-100"
      } ${className}`}
    />
  );
}

/** Labeled airport input with the resolved city (or an error) underneath. */
export function AirportField({
  label,
  value,
  onChange,
  blockedCodes = [],
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  blockedCodes?: readonly string[];
}) {
  const [error, setError] = useState("");
  const info = getAirportInfo(value);

  return (
    <div className="min-w-0 flex-1 text-[11px] font-medium text-slate-500">
      <span>{label}</span>
      <AirportCodeInput
        value={value}
        onChange={onChange}
        blockedCodes={blockedCodes}
        ariaLabel={`${label} airport code`}
        className="mt-1 w-full"
        onValidityChange={setError}
      />
      <span
        className={`mt-1 block truncate text-[10px] font-normal ${
          error ? "text-red-600" : "text-slate-400"
        }`}
      >
        {error || info?.city || " "}
      </span>
    </div>
  );
}

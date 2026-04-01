"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

import { type AirportInfo } from "@/registry/flight-airports";

export function CopyableAirportMarker({ airport }: { airport: AirportInfo }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep marker tooltip above adjacent markers.
  useEffect(() => {
    const markerEl = ref.current?.closest(
      ".maplibregl-marker",
    ) as HTMLElement | null;

    if (markerEl) {
      markerEl.style.zIndex = hovered || copied ? "1000" : "";
    }
  }, [hovered, copied]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (!window.isSecureContext || !navigator.clipboard?.writeText) {
      console.warn("Clipboard API is unavailable in this context");
      return;
    }

    try {
      await navigator.clipboard.writeText(airport.code);
      setCopied(true);

      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }

      copiedTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copiedTimeoutRef.current = null;
      }, 1500);
    } catch (error) {
      console.warn("Failed to copy airport code", error);
    }
  }, [airport.code]);

  return (
    <div
      ref={ref}
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="size-2 cursor-pointer rounded-full bg-black"
        onClick={handleCopy}
        aria-label={`Copy ${airport.code} airport code`}
        title={`Copy ${airport.code}`}
      />

      {copied ? (
        <div className="bg-foreground text-background absolute bottom-full left-1/2 z-50 mb-2 flex -translate-x-1/2 items-center gap-1 rounded-md px-2 py-1 text-xs whitespace-nowrap shadow-md">
          <Check className="size-3" />
          Copied {airport.code}
        </div>
      ) : (
        <div className="bg-popover text-popover-foreground invisible absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md border px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md group-hover:visible">
          <p className="font-semibold">{airport.name}</p>
          <p className="text-muted-foreground">
            {airport.city}, {airport.country}
          </p>
          <p className="text-muted-foreground mt-0.5 text-[10px]">
            Click to copy code
          </p>
        </div>
      )}
    </div>
  );
}

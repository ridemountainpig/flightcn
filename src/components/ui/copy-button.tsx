"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  label = "Copy code",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2200);
  }

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={() => void copy()}
        className={cn(
          "pressable copy-button inline-flex size-10 items-center justify-center rounded-lg",
          className,
        )}
        aria-label={status === "copied" ? "Copied" : label}
        data-copied={status === "copied"}
      >
        <span className="copy-glyph" aria-hidden="true">
          <Copy size={16} />
          <Check size={16} />
        </span>
      </button>
      <span
        role="status"
        className={
          status === "error"
            ? "absolute right-0 bottom-full z-20 mb-2 w-56 rounded-lg border border-red-200 bg-white p-3 text-xs text-red-700 shadow-sm"
            : "sr-only"
        }
      >
        {status === "copied"
          ? "Copied to clipboard"
          : status === "error"
            ? "Copy failed. Select the text to copy manually."
            : ""}
      </span>
    </span>
  );
}

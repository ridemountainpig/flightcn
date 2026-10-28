"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Copies a share link built on demand — the playground URL itself stays clean,
 * so the encoded state only exists in links the user explicitly copies.
 */
export function ShareLinkButton({
  getUrl,
  title,
  label = "Share",
  disabled = false,
  className,
}: {
  getUrl: () => string;
  title: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={() => {
        const show = (next: "copied" | "failed") => {
          setStatus(next);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setStatus("idle"), 2200);
        };
        // Some in-app browsers have no clipboard API, or refuse the write.
        if (!navigator.clipboard) return show("failed");
        navigator.clipboard.writeText(getUrl()).then(
          () => show("copied"),
          () => show("failed"),
        );
      }}
      className={cn(
        "pressable inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {status === "copied" ? (
        <Check size={12} className="pop-in" />
      ) : (
        <Link2 size={12} />
      )}
      {status === "copied"
        ? "Link copied"
        : status === "failed"
          ? "Couldn't copy"
          : label}
    </button>
  );
}

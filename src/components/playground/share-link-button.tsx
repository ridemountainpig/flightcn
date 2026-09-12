"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2 } from "lucide-react";

/**
 * Copies a share link built on demand — the playground URL itself stays clean,
 * so the encoded state only exists in links the user explicitly copies.
 */
export function ShareLinkButton({
  getUrl,
  title,
}: {
  getUrl: () => string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
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
      onClick={() => {
        void navigator.clipboard
          .writeText(getUrl())
          .then(() => {
            setCopied(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 2200);
          })
          .catch(() => {});
      }}
      className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-slate-600 hover:bg-slate-100"
    >
      {copied ? <Check size={12} className="pop-in" /> : <Link2 size={12} />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

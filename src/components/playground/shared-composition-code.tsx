"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { CopyButton } from "@/components/ui/copy-button";
import { ShikiCodeBlock } from "@/components/ui/shiki-code-block";
import { cn } from "@/lib/utils";

/** Collapsed code block for the shared view — the map stays the hero. */
export function SharedCompositionCode({ snippet }: { snippet: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 self-stretch text-left"
        >
          <ChevronDown
            size={13}
            aria-hidden="true"
            className={cn(
              "collapse-chevron shrink-0 text-slate-400",
              open ? "rotate-180" : "",
            )}
          />
          <span className="font-mono text-[10px] tracking-widest text-slate-500">
            VIEW CODE
          </span>
        </button>
        <CopyButton
          text={snippet}
          label="Copy generated code"
          className="size-8 text-slate-500 hover:bg-slate-100"
        />
      </div>
      {open ? (
        <div className="scrollbar-none max-h-[420px] overflow-auto border-t border-slate-100 bg-slate-50 p-4">
          <ShikiCodeBlock code={snippet} theme="github-light" />
        </div>
      ) : null}
    </div>
  );
}

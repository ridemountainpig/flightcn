"use client";

import { useEffect, useState } from "react";

import { CopyButton } from "@/components/ui/copy-button";
import { ShikiCodeBlock } from "@/components/ui/shiki-code-block";
import { DocsMapMountWhenVisible } from "@/components/docs/docs-map-mount-when-visible";
import { InstallCommandCopy } from "@/components/home/install-command-copy";
import { buildInstallCommand } from "@/lib/package-manager";
import type { BlockConfig } from "@/components/blocks/blocks-config";
import { cn } from "@/lib/utils";

const TABS = ["Preview", "Code"] as const;
type Tab = (typeof TABS)[number];

export function BlockCard({ block }: { block: BlockConfig }) {
  const [tab, setTab] = useState<Tab>("Preview");
  // Fetched on the first switch to the Code tab from the block's static
  // registry item (/r/<id>.json) instead of being embedded in the page
  // payload — the eleven blocks total ~90KB of source.
  const [source, setSource] = useState<string | null>(null);
  const BlockComponent = block.component;

  useEffect(() => {
    if (tab !== "Code" || source !== null) return;
    let cancelled = false;
    fetch(`/r/${block.id}.json`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((registryItem) => {
        if (cancelled) return;
        setSource(registryItem.files?.[0]?.content ?? "");
      })
      .catch(() => {
        if (cancelled) return;
        setSource(
          `// Couldn't load the source — install it instead:\n// ${buildInstallCommand("npm", block.installItem)}`,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [tab, source, block.id, block.installItem]);

  return (
    <section
      id={block.id}
      aria-label={block.title}
      className="min-w-0 scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="section-kicker">{block.category} block</p>
          <h2 className="mt-3 font-mono text-xl font-medium tracking-tight text-slate-950 sm:text-2xl">
            {block.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {block.description}
          </p>
        </div>
        <div
          role="group"
          aria-label={`${block.title} view`}
          className="flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
        >
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              aria-pressed={tab === name}
              className={cn(
                "pressable rounded-md px-3.5 py-1.5 text-xs font-medium",
                tab === name
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:text-slate-950",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* On phones the preview, code, and install rows bleed 8px into the
          card padding so the maps get more usable width. */}
      <div className="-mx-2 mt-4 sm:mx-0">
        {/* While the Code tab is open (or the block scrolls far away) the
            map unmounts via DocsMapMountWhenVisible, releasing its WebGL
            context — browsers cap live contexts per page. */}
        <div hidden={tab !== "Preview"}>
          <DocsMapMountWhenVisible placeholderClassName="flex min-h-[480px] w-full items-center justify-center rounded-2xl bg-[#d9d8d6] text-sm text-slate-500">
            <BlockComponent />
          </DocsMapMountWhenVisible>
        </div>
        <div hidden={tab !== "Code"}>
          <div className="overflow-hidden rounded-2xl bg-slate-950 text-slate-100">
            <div className="flex items-center justify-between border-b border-white/10 px-4 font-mono text-[10px] text-slate-300">
              <span>SOURCE · TSX</span>
              <CopyButton
                key={source}
                text={source ?? ""}
                label={`Copy ${block.title} source`}
                className="hover:bg-white/10"
              />
            </div>
            <div className="custom-scrollbar max-h-[560px] max-w-full overflow-auto px-4 py-4 text-xs leading-6">
              {source === null ? (
                <p className="py-8 text-center font-mono text-[10px] tracking-widest text-slate-400">
                  LOADING SOURCE…
                </p>
              ) : (
                <ShikiCodeBlock code={source} />
              )}
            </div>
          </div>
        </div>
      </div>

      <InstallCommandCopy
        item={block.installItem}
        className="-mx-2 mt-4 bg-slate-50 sm:mx-0"
      />
    </section>
  );
}

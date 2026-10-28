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
type SourceFile = { name: string; content: string };
type RegistryFile = { path?: string; target?: string; content?: string };

export function BlockCard({ block }: { block: BlockConfig }) {
  const [tab, setTab] = useState<Tab>("Preview");
  // Fetched on the first switch to the Code tab from the block's static
  // registry item (/r/<id>.json) instead of being embedded in the page
  // payload — the blocks total ~100KB of source.
  const [files, setFiles] = useState<SourceFile[] | null>(null);
  const [activeFile, setActiveFile] = useState(0);
  const source = files ? (files[activeFile]?.content ?? "") : null;
  const BlockComponent = block.component;

  useEffect(() => {
    if (tab !== "Code" || files !== null) return;
    let cancelled = false;
    fetch(`/r/${block.id}.json`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((registryItem: { files?: RegistryFile[] }) => {
        if (cancelled) return;
        const loaded = (registryItem.files ?? []).map((file) => ({
          name: (file.target ?? file.path ?? "").split("/").pop() || "",
          content: file.content ?? "",
        }));
        setFiles(loaded.length > 0 ? loaded : [{ name: "", content: "" }]);
      })
      .catch(() => {
        if (cancelled) return;
        setFiles([
          {
            name: "",
            content: `// Couldn't load the source — install it instead:\n// ${buildInstallCommand("npm", block.installItem)}`,
          },
        ]);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, files, block.id, block.installItem]);

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
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 font-mono text-[10px] text-slate-300">
              {files && files.length > 1 ? (
                <div
                  role="group"
                  aria-label={`${block.title} files`}
                  className="-ml-2 flex min-w-0 gap-1 overflow-x-auto"
                >
                  {files.map((file, index) => (
                    <button
                      key={file.name}
                      type="button"
                      onClick={() => setActiveFile(index)}
                      aria-pressed={activeFile === index}
                      className={cn(
                        "pressable shrink-0 rounded-md px-2 py-1.5",
                        activeFile === index
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:text-slate-200",
                      )}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
              ) : (
                <span>SOURCE · TSX</span>
              )}
              <CopyButton
                key={`${activeFile}:${source}`}
                text={source ?? ""}
                label={`Copy ${files?.[activeFile]?.name || block.title} source`}
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

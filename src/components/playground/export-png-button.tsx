"use client";

import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { ImageDown } from "lucide-react";

export function ExportPngButton({
  targetRef,
}: {
  targetRef: RefObject<HTMLDivElement | null>;
}) {
  const [status, setStatus] = useState<"idle" | "busy" | "error">("idle");

  const exportPng = async () => {
    const el = targetRef.current;
    if (!el || status === "busy") return;
    setStatus("busy");
    try {
      const dataUrl = await toPng(el, {
        pixelRatio: 2,
        // Drop the on-map zoom controls; keep the map attribution.
        filter: (node) =>
          !(
            node instanceof HTMLElement &&
            node.classList.contains("export-hide")
          ),
      });
      const link = document.createElement("a");
      link.download = "flightcn-playground.png";
      link.href = dataUrl;
      link.click();
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <button
      type="button"
      title="Download the current map as a PNG image"
      onClick={() => void exportPng()}
      disabled={status === "busy"}
      className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-slate-600 hover:bg-slate-100 disabled:opacity-60"
    >
      <ImageDown size={12} aria-hidden="true" />
      {status === "busy"
        ? "Exporting…"
        : status === "error"
          ? "Export failed"
          : "Export PNG"}
    </button>
  );
}

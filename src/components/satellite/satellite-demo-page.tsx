"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { ArrowUpRight, Layers, Satellite, Terminal } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { CopyButton } from "@/components/ui/copy-button";
import { ShikiCodeBlock } from "@/components/ui/shiki-code-block";
import { Map } from "@/components/ui/map";
import { satelliteInstallItem } from "@/components/home/home-config";
import { buildInstallCommand, usePackageManager } from "@/lib/package-manager";
import { ExportPngButton } from "@/components/playground/export-png-button";
import { SharedCompositionCode } from "@/components/playground/shared-composition-code";
import {
  PLAYGROUND_HREFS,
  ProductSwitcherLinks,
} from "@/components/product-switcher";
import {
  buildSatelliteOrbitProps,
  buildSatelliteOrbitSnippet,
  DEFAULT_SATELLITE_ORBIT_PLAYGROUND,
  SatelliteOrbitControls,
  type SatelliteOrbitPlayground,
} from "@/components/satellite/satellite-orbit-playground-controls";
import {
  decodeSatellitePlaygroundState,
  encodeSatellitePlaygroundState,
} from "@/components/satellite/satellite-playground-share";
import { SatelliteOrbit } from "@/registry/satellite-orbit";

export function SatelliteDemoPage() {
  const [packageManager] = usePackageManager();
  const satelliteInstallCommand = buildInstallCommand(
    packageManager,
    satelliteInstallItem,
  );
  const [playground, setPlayground] = useState<SatelliteOrbitPlayground>(
    DEFAULT_SATELLITE_ORBIT_PLAYGROUND,
  );
  const [viewMode, setViewMode] = useState(false);
  const mapPreviewRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useReducedMotion();
  const snippet = useMemo(
    () => buildSatelliteOrbitSnippet(playground),
    [playground],
  );
  const resetPlayground = useCallback(
    () => setPlayground(DEFAULT_SATELLITE_ORBIT_PLAYGROUND),
    [],
  );

  // Restore shared state from ?s= (and ?view=1) once on mount (client only) —
  // the same mechanics as the flight playground.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("s");
    const sharedView = params.get("view") === "1";
    const decoded = encoded ? decodeSatellitePlaygroundState(encoded) : null;
    if (!decoded && !sharedView) return;
    queueMicrotask(() => {
      if (decoded) setPlayground(decoded);
      if (sharedView) {
        setViewMode(true);
      } else {
        // Editor links restore into memory, then the URL goes back to clean —
        // a stale ?s= would otherwise misrepresent the live configuration.
        const url = new URL(window.location.href);
        url.search = "";
        window.history.replaceState(null, "", url);
      }
    });
  }, []);

  // Share links open the view-only page; state only lands in a URL the user
  // explicitly copies, so the address bar stays clean while editing.
  const getShareUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("s", encodeSatellitePlaygroundState(playground));
    url.searchParams.set("view", "1");
    return url.toString();
  }, [playground]);

  const exitViewMode = () => {
    setViewMode(false);
    // The restored configuration lives in memory; the editor URL stays clean.
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState(null, "", url);
  };

  const mapPreview = (
    <div
      ref={mapPreviewRef}
      className={
        viewMode
          ? "h-[68dvh] min-h-[460px] overflow-hidden rounded-xl border border-slate-200"
          : "h-[55dvh] min-h-[420px] overflow-hidden rounded-xl border border-slate-200"
      }
    >
      <Map
        className="h-full w-full"
        projection={{ type: "globe" }}
        center={[8, 16]}
        zoom={1.05}
        // Keeps the WebGL buffer readable so Export PNG can capture the map.
        canvasContextAttributes={{ preserveDrawingBuffer: true }}
      >
        <SatelliteOrbit
          {...buildSatelliteOrbitProps({
            ...playground,
            animate: playground.animate && !reducedMotion,
          })}
        />
      </Map>
    </div>
  );

  if (viewMode) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-dvh bg-[#fafaf8]">
        <div className="site-shell flex flex-col gap-4">
          <AppHeader
            title="Satellite playground"
            subtitle="Shared satellite visualization"
          />
          <div
            id="page-content"
            tabIndex={-1}
            className="flex flex-wrap items-end justify-between gap-4 py-6"
          >
            <div>
              <p className="section-kicker mb-3">Shared composition</p>
              <h1 className="section-title text-slate-950">
                A satellite orbit built with flightcn.
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600">
                {playground.showLabel && playground.name
                  ? `Composed from SatelliteOrbit — tracking ${playground.name}.`
                  : "Composed from SatelliteOrbit."}
              </p>
            </div>
            <button
              type="button"
              onClick={exitViewMode}
              className="pressable inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Layers size={14} aria-hidden="true" /> Open in editor
            </button>
          </div>
          {mapPreview}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
                <Satellite size={13} aria-hidden="true" /> BUILT WITH FLIGHTCN
              </span>
              <ExportPngButton targetRef={mapPreviewRef} />
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <code className="scrollbar-none min-w-0 overflow-x-auto font-mono text-xs whitespace-nowrap text-slate-600">
                {satelliteInstallCommand}
              </code>
              <CopyButton
                text={satelliteInstallCommand}
                label="Copy install command"
                className="size-8 text-slate-500 hover:bg-slate-100"
              />
            </span>
          </div>
          <SharedCompositionCode snippet={snippet} />
          <AppFooter />
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#fafaf8]">
      <div className="site-shell flex flex-col gap-4">
        <AppHeader
          title="Satellite playground"
          subtitle="Explore orbital visualizations"
        />
        <div
          id="page-content"
          tabIndex={-1}
          className="flex flex-wrap items-end justify-between gap-4 py-6"
        >
          <div>
            <p className="section-kicker mb-3">Orbital playground</p>
            <h1 className="section-title text-slate-950">
              Satellite orbit playground.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-600">
              Tune inclination, animation, labels, and styling on a live globe —
              then copy the composed code.
            </p>
            <div className="mt-5">
              <ProductSwitcherLinks
                value="satellite"
                hrefs={PLAYGROUND_HREFS}
                size="sm"
              />
            </div>
            <Link
              href="/docs/satellite"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-800"
            >
              Read the SatelliteOrbit docs
              <ArrowUpRight
                size={14}
                className="link-arrow"
                aria-hidden="true"
              />
            </Link>
          </div>
          <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
            <Satellite size={13} aria-hidden="true" /> LIVE PREVIEW
          </span>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-1">
            {mapPreview}

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-2.5">
                <span className="font-mono text-[10px] tracking-widest text-slate-400">
                  GENERATED CODE
                </span>
                <CopyButton
                  text={snippet}
                  label="Copy generated code"
                  className="size-8 text-slate-300 hover:bg-white/10"
                />
              </div>
              <div className="scrollbar-none max-h-[420px] overflow-auto p-4">
                <ShikiCodeBlock code={snippet} />
              </div>
              <div className="flex items-center gap-3 border-t border-slate-800 bg-slate-900/60 px-4 py-2.5">
                <Terminal
                  size={13}
                  className="shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <code className="scrollbar-none min-w-0 flex-1 overflow-x-auto font-mono text-xs whitespace-nowrap text-orange-200">
                  {satelliteInstallCommand}
                </code>
                <CopyButton
                  text={satelliteInstallCommand}
                  label="Copy install command"
                  className="size-8 text-slate-300 hover:bg-white/10"
                />
              </div>
            </div>
          </div>

          <SatelliteOrbitControls
            value={playground}
            onChange={setPlayground}
            onReset={resetPlayground}
            getShareUrl={getShareUrl}
          />
        </div>
        <AppFooter />
      </div>
    </main>
  );
}

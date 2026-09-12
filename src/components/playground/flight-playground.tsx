"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { LngLatBounds, type MapMouseEvent } from "maplibre-gl";
import {
  ArrowUpRight,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Plane,
  Plus,
  RotateCcw,
  Sparkles,
  Terminal,
  Trash2,
} from "lucide-react";
import { DropdownMenu } from "radix-ui";

import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { CopyButton } from "@/components/ui/copy-button";
import { ShikiCodeBlock } from "@/components/ui/shiki-code-block";
import { Map, MapControls, useMap } from "@/components/ui/map";
import { flightInstallItem, mapStyles } from "@/components/home/home-config";
import { buildInstallCommand, usePackageManager } from "@/lib/package-manager";
import { SingleWorldZoomLimit } from "@/registry/flight";
import {
  PLAYGROUND_HREFS,
  ProductSwitcherLinks,
} from "@/components/product-switcher";
import { cn } from "@/lib/utils";

import { ControlSection, SegmentedRow } from "./playground-inputs";
import {
  createLayer,
  duplicateLayer,
  LayerControls,
  layerBoundsPoints,
  layerName,
  layerSummary,
  LAYER_PALETTE,
  renderLayer,
  type PlaygroundLayer,
} from "./playground-layers";
import {
  PLAYGROUND_PRESETS,
  type PlaygroundPreset,
} from "./playground-presets";
import {
  buildPlaygroundSnippet,
  decodePlaygroundState,
  DEFAULT_MAP_CONFIG,
  encodePlaygroundState,
  type PlaygroundMapConfig,
} from "./playground-share";
import { ExportPngButton } from "./export-png-button";
import { ShareLinkButton } from "./share-link-button";
import { SharedCompositionCode } from "./shared-composition-code";

const INITIAL_LAYER: PlaygroundLayer = {
  id: "layer-initial-route",
  type: "flight-route",
  visible: true,
  props: {
    from: "TPE",
    to: "HND",
    tripType: "one-way",
    showAirports: true,
    showLabel: true,
    aircraftMode: "animated",
    duration: 6000,
    progress: 0.6,
    iconSize: 24,
    width: 2,
    opacity: 0.7,
    lineStyle: "solid",
    color: "",
  },
};

/** Fit the camera to every visible layer whenever their geometry changes. */
function LayersFitCamera({
  points,
  frozen = false,
}: {
  points: [number, number][];
  /** Suspends refitting (e.g. while the user is drawing on the map). */
  frozen?: boolean;
}) {
  const { map, isLoaded } = useMap();
  const pointsKey = JSON.stringify(points);
  useEffect(() => {
    if (!map || !isLoaded || frozen || points.length === 0) return;
    const bounds = new LngLatBounds();
    for (const point of points) {
      bounds.extend(point);
    }
    const fitLayers = () => {
      map.fitBounds(bounds, {
        padding: 80,
        maxZoom: 5,
        duration: 0,
      });
    };
    fitLayers();
    map.on("resize", fitLayers);
    return () => {
      map.off("resize", fitLayers);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, frozen, pointsKey]);
  return null;
}

/** Captures map clicks as trail waypoints while a trail layer is drawing. */
function TrailDrawCapture({
  onAddPoint,
}: {
  onAddPoint: (point: [number, number]) => void;
}) {
  const { map, isLoaded } = useMap();
  const onAddPointRef = useRef(onAddPoint);
  useEffect(() => {
    onAddPointRef.current = onAddPoint;
  });

  useEffect(() => {
    if (!map || !isLoaded) return;
    const handleClick = (event: MapMouseEvent) => {
      onAddPointRef.current([event.lngLat.lng, event.lngLat.lat]);
    };
    map.on("click", handleClick);
    const canvas = map.getCanvas();
    const previousCursor = canvas.style.cursor;
    canvas.style.cursor = "crosshair";
    return () => {
      map.off("click", handleClick);
      canvas.style.cursor = previousCursor;
    };
  }, [map, isLoaded]);
  return null;
}

function AddLayerMenu({ onAdd }: { onAdd: (layer: PlaygroundLayer) => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white hover:bg-slate-800"
        >
          <Plus size={13} /> Add component
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          collisionPadding={16}
          className="nav-popover z-[1300] max-h-[60vh] w-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
        >
          {LAYER_PALETTE.map((entry) => (
            <DropdownMenu.Item key={entry.type} asChild>
              <button
                type="button"
                onClick={() => onAdd(createLayer(entry.type))}
                className="w-full rounded-xl px-3 py-2 text-left focus:outline-none data-[highlighted]:bg-slate-50"
              >
                <span className="block font-mono text-xs font-semibold text-slate-900">
                  {entry.name}
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                  {entry.description}
                </span>
              </button>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function PresetMenu({
  onApply,
}: {
  onApply: (preset: PlaygroundPreset) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          title="Load a ready-made composition"
          className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <Sparkles size={12} aria-hidden="true" /> Presets
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          collisionPadding={16}
          className="nav-popover z-[1300] w-72 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
        >
          {PLAYGROUND_PRESETS.map((preset) => (
            <DropdownMenu.Item key={preset.id} asChild>
              <button
                type="button"
                onClick={() => onApply(preset)}
                className="w-full rounded-xl px-3 py-2 text-left focus:outline-none data-[highlighted]:bg-slate-50"
              >
                <span className="block font-mono text-xs font-semibold text-slate-900">
                  {preset.name}
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                  {preset.description}
                </span>
              </button>
            </DropdownMenu.Item>
          ))}
          <p className="border-t border-slate-100 px-3 pt-2 pb-1.5 text-[10px] leading-4 text-slate-400">
            Loading a preset replaces the current layers.
          </p>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function LayerRow({
  layer,
  expanded,
  onToggleExpanded,
  onChange,
  onToggleVisible,
  onDuplicate,
  onDelete,
}: {
  layer: PlaygroundLayer;
  expanded: boolean;
  onToggleExpanded: () => void;
  onChange: (layer: PlaygroundLayer) => void;
  onToggleVisible: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={layer}
      dragListener={false}
      dragControls={dragControls}
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="fade-rise flex items-center gap-1 py-1 pr-1 pl-1.5">
        <button
          type="button"
          aria-label={`Reorder ${layerName(layer.type)}`}
          onPointerDown={(event) => {
            event.preventDefault();
            dragControls.start(event);
          }}
          className="cursor-grab touch-none rounded-md p-1 text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1.5 text-left hover:bg-slate-50"
        >
          <span className="min-w-0">
            <span
              className={cn(
                "block truncate font-mono text-xs font-semibold transition-colors",
                layer.visible ? "text-slate-900" : "text-slate-400",
              )}
            >
              {layerName(layer.type)}
            </span>
            <span className="block truncate text-[10px] text-slate-400">
              {layerSummary(layer)}
            </span>
          </span>
        </button>
        <button
          type="button"
          aria-label={layer.visible ? "Hide layer" : "Show layer"}
          aria-pressed={!layer.visible}
          onClick={onToggleVisible}
          className="pressable rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
        <button
          type="button"
          aria-label="Duplicate layer"
          onClick={onDuplicate}
          className="pressable rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <Copy size={13} />
        </button>
        <button
          type="button"
          aria-label="Delete layer"
          onClick={onDelete}
          className="pressable rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={13} />
        </button>
        <button
          type="button"
          aria-label={expanded ? "Collapse controls" : "Expand controls"}
          onClick={onToggleExpanded}
          className="pressable rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <ChevronDown
            size={13}
            className={cn("collapse-chevron", expanded ? "rotate-180" : "")}
          />
        </button>
      </div>
      {expanded ? (
        <div className="fade-rise border-t border-slate-100 px-3 py-3">
          <LayerControls layer={layer} onChange={onChange} />
        </div>
      ) : null}
    </Reorder.Item>
  );
}

export function FlightPlaygroundPage() {
  const [packageManager] = usePackageManager();
  const flightInstallCommand = buildInstallCommand(
    packageManager,
    flightInstallItem,
  );
  const [layers, setLayers] = useState<PlaygroundLayer[]>([INITIAL_LAYER]);
  const [mapConfig, setMapConfig] =
    useState<PlaygroundMapConfig>(DEFAULT_MAP_CONFIG);
  const [expandedId, setExpandedId] = useState<string | null>(INITIAL_LAYER.id);
  const [viewMode, setViewMode] = useState(false);
  const mapPreviewRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Restore shared state from ?s= (and ?view=1) once on mount (client only).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("s");
    const sharedView = params.get("view") === "1";
    const decoded = encoded ? decodePlaygroundState(encoded) : null;
    if (!decoded && !sharedView) return;
    queueMicrotask(() => {
      if (decoded) {
        setLayers(decoded.layers);
        setMapConfig(decoded.mapConfig);
        setExpandedId(decoded.layers[0]?.id ?? null);
      }
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

  // The address bar stays clean — share links are built on demand by the
  // Share button, so state only lands in a URL the user explicitly copies.
  const buildShareUrl = (view: boolean) => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("s", encodePlaygroundState(layers, mapConfig));
    if (view) url.searchParams.set("view", "1");
    return url.toString();
  };

  const snippet = useMemo(
    () => buildPlaygroundSnippet(layers, mapConfig),
    [layers, mapConfig],
  );

  const boundsPoints = useMemo(
    () => layers.flatMap((layer) => layerBoundsPoints(layer)),
    [layers],
  );

  const renderContext = useMemo(
    () => ({
      allowMotion: !reducedMotion,
      isDarkMap: mapConfig.theme === "dark",
    }),
    [reducedMotion, mapConfig.theme],
  );

  const updateLayer = (next: PlaygroundLayer) => {
    setLayers((previous) =>
      previous.map((layer) => (layer.id === next.id ? next : layer)),
    );
  };

  const addLayer = (layer: PlaygroundLayer) => {
    setLayers((previous) => [...previous, layer]);
    setExpandedId(layer.id);
  };

  const resetPlayground = () => {
    const initial = structuredClone(INITIAL_LAYER);
    setLayers([initial]);
    setMapConfig(DEFAULT_MAP_CONFIG);
    setExpandedId(initial.id);
  };

  const applyPreset = (preset: PlaygroundPreset) => {
    const built = preset.build();
    setLayers(built.layers);
    setMapConfig(built.mapConfig);
    setExpandedId(built.layers[0]?.id ?? null);
  };

  const exitViewMode = () => {
    setViewMode(false);
    // The restored composition lives in memory; the editor URL stays clean.
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState(null, "", url);
  };

  const drawingLayer = viewMode
    ? undefined
    : layers.find(
        (layer) =>
          layer.type === "aircraft-trail" &&
          layer.visible &&
          layer.props.drawing,
      );

  const appendDrawnPoint = (point: [number, number]) => {
    setLayers((previous) =>
      previous.map((layer) =>
        layer.id === drawingLayer?.id && layer.type === "aircraft-trail"
          ? {
              ...layer,
              props: {
                ...layer.props,
                drawnPoints: [...layer.props.drawnPoints, point],
              },
            }
          : layer,
      ),
    );
  };

  const mapPreview = (
    <div
      ref={mapPreviewRef}
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100",
        viewMode ? "h-[68dvh] min-h-[460px]" : "h-[55dvh] min-h-[420px]",
      )}
      role="region"
      aria-label="Flight visualization preview map"
    >
      <Map
        className="h-full w-full"
        theme={mapConfig.theme}
        styles={mapStyles}
        projection={
          mapConfig.projection === "globe"
            ? { type: "globe" }
            : { type: "mercator" }
        }
        center={[130, 30]}
        zoom={3}
        renderWorldCopies
        // Keeps the WebGL buffer readable so Export PNG can capture the map.
        canvasContextAttributes={{ preserveDrawingBuffer: true }}
      >
        <MapControls className="export-hide" />
        <SingleWorldZoomLimit enabled={mapConfig.projection !== "globe"} />
        <LayersFitCamera points={boundsPoints} frozen={!!drawingLayer} />
        {drawingLayer ? (
          <TrailDrawCapture onAddPoint={appendDrawnPoint} />
        ) : null}
        {layers.map((layer) => (
          <Fragment key={layer.id}>
            {renderLayer(layer, renderContext)}
          </Fragment>
        ))}
      </Map>
    </div>
  );

  if (viewMode) {
    const visibleLayers = layers.filter((layer) => layer.visible);
    const componentNames = [
      ...new Set(visibleLayers.map((layer) => layerName(layer.type))),
    ];
    return (
      <main id="main-content" tabIndex={-1} className="min-h-dvh bg-[#fafaf8]">
        <div className="site-shell flex flex-col gap-4">
          <AppHeader
            title="Playground"
            subtitle="Shared flight visualization"
          />
          <div
            id="page-content"
            tabIndex={-1}
            className="flex flex-wrap items-end justify-between gap-4 py-6"
          >
            <div>
              <p className="section-kicker mb-3">Shared composition</p>
              <h1 className="section-title text-slate-950">
                A flight map built with flightcn.
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600">
                {componentNames.length > 0
                  ? `Composed from ${componentNames.join(", ")}.`
                  : "An empty canvas — open the editor to start composing."}
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
                <Plane size={13} aria-hidden="true" /> BUILT WITH FLIGHTCN
              </span>
              <ExportPngButton targetRef={mapPreviewRef} />
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <code className="scrollbar-none min-w-0 overflow-x-auto font-mono text-xs whitespace-nowrap text-slate-600">
                {flightInstallCommand}
              </code>
              <CopyButton
                text={flightInstallCommand}
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
    <main id="main-content" tabIndex={-1} className="min-h-dvh bg-[#fafaf8]">
      <div className="site-shell flex flex-col gap-4">
        <AppHeader
          title="Playground"
          subtitle="Compose flight visualizations"
        />
        <div
          id="page-content"
          tabIndex={-1}
          className="flex flex-wrap items-end justify-between gap-4 py-6"
        >
          <div>
            <p className="section-kicker mb-3">Compose, preview, copy</p>
            <h1 className="section-title text-slate-950">
              Flight visualization playground.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-600">
              Stack routes, trackers, networks, trails, and more on one map —
              reorder them, tune every prop, then copy the composed code or
              share the link.
            </p>
            <div className="mt-5">
              <ProductSwitcherLinks
                value="flight"
                hrefs={PLAYGROUND_HREFS}
                size="sm"
              />
            </div>
            <Link
              href="/blocks"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-800"
            >
              Prefer ready-made UI? Browse Blocks
              <ArrowUpRight
                size={14}
                className="link-arrow"
                aria-hidden="true"
              />
            </Link>
          </div>
          <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-500">
            <Plane size={13} aria-hidden="true" /> LIVE PREVIEW
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
                  {flightInstallCommand}
                </code>
                <CopyButton
                  text={flightInstallCommand}
                  label="Copy install command"
                  className="size-8 text-slate-300 hover:bg-white/10"
                />
              </div>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 lg:w-96 lg:shrink-0">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-widest text-slate-500 uppercase">
                  <Layers size={12} aria-hidden="true" /> Layers
                </p>
                <AddLayerMenu onAdd={addLayer} />
              </div>
              <div className="mb-3 grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-[repeat(4,minmax(max-content,1fr))] [&>button]:justify-center sm:[&>button]:px-1.5">
                <PresetMenu onApply={applyPreset} />
                <ExportPngButton targetRef={mapPreviewRef} />
                <button
                  type="button"
                  title="Reset the playground to its default state"
                  aria-label="Reset playground"
                  onClick={resetPlayground}
                  className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-slate-600 hover:bg-slate-100"
                >
                  <RotateCcw size={12} aria-hidden="true" />
                  Reset
                </button>
                <ShareLinkButton
                  getUrl={() => buildShareUrl(true)}
                  title="Copy a view-only link — the map without the editor panels"
                />
              </div>
              {layers.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                  No layers yet — add a component to start composing.
                </p>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={layers}
                  onReorder={setLayers}
                  className="space-y-2"
                >
                  {layers.map((layer) => (
                    <LayerRow
                      key={layer.id}
                      layer={layer}
                      expanded={expandedId === layer.id}
                      onToggleExpanded={() =>
                        setExpandedId((current) =>
                          current === layer.id ? null : layer.id,
                        )
                      }
                      onChange={updateLayer}
                      onToggleVisible={() =>
                        updateLayer({ ...layer, visible: !layer.visible })
                      }
                      onDuplicate={() => addLayer(duplicateLayer(layer))}
                      onDelete={() =>
                        setLayers((previous) =>
                          previous.filter(
                            (existing) => existing.id !== layer.id,
                          ),
                        )
                      }
                    />
                  ))}
                </Reorder.Group>
              )}
              <p className="mt-2.5 text-[10px] leading-4 text-slate-400">
                Drag the handle to reorder — the generated code follows the
                layer order.
              </p>
            </div>

            <ControlSection title="Map">
              <SegmentedRow
                label="Projection"
                value={mapConfig.projection}
                options={["mercator", "globe"]}
                onChange={(projection) =>
                  setMapConfig((previous) => ({ ...previous, projection }))
                }
              />
              <SegmentedRow
                label="Theme"
                value={mapConfig.theme}
                options={["light", "dark"]}
                onChange={(theme) =>
                  setMapConfig((previous) => ({ ...previous, theme }))
                }
              />
            </ControlSection>
          </div>
        </div>
        <AppFooter />
      </div>
    </main>
  );
}

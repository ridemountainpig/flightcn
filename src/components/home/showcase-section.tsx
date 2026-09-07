"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useReducedMotion } from "framer-motion";
import { Play, Square } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { ShikiCodeBlock } from "@/components/ui/shiki-code-block";
import { Map } from "@/components/ui/map";
import {
  AircraftTrail,
  FlightFlow,
  FlightAirport,
  FlightMultiRoute,
  FlightNetwork,
  FlightRange,
  FlightRoute,
  FlightRouteLabel,
  FlightRoutes,
  FlightTracker,
} from "@/registry/flight";
import { SatelliteOrbit, SatelliteOrbits } from "@/registry/satellite-orbit";
import {
  examplesByProduct,
  mapStyles,
  routeExamples,
  showcaseCopy,
  type ExampleConfig,
  type ExampleId,
} from "@/components/home/home-config";
import type { ProductKey } from "@/components/product-switcher";
import { useResponsiveZoom } from "@/lib/map-responsive-zoom";

const CUSTOM_SATELLITE_SVG_PATHS = {
  asteroid: "/showcase/asteroid.svg",
  iss: "/showcase/international-space-station.svg",
} as const;

const NETWORK_ROUTES = [
  { from: "TPE", to: "HND", value: 18 },
  { from: "TPE", to: "SIN", value: 11 },
  { from: "TPE", to: "BKK", value: 8 },
  { from: "TPE", to: "HKG", value: 14 },
] as const;

const TRAIL_POSITIONS = [
  { longitude: 139.78, latitude: 35.55, altitude: 200 },
  { longitude: 138.7, latitude: 34.72, altitude: 7200 },
  { longitude: 137.2, latitude: 33.85, altitude: 14800 },
  { longitude: 135.4, latitude: 32.95, altitude: 23600 },
  { longitude: 133.5, latitude: 32.08, altitude: 31800 },
  { longitude: 131.5, latitude: 31.2, altitude: 37000 },
  { longitude: 129.5, latitude: 30.25, altitude: 39000 },
  { longitude: 128.6, latitude: 29.55, altitude: 38500 },
  { longitude: 127.95, latitude: 28.85, altitude: 35000 },
  { longitude: 127.45, latitude: 28.15, altitude: 31000 },
  { longitude: 126.9, latitude: 27.45, altitude: 27000 },
] as const;

const TRAIL_ALTITUDE_COLOR_STOPS = [
  { altitude: 0, color: "#22c55e" },
  { altitude: 10000, color: "#06b6d4" },
  { altitude: 24000, color: "#2563eb" },
  { altitude: 39000, color: "#7c3aed" },
] as const;

const FLOW_ROUTES = [
  { from: "HND", to: "TPE", value: 14 },
  { from: "ICN", to: "TPE", value: 8 },
  { from: "HKG", to: "TPE", value: 11 },
  { from: "BKK", to: "TPE", value: 7 },
  { from: "MNL", to: "TPE", value: 6 },
] as const;

function CustomSatellitePairExample({ animated }: { animated: boolean }) {
  const [svgIcons, setSvgIcons] = useState<{
    asteroid?: string;
    iss?: string;
  }>({});

  useEffect(() => {
    let isCancelled = false;

    async function loadSvgIcons() {
      try {
        const [asteroid, iss] = await Promise.all([
          fetch(CUSTOM_SATELLITE_SVG_PATHS.asteroid).then((response) =>
            response.text(),
          ),
          fetch(CUSTOM_SATELLITE_SVG_PATHS.iss).then((response) =>
            response.text(),
          ),
        ]);

        if (!isCancelled) {
          setSvgIcons({ asteroid, iss });
        }
      } catch {
        if (!isCancelled) {
          setSvgIcons({});
        }
      }
    }

    void loadSvgIcons();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <>
      <SatelliteOrbit
        inclination={46}
        ascendingNode={10}
        name="ISS"
        showLabel
        labelPosition="right"
        animate={animated ? { duration: 8000 } : false}
        satelliteIconSvg={svgIcons.iss}
        satelliteIconRotationOffset={-90}
      />
      <SatelliteOrbit
        inclination={-18}
        ascendingNode={116}
        name="Asteroid"
        showLabel
        labelPosition="left"
        animate={animated ? { duration: 10000 } : false}
        satelliteIconSvg={svgIcons.asteroid}
      />
    </>
  );
}

function renderExample(exampleId: ExampleId, animated: boolean): ReactNode {
  switch (exampleId) {
    case "airport-dot":
      return (
        <>
          <FlightAirport code="TPE" showLabel />
          <FlightAirport code="HND" showLabel />
          <FlightAirport code="ICN" showLabel />
        </>
      );
    case "flight-route":
      return <FlightRoute from="JFK" to="LHR" showAirports showLabel />;
    case "route-hover":
      return (
        <FlightRoute
          from="TPE"
          to="HND"
          showAirports
          showLabel
          hoverEffect
          tripType="round-trip"
        />
      );
    case "flight-routes":
      return <FlightRoutes routes={routeExamples} showAirports showLabel />;
    case "multiple-leg":
      return (
        <FlightMultiRoute
          waypoints={["TPE", "DXB", "ZRH", "JFK"]}
          showAirports
          showLabel
        />
      );
    case "animation":
      return (
        <>
          <FlightRoute
            from="NRT"
            to="TPE"
            showAirports
            showLabel
            tripType="round-trip"
            animate={animated ? { duration: 5000 } : false}
          />
          <FlightRoute
            from="TPE"
            to="DXB"
            showAirports
            showLabel
            tripType="one-way"
            animate={animated ? { duration: 8000 } : false}
          />
        </>
      );
    case "globe":
      return <FlightRoute from="CDG" to="SYD" showAirports showLabel />;
    case "flight-tracker":
      return (
        <FlightTracker
          from="TPE"
          to="LHR"
          progress={0.58}
          altitude={36000}
          speed={486}
        >
          <span className="flex items-center gap-2">
            <span>CI 081</span>
            <span className="text-emerald-600">En route</span>
          </span>
        </FlightTracker>
      );
    case "flight-route-label":
      return (
        <>
          <FlightRoute from="TPE" to="HND" showAirports />
          <FlightRouteLabel
            from="TPE"
            to="HND"
            mode="aircraft"
            position={0.08}
            size="md"
            labelPosition="right"
            animate={animated ? { duration: 7200 } : false}
          >
            BR 198 · 42 min
          </FlightRouteLabel>
        </>
      );
    case "flight-network":
      return <FlightNetwork routes={NETWORK_ROUTES} />;
    case "flight-range":
      return (
        <FlightRange
          origin="TPE"
          ranges={[
            { distance: 800, color: "#bfdbfe", opacity: 0.08 },
            { distance: 1800, color: "#60a5fa", opacity: 0.055 },
            { distance: 3200, color: "#2563eb", opacity: 0.035 },
          ]}
        />
      );
    case "aircraft-trail":
      return (
        <AircraftTrail
          positions={TRAIL_POSITIONS}
          altitudeColorStops={TRAIL_ALTITUDE_COLOR_STOPS}
          startOpacity={0.42}
        />
      );
    case "flight-flow":
      return (
        <FlightFlow
          routes={FLOW_ROUTES}
          aircraftCount={30}
          animate={animated}
        />
      );
    case "satellite-orbit":
      return (
        <SatelliteOrbit
          inclination={51.6}
          ascendingNode={-28}
          name="ISS"
          showLabel
          animate={animated ? { duration: 12000 } : false}
        />
      );
    case "satellite-orbits":
      return (
        <SatelliteOrbits
          orbits={[
            { inclination: 51.6, ascendingNode: -28, name: "ISS" },
            { inclination: 97.4, ascendingNode: 38, name: "NOAA-20" },
            { inclination: 53, ascendingNode: -120, name: "Starlink" },
          ]}
          showLabel
          animate={animated ? { duration: 12000 } : false}
        />
      );
    case "satellite-custom-icon":
      return <CustomSatellitePairExample animated={animated} />;
    default:
      return null;
  }
}

function ExampleDetailsCard({
  selectedExample,
}: {
  selectedExample: ExampleConfig;
}) {
  return (
    <div className="order-3 min-w-0 rounded-xl border border-black/8 bg-white/92 p-4 xl:order-3 xl:col-span-2">
      <p className="section-kicker">{selectedExample.eyebrow}</p>
      <h2 className="mt-2 text-lg font-semibold text-slate-950 sm:text-xl">
        {selectedExample.title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {selectedExample.description}
      </p>
      <div className="mt-4 overflow-hidden rounded-xl bg-slate-950 text-slate-100">
        <div className="flex items-center justify-between border-b border-white/10 px-4 font-mono text-[10px] text-slate-300">
          <span>EXAMPLE · TSX</span>
          <CopyButton
            key={selectedExample.code}
            text={selectedExample.code}
            label="Copy example code"
            className="hover:bg-white/10"
          />
        </div>
        <div className="custom-scrollbar max-w-full overflow-x-auto px-4 py-4">
          <ShikiCodeBlock
            code={selectedExample.code}
            className="[&_pre]:text-[11px] sm:[&_pre]:text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function ExamplePreview({
  selectedExample,
}: {
  selectedExample: ExampleConfig;
}) {
  const zoom = useResponsiveZoom(selectedExample.zoom);
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const hasAnimation = [
    "animation",
    "flight-route-label",
    "flight-flow",
    "satellite-orbit",
    "satellite-orbits",
    "satellite-custom-icon",
  ].includes(selectedExample.id);

  return (
    <div className="relative order-1 h-72 min-w-0 overflow-hidden rounded-xl border border-black/8 bg-[#ececeb] sm:h-96 lg:h-120 xl:order-1 xl:h-152">
      <Map
        className="h-full w-full"
        viewport={{
          center: selectedExample.center,
          zoom,
        }}
        onViewportChange={() => {}}
        styles={mapStyles}
        projection={selectedExample.projection}
      >
        {renderExample(selectedExample.id, !paused && !reducedMotion)}
      </Map>
      {hasAnimation ? (
        <button
          type="button"
          onClick={() => setPaused((previous) => !previous)}
          disabled={!!reducedMotion}
          aria-pressed={paused}
          className="pressable absolute top-3 right-3 flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
        >
          {paused || reducedMotion ? <Play size={13} /> : <Square size={13} />}
          {reducedMotion
            ? "Reduced motion"
            : paused
              ? "Play animation"
              : "Stop animation"}
        </button>
      ) : null}
      {selectedExample.id === "route-hover" && (
        <div className="pointer-events-none absolute bottom-2 left-2 z-10 max-w-[min(11.5rem,calc(100%-1rem))] rounded-2xl border border-black/10 bg-white/95 px-2.5 py-2 shadow-[0_8px_22px_rgba(15,23,42,0.1)] backdrop-blur sm:bottom-4 sm:left-4 sm:max-w-64 sm:rounded-3xl sm:px-5 sm:py-4 sm:shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
          <p className="text-[11px] leading-snug font-semibold text-slate-950 sm:text-xs sm:leading-[1.6]">
            Taipei (TPE) ↔ Tokyo (HND)
          </p>
          <div className="my-2 h-px bg-slate-200 sm:my-3" />
          <div className="space-y-1.5 sm:space-y-2.5">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <span className="text-[10px] leading-tight text-slate-500 sm:text-xs sm:leading-[1.6]">
                Distance
              </span>
              <span className="text-[10px] leading-tight text-slate-950 sm:text-xs sm:leading-[1.6]">
                2,121 km
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <span className="text-[10px] leading-tight text-slate-500 sm:text-xs sm:leading-[1.6]">
                Est. Time
              </span>
              <span className="text-[10px] leading-tight text-slate-950 sm:text-xs sm:leading-[1.6]">
                ~2h 30m
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <span className="text-[10px] leading-tight text-slate-500 sm:text-xs sm:leading-[1.6]">
                Type
              </span>
              <span className="text-[10px] leading-tight text-slate-950 sm:text-xs sm:leading-[1.6]">
                Round Trip
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExampleSelector({
  examples,
  selectedExample,
  onSelect,
}: {
  examples: readonly ExampleConfig[];
  selectedExample: ExampleConfig;
  onSelect: (exampleId: ExampleId) => void;
}) {
  const groups = [
    {
      name: "Routes",
      ids: [
        "flight-route",
        "animation",
        "airport-dot",
        "flight-routes",
        "multiple-leg",
        "route-hover",
        "globe",
        "flight-route-label",
      ],
    },
    { name: "Tracking", ids: ["flight-tracker", "flight-flow"] },
    { name: "Networks", ids: ["flight-network", "flight-range"] },
    { name: "Trails", ids: ["aircraft-trail"] },
    {
      name: "Satellite",
      ids: ["satellite-orbit", "satellite-orbits", "satellite-custom-icon"],
    },
  ];
  return (
    <div className="order-2 min-w-0 rounded-xl border border-black/8 bg-white/92 p-3 sm:p-3 xl:order-2 xl:flex xl:h-152 xl:flex-col">
      <div className="flex items-center justify-between px-2 pb-2 sm:px-2">
        <p className="section-kicker">Examples</p>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
          {examples.length}
        </span>
      </div>
      <div className="custom-scrollbar max-h-[32rem] space-y-2 overflow-y-auto px-1 pr-1.5 sm:px-1 xl:max-h-none xl:min-h-0 xl:flex-1">
        {groups.map((group) => {
          const items = examples.filter((example) =>
            group.ids.includes(example.id),
          );
          if (!items.length) return null;
          return (
            <div key={group.name}>
              <p className="px-3 pt-4 pb-2 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
                {group.name}
              </p>
              {items.map((example) => {
                const isActive = example.id === selectedExample.id;

                return (
                  <button
                    key={example.id}
                    type="button"
                    onClick={() => onSelect(example.id)}
                    aria-pressed={isActive}
                    className={`flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-left transition-colors sm:gap-3 sm:px-3 sm:py-2 ${
                      isActive
                        ? "border-orange-200 bg-orange-50 text-orange-900"
                        : "border-transparent text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${
                        isActive ? "bg-orange-600" : "bg-slate-300"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {example.label}
                      </span>
                      <span
                        className={`mt-1 block text-xs ${
                          isActive ? "text-orange-800" : "text-slate-500"
                        }`}
                      >
                        {example.eyebrow}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ShowcaseSection({ product }: { product: ProductKey }) {
  const examples = useMemo(() => examplesByProduct[product], [product]);
  const [selectedProduct, setSelectedProduct] = useState(product);
  const [selectedExampleId, setSelectedExampleId] = useState<ExampleId>(
    examples[0].id,
  );

  if (selectedProduct !== product) {
    setSelectedProduct(product);
    setSelectedExampleId(examples[0].id);
  }

  const selectedExample =
    examples.find((example) => example.id === selectedExampleId) ?? examples[0];
  const copy = showcaseCopy[product];

  const handleSelectExample = (exampleId: ExampleId) => {
    setSelectedExampleId(exampleId);
  };

  return (
    <section
      id="showcase"
      className="mt-4 scroll-mt-6 border-t border-slate-200 pt-12 sm:pt-16"
    >
      <div className="mb-8">
        <p className="section-kicker">{copy.eyebrow}</p>
        <h2 className="section-title mt-4">{copy.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          {copy.description}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/60 p-2 sm:p-3">
        <div className="grid min-w-0 gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,19rem)]">
          <ExamplePreview selectedExample={selectedExample} />
          <ExampleSelector
            examples={examples}
            selectedExample={selectedExample}
            onSelect={handleSelectExample}
          />
          <ExampleDetailsCard selectedExample={selectedExample} />
        </div>
      </div>
    </section>
  );
}

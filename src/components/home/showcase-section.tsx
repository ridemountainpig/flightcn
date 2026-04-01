"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";

import { ShikiCodeBlock } from "@/components/ui/shiki-code-block";
import { Map } from "@/components/ui/map";
import {
  FlightAirport,
  FlightMultiRoute,
  FlightRoute,
  FlightRoutes,
} from "@/registry/flight";
import {
  exampleConfigs,
  mapStyles,
  routeExamples,
  type ExampleConfig,
  type ExampleId,
} from "@/components/home/home-config";
import { useResponsiveZoom } from "@/lib/map-responsive-zoom";

const sectionReveal = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.09 },
  },
};

const childReveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function renderExample(exampleId: ExampleId): ReactNode {
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
            animate={{ duration: 5000 }}
          />
          <FlightRoute
            from="TPE"
            to="DXB"
            showAirports
            showLabel
            tripType="one-way"
            animate={{ duration: 8000 }}
          />
        </>
      );
    case "globe":
      return <FlightRoute from="CDG" to="SYD" showAirports showLabel />;
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
    <motion.div
      className="order-3 min-w-0 rounded-[1.5rem] border border-black/8 bg-white/92 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] xl:order-3 xl:col-span-2"
      variants={childReveal}
    >
      <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
        {selectedExample.eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-semibold text-slate-950 sm:text-xl">
        {selectedExample.title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {selectedExample.description}
      </p>
      <div className="mt-4 max-w-full overflow-x-auto rounded-2xl bg-slate-950 px-4 py-3 text-slate-100">
        <ShikiCodeBlock
          code={selectedExample.code}
          className="[&_pre]:text-[11px] sm:[&_pre]:text-xs"
        />
      </div>
    </motion.div>
  );
}

function ExamplePreview({
  selectedExample,
}: {
  selectedExample: ExampleConfig;
}) {
  const zoom = useResponsiveZoom(selectedExample.zoom);

  return (
    <motion.div
      className="relative order-1 min-w-0 overflow-hidden rounded-[1.5rem] border border-black/8 bg-[#ececeb] xl:order-1"
      variants={childReveal}
    >
      <Map
        className="h-72 w-full sm:h-96 lg:h-120 xl:h-152"
        viewport={{
          center: selectedExample.center,
          zoom,
        }}
        onViewportChange={() => {}}
        styles={mapStyles}
        projection={selectedExample.projection}
      >
        {renderExample(selectedExample.id)}
      </Map>
      {selectedExample.id === "route-hover" && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-3xl border border-black/10 bg-white/95 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:bottom-4 sm:left-4 sm:max-w-64 sm:px-5 sm:py-4">
          <p className="text-xs leading-[1.6] font-semibold text-slate-950">
            Taipei (TPE) ↔ Tokyo (HND)
          </p>
          <div className="my-3 h-px bg-slate-200" />
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs leading-[1.6] text-slate-500">
                Distance
              </span>
              <span className="text-xs leading-[1.6] text-slate-950">
                2,121 km
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs leading-[1.6] text-slate-500">
                Est. Time
              </span>
              <span className="text-xs leading-[1.6] text-slate-950">
                ~2h 30m
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs leading-[1.6] text-slate-500">Type</span>
              <span className="text-xs leading-[1.6] text-slate-950">
                Round Trip
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ExampleSelector({
  selectedExample,
  onSelect,
}: {
  selectedExample: ExampleConfig;
  onSelect: (exampleId: ExampleId) => void;
}) {
  return (
    <motion.div
      className="order-2 min-w-0 rounded-[1.5rem] border border-black/8 bg-white/92 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-3 xl:order-2"
      variants={childReveal}
    >
      <div className="flex items-center justify-between px-2 pb-2 sm:px-2">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
          Examples
        </p>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
          {exampleConfigs.length}
        </span>
      </div>
      <div className="space-y-2 px-1 sm:px-1">
        {exampleConfigs.map((example) => {
          const isActive = example.id === selectedExample.id;

          return (
            <motion.button
              key={example.id}
              type="button"
              onClick={() => onSelect(example.id)}
              className={`flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-colors sm:gap-3 sm:px-3 sm:py-3 ${
                isActive
                  ? "border-slate-900 bg-slate-950 text-white"
                  : "border-black/8 bg-slate-50/90 text-slate-700 hover:bg-slate-100"
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
            >
              <span
                className={`size-2 shrink-0 rounded-full ${
                  isActive ? "bg-emerald-400" : "bg-slate-300"
                }`}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  {example.label}
                </span>
                <span
                  className={`mt-1 block text-xs ${
                    isActive ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {example.eyebrow}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export function ShowcaseSection() {
  const initialExample = exampleConfigs[0];
  const [selectedExampleId, setSelectedExampleId] = useState<ExampleId>(
    initialExample.id,
  );
  const selectedExample =
    exampleConfigs.find((example) => example.id === selectedExampleId) ??
    initialExample;

  const handleSelectExample = (exampleId: ExampleId) => {
    const nextExample =
      exampleConfigs.find((example) => example.id === exampleId) ??
      initialExample;

    setSelectedExampleId(nextExample.id);
  };

  return (
    <motion.section
      id="showcase"
      className="mt-2"
      variants={sectionReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
    >
      <div className="rounded-[2rem] border border-black/10 bg-white/80 p-2.5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-4">
        <motion.div
          className="grid min-w-0 gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,19rem)]"
          variants={sectionReveal}
        >
          <ExamplePreview selectedExample={selectedExample} />
          <ExampleSelector
            selectedExample={selectedExample}
            onSelect={handleSelectExample}
          />
          <ExampleDetailsCard selectedExample={selectedExample} />
        </motion.div>
      </div>
    </motion.section>
  );
}

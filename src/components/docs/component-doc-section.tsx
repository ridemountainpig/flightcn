"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { mapStyles } from "@/components/home/home-config";
import { useResponsiveZoom } from "@/lib/map-responsive-zoom";
import { Map } from "@/components/ui/map";
import { ShikiCodeBlock } from "@/components/ui/shiki-code-block";

import {
  buildSnippet,
  renderComponentPreview,
  type AirportPlayground,
  type ComponentPreviewArgs,
  type FlightRouteLikePlayground,
} from "./component-docs-helpers";
import { type ComponentDoc } from "./component-docs-config";
import { DocsMapMountWhenVisible } from "./docs-map-mount-when-visible";
import { PropsTable, type ControlMap } from "./props-table";

const DEFAULT_AIRPORT: AirportPlayground = {
  showLabel: true,
  labelPosition: "top",
};

const DEFAULT_ROUTE_LIKE: FlightRouteLikePlayground = {
  showAirports: true,
  showLabel: true,
  hoverEffect: true,
  animate: true,
  tripType: "round-trip",
  lineStyle: "solid",
};

function routeLikeControls(
  play: FlightRouteLikePlayground,
  set: Dispatch<SetStateAction<FlightRouteLikePlayground>>,
): ControlMap {
  return {
    showAirports: {
      kind: "select",
      value: String(play.showAirports),
      onChange: (value) =>
        set((prev) => ({ ...prev, showAirports: value === "true" })),
      options: ["true", "false"],
    },
    showLabel: {
      kind: "select",
      value: String(play.showLabel),
      onChange: (value) =>
        set((prev) => ({ ...prev, showLabel: value === "true" })),
      options: ["true", "false"],
    },
    hoverEffect: {
      kind: "select",
      value: String(play.hoverEffect),
      onChange: (value) =>
        set((prev) => ({ ...prev, hoverEffect: value === "true" })),
      options: ["true", "false"],
    },
    animate: {
      kind: "select",
      value: String(play.animate),
      onChange: (value) =>
        set((prev) => ({ ...prev, animate: value === "true" })),
      options: ["true", "false"],
    },
    tripType: {
      kind: "select",
      value: play.tripType,
      onChange: (value) =>
        set((prev) => ({
          ...prev,
          tripType: value as FlightRouteLikePlayground["tripType"],
        })),
      options: ["one-way", "round-trip"],
    },
    lineStyle: {
      kind: "select",
      value: play.lineStyle,
      onChange: (value) =>
        set((prev) => ({
          ...prev,
          lineStyle: value as FlightRouteLikePlayground["lineStyle"],
        })),
      options: ["solid", "dash", "dot"],
    },
  };
}

function DocSectionShell({
  component,
  snippet,
  controls,
  previewArgs,
}: {
  component: ComponentDoc;
  snippet: string;
  controls: ControlMap;
  previewArgs: ComponentPreviewArgs;
}) {
  const zoom = useResponsiveZoom(component.mapZoom);

  return (
    <section
      id={component.id}
      className="min-w-0 scroll-mt-6 rounded-[1.8rem] border border-black/10 bg-white/85 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-4"
    >
      <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
        Component
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
        {component.name}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {component.description}
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-black/8 bg-[#ececeb]">
        <DocsMapMountWhenVisible>
          <Map
            className="h-80 w-full sm:h-96"
            viewport={{
              center: component.mapCenter,
              zoom,
            }}
            onViewportChange={() => {}}
            styles={mapStyles}
          >
            {renderComponentPreview(previewArgs)}
          </Map>
        </DocsMapMountWhenVisible>
      </div>

      <div className="mt-4 max-w-full overflow-x-auto rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
        <ShikiCodeBlock code={snippet} />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-slate-900">Props</h3>
      <div className="mt-3">
        <PropsTable props={component.props} controls={controls} />
      </div>

      {component.extra?.map((extraTable, index) => (
        <div
          key={`${component.id}-extra-${index}-${extraTable.title}`}
          className="mt-5"
        >
          <h4 className="text-base font-semibold text-slate-900">
            {extraTable.title}
          </h4>
          <div className="mt-3">
            <PropsTable props={extraTable.props} />
          </div>
        </div>
      ))}
    </section>
  );
}

function AirportDocSection({ component }: { component: ComponentDoc }) {
  const [airport, setAirport] = useState<AirportPlayground>(DEFAULT_AIRPORT);

  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "flight-airport", airport }),
    [airport],
  );

  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);

  const controls = useMemo((): ControlMap => {
    return {
      showLabel: {
        kind: "select",
        value: String(airport.showLabel),
        onChange: (value) =>
          setAirport((prev) => ({
            ...prev,
            showLabel: value === "true",
          })),
        options: ["true", "false"],
      },
      labelPosition: {
        kind: "select",
        value: airport.labelPosition,
        onChange: (value) =>
          setAirport((prev) => ({
            ...prev,
            labelPosition: value as AirportPlayground["labelPosition"],
          })),
        options: ["top", "bottom"],
      },
    };
  }, [airport]);

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function FlightRouteDocSection({ component }: { component: ComponentDoc }) {
  const [route, setRoute] =
    useState<FlightRouteLikePlayground>(DEFAULT_ROUTE_LIKE);

  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "flight-route", route }),
    [route],
  );

  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);

  const controls = useMemo(() => routeLikeControls(route, setRoute), [route]);

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function FlightRoutesDocSection({ component }: { component: ComponentDoc }) {
  const [routes, setRoutes] =
    useState<FlightRouteLikePlayground>(DEFAULT_ROUTE_LIKE);

  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "flight-routes", routes }),
    [routes],
  );

  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);

  const controls = useMemo(
    () => routeLikeControls(routes, setRoutes),
    [routes],
  );

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

function FlightMultiRouteDocSection({
  component,
}: {
  component: ComponentDoc;
}) {
  const [multiRoute, setMultiRoute] =
    useState<FlightRouteLikePlayground>(DEFAULT_ROUTE_LIKE);

  const previewArgs = useMemo<ComponentPreviewArgs>(
    () => ({ id: "flight-multi-route", multiRoute }),
    [multiRoute],
  );

  const snippet = useMemo(() => buildSnippet(previewArgs), [previewArgs]);

  const controls = useMemo(
    () => routeLikeControls(multiRoute, setMultiRoute),
    [multiRoute],
  );

  return (
    <DocSectionShell
      component={component}
      snippet={snippet}
      controls={controls}
      previewArgs={previewArgs}
    />
  );
}

export function ComponentDocSection({
  component,
}: {
  component: ComponentDoc;
}) {
  switch (component.id) {
    case "flight-airport":
      return <AirportDocSection component={component} />;
    case "flight-route":
      return <FlightRouteDocSection component={component} />;
    case "flight-routes":
      return <FlightRoutesDocSection component={component} />;
    case "flight-multi-route":
      return <FlightMultiRouteDocSection component={component} />;
  }
}

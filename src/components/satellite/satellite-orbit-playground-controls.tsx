"use client";

import {
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { ChevronDown, RotateCcw, Satellite } from "lucide-react";

import {
  ColorRow,
  SegmentedRow,
  SliderRow,
  TextRow,
  ToggleRow,
} from "@/components/playground/playground-inputs";
import { ShareLinkButton } from "@/components/playground/share-link-button";
import { cn } from "@/lib/utils";
import {
  type LineStyle,
  type SatelliteOrbitProps,
} from "@/registry/satellite-orbit";

type SatelliteLabelPosition = NonNullable<SatelliteOrbitProps["labelPosition"]>;

export type SatelliteOrbitPlayground = {
  inclination: number;
  ascendingNode: number;
  duration: number;
  altitudePx: number;
  orbitWidth: number;
  groundTrackWidth: number;
  showGlow: boolean;
  showConnector: boolean;
  animate: boolean;
  orbitLineStyle: LineStyle;
  groundTrackLineStyle: LineStyle;
  connectorLineStyle: LineStyle;
  orbitColor: string;
  orbitGlowColor: string;
  groundTrackColor: string;
  satelliteConnectorColor: string;
  satelliteIconSvg: string;
  satelliteIconRotationOffset: number;
  name: string;
  showLabel: boolean;
  labelPosition: SatelliteLabelPosition;
};

export const SATELLITE_ICON_PLACEHOLDER_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2Z" fill="#38bdf8" />
  <circle cx="12" cy="12" r="2.5" fill="#0f172a" />
</svg>`;

export const DEFAULT_SATELLITE_ORBIT_PLAYGROUND: SatelliteOrbitPlayground = {
  inclination: 51.6,
  ascendingNode: -28,
  duration: 12000,
  altitudePx: 28,
  orbitWidth: 2.2,
  groundTrackWidth: 1.4,
  showGlow: true,
  showConnector: true,
  animate: true,
  orbitLineStyle: "solid",
  groundTrackLineStyle: "dash",
  connectorLineStyle: "dash",
  orbitColor: "",
  orbitGlowColor: "",
  groundTrackColor: "",
  satelliteConnectorColor: "",
  satelliteIconSvg: "",
  satelliteIconRotationOffset: 0,
  name: "ISS",
  showLabel: true,
  labelPosition: "right",
};

export function buildSatelliteOrbitProps(
  playground: SatelliteOrbitPlayground,
): SatelliteOrbitProps {
  return {
    inclination: playground.inclination,
    ascendingNode: playground.ascendingNode,
    altitudePx: playground.altitudePx,
    orbitWidth: playground.orbitWidth,
    groundTrackWidth: playground.groundTrackWidth,
    showGlow: playground.showGlow,
    showConnector: playground.showConnector,
    orbitLineStyle: playground.orbitLineStyle,
    groundTrackLineStyle: playground.groundTrackLineStyle,
    connectorLineStyle: playground.connectorLineStyle,
    animate: playground.animate ? { duration: playground.duration } : false,
    orbitColor: playground.orbitColor || undefined,
    orbitGlowColor: playground.orbitGlowColor || undefined,
    groundTrackColor: playground.groundTrackColor || undefined,
    satelliteConnectorColor: playground.satelliteConnectorColor || undefined,
    satelliteIconSvg: playground.satelliteIconSvg || undefined,
    satelliteIconRotationOffset: playground.satelliteIconRotationOffset,
    name: playground.name,
    showLabel: playground.showLabel,
    labelPosition: playground.labelPosition,
  };
}

export function buildSatelliteOrbitSnippet(
  playground: SatelliteOrbitPlayground,
) {
  const escapedIconSvg = playground.satelliteIconSvg.replace(
    /\\|`|\$\{/g,
    (match) => (match === "\\" ? "\\\\" : match === "`" ? "\\`" : "\\${"),
  );
  const lines = [
    `    inclination={${playground.inclination}}`,
    `    ascendingNode={${playground.ascendingNode}}`,
    `    altitudePx={${playground.altitudePx}}`,
    `    orbitWidth={${playground.orbitWidth}}`,
    `    groundTrackWidth={${playground.groundTrackWidth}}`,
    `    showGlow={${playground.showGlow}}`,
    `    showConnector={${playground.showConnector}}`,
    `    orbitLineStyle="${playground.orbitLineStyle}"`,
    `    groundTrackLineStyle="${playground.groundTrackLineStyle}"`,
    `    connectorLineStyle="${playground.connectorLineStyle}"`,
    `    animate={${
      playground.animate ? `{ duration: ${playground.duration} }` : "false"
    }}`,
    playground.orbitColor ? `    orbitColor="${playground.orbitColor}"` : null,
    playground.orbitGlowColor
      ? `    orbitGlowColor="${playground.orbitGlowColor}"`
      : null,
    playground.groundTrackColor
      ? `    groundTrackColor="${playground.groundTrackColor}"`
      : null,
    playground.satelliteConnectorColor
      ? `    satelliteConnectorColor="${playground.satelliteConnectorColor}"`
      : null,
    playground.satelliteIconSvg
      ? `    satelliteIconSvg={\`${escapedIconSvg}\`}`
      : null,
    `    satelliteIconRotationOffset={${playground.satelliteIconRotationOffset}}`,
    `    name="${playground.name}"`,
    `    showLabel={${playground.showLabel}}`,
    `    labelPosition="${playground.labelPosition}"`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return `<Map projection={{ type: "globe" }} center={[8, 16]} zoom={1.05}>
  <SatelliteOrbit
${lines}
  />
</Map>`;
}

export const LINE_STYLES: readonly LineStyle[] = ["solid", "dash", "dot"];
export const LABEL_POSITIONS: readonly SatelliteLabelPosition[] = [
  "top",
  "right",
  "bottom",
  "left",
];

/** Orbit basics stay open; styling detail starts collapsed so the panel opens short. */
const DEFAULT_OPEN_SECTIONS = ["Orbit", "Animation", "Label"];

export function SatelliteOrbitControls({
  value,
  onChange,
  onReset,
  getShareUrl,
}: {
  value: SatelliteOrbitPlayground;
  onChange: Dispatch<SetStateAction<SatelliteOrbitPlayground>>;
  onReset?: () => void;
  getShareUrl?: () => string;
}) {
  const [openSections, setOpenSections] = useState<string[]>(
    DEFAULT_OPEN_SECTIONS,
  );

  const update = <K extends keyof SatelliteOrbitPlayground>(
    key: K,
    nextValue: SatelliteOrbitPlayground[K],
  ) => {
    onChange((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
  };

  const sectionProps = (title: string) => ({
    title,
    open: openSections.includes(title),
    onToggle: () =>
      setOpenSections((current) =>
        current.includes(title)
          ? current.filter((entry) => entry !== title)
          : [...current, title],
      ),
  });

  const customColors = [
    value.orbitColor,
    value.orbitGlowColor,
    value.groundTrackColor,
    value.satelliteConnectorColor,
  ].filter(Boolean).length;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 lg:w-96 lg:shrink-0">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-widest text-slate-500 uppercase">
            <Satellite size={12} aria-hidden="true" /> Orbit
          </p>
          <span className="flex items-center gap-1.5">
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                title="Reset the orbit to its default configuration"
                className="pressable inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-slate-600 hover:bg-slate-100"
              >
                <RotateCcw size={12} aria-hidden="true" />
                Reset
              </button>
            ) : null}
            {getShareUrl ? (
              <ShareLinkButton
                getUrl={getShareUrl}
                title="Copy a view-only link — the globe without the editor panels"
              />
            ) : null}
          </span>
        </div>

        <div className="space-y-2">
          <CollapsibleSection
            {...sectionProps("Orbit")}
            summary={`${value.inclination}° incl · ${value.ascendingNode}° node`}
          >
            <SliderRow
              label="Inclination"
              value={value.inclination}
              min={-90}
              max={90}
              step={0.5}
              onChange={(nextValue) => update("inclination", nextValue)}
            />
            <SliderRow
              label="Ascending Node"
              value={value.ascendingNode}
              min={-180}
              max={180}
              step={1}
              onChange={(nextValue) => update("ascendingNode", nextValue)}
            />
          </CollapsibleSection>

          <CollapsibleSection
            {...sectionProps("Animation")}
            summary={
              value.animate ? `${value.duration} ms per orbit` : "Paused"
            }
          >
            <ToggleRow
              label="Animate"
              checked={value.animate}
              onChange={(nextValue) => update("animate", nextValue)}
            />
            <SliderRow
              label="Duration (ms)"
              value={value.duration}
              min={1000}
              max={30000}
              step={500}
              onChange={(nextValue) => update("duration", nextValue)}
              disabled={!value.animate}
            />
          </CollapsibleSection>

          <CollapsibleSection
            {...sectionProps("Label")}
            summary={
              value.showLabel
                ? `${value.name || "Unnamed"} · ${value.labelPosition}`
                : "Hidden"
            }
          >
            <TextRow
              label="Name"
              value={value.name}
              onChange={(nextValue) => update("name", nextValue)}
            />
            <ToggleRow
              label="Show Label"
              checked={value.showLabel}
              onChange={(nextValue) => update("showLabel", nextValue)}
            />
            <SegmentedRow
              label="Position"
              value={value.labelPosition}
              options={LABEL_POSITIONS}
              onChange={(nextValue) => update("labelPosition", nextValue)}
              disabled={!value.showLabel}
            />
          </CollapsibleSection>

          <CollapsibleSection
            {...sectionProps("Appearance")}
            summary={`${value.altitudePx}px altitude · ${value.orbitWidth} width`}
          >
            <SliderRow
              label="Altitude (px)"
              value={value.altitudePx}
              min={5}
              max={100}
              step={1}
              onChange={(nextValue) => update("altitudePx", nextValue)}
            />
            <SliderRow
              label="Orbit Width"
              value={value.orbitWidth}
              min={0.5}
              max={8}
              step={0.1}
              onChange={(nextValue) => update("orbitWidth", nextValue)}
            />
            <SliderRow
              label="Ground Track Width"
              value={value.groundTrackWidth}
              min={0.5}
              max={5}
              step={0.1}
              onChange={(nextValue) => update("groundTrackWidth", nextValue)}
            />
            <ToggleRow
              label="Show Glow"
              checked={value.showGlow}
              onChange={(nextValue) => update("showGlow", nextValue)}
            />
            <ToggleRow
              label="Show Connector"
              checked={value.showConnector}
              onChange={(nextValue) => update("showConnector", nextValue)}
            />
          </CollapsibleSection>

          <CollapsibleSection
            {...sectionProps("Line Style")}
            summary={`${value.orbitLineStyle} orbit · ${value.groundTrackLineStyle} track`}
          >
            <SegmentedRow
              label="Orbit"
              value={value.orbitLineStyle}
              options={LINE_STYLES}
              onChange={(nextValue) => update("orbitLineStyle", nextValue)}
            />
            <SegmentedRow
              label="Ground Track"
              value={value.groundTrackLineStyle}
              options={LINE_STYLES}
              onChange={(nextValue) =>
                update("groundTrackLineStyle", nextValue)
              }
            />
            <SegmentedRow
              label="Connector"
              value={value.connectorLineStyle}
              options={LINE_STYLES}
              onChange={(nextValue) => update("connectorLineStyle", nextValue)}
              disabled={!value.showConnector}
            />
          </CollapsibleSection>

          <CollapsibleSection
            {...sectionProps("Colors")}
            summary={
              customColors === 0
                ? "All auto"
                : `${customColors} custom · ${4 - customColors} auto`
            }
          >
            <ColorRow
              label="Orbit"
              value={value.orbitColor}
              onChange={(nextValue) => update("orbitColor", nextValue)}
            />
            <ColorRow
              label="Orbit Glow"
              value={value.orbitGlowColor}
              onChange={(nextValue) => update("orbitGlowColor", nextValue)}
            />
            <ColorRow
              label="Ground Track"
              value={value.groundTrackColor}
              onChange={(nextValue) => update("groundTrackColor", nextValue)}
            />
            <ColorRow
              label="Connector"
              value={value.satelliteConnectorColor}
              onChange={(nextValue) =>
                update("satelliteConnectorColor", nextValue)
              }
            />
          </CollapsibleSection>

          <CollapsibleSection
            {...sectionProps("Satellite Icon")}
            summary={
              value.satelliteIconSvg
                ? `Custom SVG · ${value.satelliteIconRotationOffset}° offset`
                : "Default marker"
            }
          >
            <SliderRow
              label="Rotation Offset"
              value={value.satelliteIconRotationOffset}
              min={-180}
              max={180}
              step={1}
              onChange={(nextValue) =>
                update("satelliteIconRotationOffset", nextValue)
              }
            />
            <TextAreaRow
              label="SVG String"
              value={value.satelliteIconSvg}
              onChange={(nextValue) => update("satelliteIconSvg", nextValue)}
              placeholder={SATELLITE_ICON_PLACEHOLDER_SVG}
            />
          </CollapsibleSection>
        </div>
      </div>
      <p className="px-1 text-[11px] text-slate-400">
        Open a section to tune it — the generated code follows every change.
      </p>
    </div>
  );
}

/** Mirrors the flight playground's layer rows: title, live summary, chevron. */
function CollapsibleSection({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
      >
        <span className="min-w-0">
          <span className="block text-xs font-medium text-slate-900">
            {title}
          </span>
          <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-500">
            {summary}
          </span>
        </span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={cn(
            "collapse-chevron shrink-0 text-slate-400",
            open ? "rotate-180" : "",
          )}
        />
      </button>
      {open ? (
        <div className="fade-rise space-y-2.5 border-t border-slate-100 px-3 py-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function TextAreaRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="min-h-36 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-5 text-slate-700 focus:border-slate-400 focus:outline-none"
      />
    </label>
  );
}

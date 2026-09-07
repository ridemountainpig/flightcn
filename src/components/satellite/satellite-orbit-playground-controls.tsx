"use client";

import { type Dispatch, type ReactNode, type SetStateAction } from "react";

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

export function SatelliteOrbitControls({
  value,
  onChange,
}: {
  value: SatelliteOrbitPlayground;
  onChange: Dispatch<SetStateAction<SatelliteOrbitPlayground>>;
}) {
  const update = <K extends keyof SatelliteOrbitPlayground>(
    key: K,
    nextValue: SatelliteOrbitPlayground[K],
  ) => {
    onChange((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
  };

  return (
    <div className="flex w-full flex-col gap-3 lg:w-72 lg:shrink-0">
      <ControlSection title="Orbit">
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
      </ControlSection>

      <ControlSection title="Animation">
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
      </ControlSection>

      <ControlSection title="Label">
        <InputRow
          label="Name"
          value={value.name}
          onChange={(nextValue) => update("name", nextValue)}
        />
        <ToggleRow
          label="Show Label"
          checked={value.showLabel}
          onChange={(nextValue) => update("showLabel", nextValue)}
        />
        <LabelPositionRow
          label="Position"
          value={value.labelPosition}
          onChange={(nextValue) => update("labelPosition", nextValue)}
          disabled={!value.showLabel}
        />
      </ControlSection>

      <ControlSection title="Appearance">
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
      </ControlSection>

      <ControlSection title="Line Style">
        <LineStyleRow
          label="Orbit"
          value={value.orbitLineStyle}
          onChange={(nextValue) => update("orbitLineStyle", nextValue)}
        />
        <LineStyleRow
          label="Ground Track"
          value={value.groundTrackLineStyle}
          onChange={(nextValue) => update("groundTrackLineStyle", nextValue)}
        />
        <LineStyleRow
          label="Connector"
          value={value.connectorLineStyle}
          onChange={(nextValue) => update("connectorLineStyle", nextValue)}
          disabled={!value.showConnector}
        />
      </ControlSection>

      <ControlSection title="Colors">
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
          onChange={(nextValue) => update("satelliteConnectorColor", nextValue)}
        />
      </ControlSection>

      <ControlSection title="Satellite Icon">
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
      </ControlSection>
    </div>
  );
}

function ControlSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="mb-2.5 text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
        {title}
      </p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "pointer-events-none opacity-40" : ""}>
      <div className="mb-1 flex justify-between">
        <span className="text-xs text-slate-600">{label}</span>
        <span className="font-mono text-xs text-slate-900">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-slate-900"
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-xs text-slate-600">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-slate-900"
      />
    </label>
  );
}

const LINE_STYLES: LineStyle[] = ["solid", "dash", "dot"];

function LineStyleRow({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: LineStyle;
  onChange: (value: LineStyle) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 ${disabled ? "pointer-events-none opacity-40" : ""}`}
    >
      <span className="text-xs text-slate-600">{label}</span>
      <div className="flex gap-1">
        {LINE_STYLES.map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => onChange(style)}
            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
              value === style
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {style}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const hasCustom = value !== "";

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        {hasCustom ? (
          <>
            <input
              type="color"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="h-5 w-8 cursor-pointer rounded border border-slate-200"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[10px] text-slate-500 hover:text-slate-700"
            >
              auto
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onChange("#000000")}
            className="text-[10px] text-slate-500 underline decoration-dotted underline-offset-2 hover:text-slate-800"
          >
            auto
          </button>
        )}
      </div>
    </div>
  );
}

function InputRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-600">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:border-slate-400 focus:outline-none"
      />
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

const LABEL_POSITIONS: SatelliteLabelPosition[] = [
  "top",
  "right",
  "bottom",
  "left",
];

function LabelPositionRow({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: SatelliteLabelPosition;
  onChange: (value: SatelliteLabelPosition) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 ${disabled ? "pointer-events-none opacity-40" : ""}`}
    >
      <span className="text-xs text-slate-600">{label}</span>
      <div className="flex gap-1">
        {LABEL_POSITIONS.map((position) => (
          <button
            key={position}
            type="button"
            onClick={() => onChange(position)}
            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
              value === position
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {position}
          </button>
        ))}
      </div>
    </div>
  );
}

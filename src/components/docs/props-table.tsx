import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { type PropDoc } from "./component-docs-config";

export type SelectControl = {
  kind: "select";
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
};

export type ColorControl = {
  kind: "color";
  value: string;
  onChange: (value: string) => void;
};

export type ControlConfig = SelectControl | ColorControl;
export type ControlMap = Partial<Record<string, ControlConfig>>;

function normalizeHexColor(value: string) {
  const trimmed = value.trim().replace(/^#/, "");

  if (/^[\da-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toLowerCase()}`;
  }

  if (/^[\da-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }

  return null;
}

function SelectInput({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="relative inline-flex w-32">
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="h-9 w-full appearance-none rounded-xl border border-black/10 bg-slate-50 px-3 pr-8 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

function ColorInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commitDraft = () => {
    const normalized = normalizeHexColor(draft);
    if (!normalized) {
      setDraft(value);
      return;
    }

    setDraft(normalized);
    if (normalized !== value) {
      onChange(normalized);
    }
  };

  return (
    <div className="relative inline-flex w-32">
      <input
        value={draft}
        aria-label={ariaLabel}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        placeholder="#0a0a0a"
        spellCheck={false}
        className="h-9 w-full rounded-xl border border-black/10 bg-slate-50 px-3 pr-11 text-xs font-semibold text-slate-700 uppercase transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none"
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center rounded-r-xl px-2">
        <span
          className="size-4 rounded-md border border-black/10 shadow-sm"
          style={{ backgroundColor: value }}
        />
      </div>
      <input
        type="color"
        value={value}
        aria-label={`${ariaLabel} color picker`}
        onChange={(event) => {
          const nextColor = event.currentTarget.value.toLowerCase();
          setDraft(nextColor);
          onChange(nextColor);
        }}
        className="absolute inset-y-0 right-0 w-10 cursor-pointer opacity-0"
      />
    </div>
  );
}

export function PropsTable({
  props,
  controls,
}: {
  props: readonly PropDoc[];
  controls?: ControlMap;
}) {
  return (
    <div className="max-w-full overflow-x-auto rounded-2xl border border-black/10 [scrollbar-color:rgb(51_65_85/0.7)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/70 [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-thumb:hover]:bg-slate-900/82 [&::-webkit-scrollbar-track]:bg-transparent">
      <table className="w-full min-w-[860px] border-collapse bg-white text-left">
        <thead className="bg-slate-100/80 text-xs uppercase">
          <tr>
            <th className="border-b border-black/10 px-4 py-3 font-semibold tracking-wide text-slate-700">
              Prop
            </th>
            <th className="border-b border-black/10 px-4 py-3 font-semibold tracking-wide text-slate-700">
              Type
            </th>
            <th className="border-b border-black/10 px-4 py-3 font-semibold tracking-wide text-slate-700">
              Default
            </th>
            <th className="border-b border-black/10 px-4 py-3 font-semibold tracking-wide text-slate-700">
              Description
            </th>
            <th className="border-b border-black/10 px-4 py-3 font-semibold tracking-wide text-slate-700">
              Playground
            </th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => {
            const control = controls?.[prop.name];

            return (
              <tr key={prop.name}>
                <td className="border-b border-black/8 px-4 py-3 align-middle text-sm font-medium text-slate-900">
                  <code>{prop.name}</code>
                </td>
                <td className="border-b border-black/8 px-4 py-3 align-middle text-xs text-slate-700">
                  <code>{prop.type}</code>
                </td>
                <td className="border-b border-black/8 px-4 py-3 align-middle text-xs text-slate-700">
                  <code>{prop.defaultValue}</code>
                </td>
                <td className="border-b border-black/8 px-4 py-3 align-middle text-sm text-slate-700">
                  {prop.description}
                </td>
                <td className="border-b border-black/8 px-4 py-3 align-middle text-sm text-slate-700">
                  {control ? (
                    control.kind === "select" ? (
                      <SelectInput
                        value={control.value}
                        options={control.options}
                        onChange={control.onChange}
                        ariaLabel={prop.name}
                      />
                    ) : (
                      <ColorInput
                        value={control.value}
                        onChange={control.onChange}
                        ariaLabel={prop.name}
                      />
                    )
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

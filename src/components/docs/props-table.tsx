import { ChevronDown } from "lucide-react";

import { type PropDoc } from "./component-docs-config";

export type SelectControl = {
  kind: "select";
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
};

export type ControlConfig = SelectControl;
export type ControlMap = Partial<Record<string, ControlConfig>>;

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
                    <SelectInput
                      value={control.value}
                      options={control.options}
                      onChange={control.onChange}
                      ariaLabel={prop.name}
                    />
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

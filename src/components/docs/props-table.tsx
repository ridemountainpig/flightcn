import { type PropDoc } from "./component-docs-config";
import {
  ColorInput,
  NumberInput,
  SelectInput,
  TextInput,
  TextareaInput,
} from "./docs-control-inputs";

export type SelectControl = {
  kind: "select";
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  disabled?: boolean;
};

export type ColorControl = {
  kind: "color";
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export type TextControl = {
  kind: "text";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export type TextareaControl = {
  kind: "textarea";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
  disabled?: boolean;
};

export type NumberControl = {
  kind: "number";
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  step?: number;
  disabled?: boolean;
};

export type NumberPairControl = {
  kind: "number-pair";
  value: readonly [number, number];
  onChange: (value: [number, number]) => void;
  labels?: readonly [string, string];
  step?: number;
  disabled?: boolean;
};

export type ControlConfig =
  | SelectControl
  | ColorControl
  | TextControl
  | TextareaControl
  | NumberControl
  | NumberPairControl;
export type ControlMap = Partial<Record<string, ControlConfig>>;

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
                        disabled={control.disabled}
                      />
                    ) : control.kind === "color" ? (
                      <ColorInput
                        value={control.value}
                        onChange={control.onChange}
                        ariaLabel={prop.name}
                        disabled={control.disabled}
                      />
                    ) : control.kind === "text" ? (
                      <TextInput
                        value={control.value}
                        onChange={control.onChange}
                        ariaLabel={prop.name}
                        placeholder={control.placeholder}
                        disabled={control.disabled}
                      />
                    ) : control.kind === "textarea" ? (
                      <div className="w-full">
                        <TextareaInput
                          value={control.value}
                          onChange={control.onChange}
                          ariaLabel={prop.name}
                          placeholder={control.placeholder}
                          minHeightClassName={control.minHeightClassName}
                          disabled={control.disabled}
                        />
                      </div>
                    ) : control.kind === "number" ? (
                      <div className="w-full">
                        <NumberInput
                          value={control.value}
                          onChange={control.onChange}
                          ariaLabel={prop.name}
                          placeholder={control.placeholder}
                          step={control.step}
                          disabled={control.disabled}
                        />
                      </div>
                    ) : control.kind === "number-pair" ? (
                      <div className="grid w-full grid-cols-2 gap-2">
                        <NumberInput
                          value={control.value[0]}
                          onChange={(value) =>
                            control.onChange([value, control.value[1]])
                          }
                          ariaLabel={`${prop.name} ${control.labels?.[0] ?? "x"}`}
                          step={control.step}
                          disabled={control.disabled}
                        />
                        <NumberInput
                          value={control.value[1]}
                          onChange={(value) =>
                            control.onChange([control.value[0], value])
                          }
                          ariaLabel={`${prop.name} ${control.labels?.[1] ?? "y"}`}
                          step={control.step}
                          disabled={control.disabled}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
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

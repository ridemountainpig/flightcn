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
    <div className="custom-scrollbar max-w-full overflow-x-auto rounded-2xl border border-slate-200">
      <table
        role="table"
        className="props-table w-full min-w-[860px] border-collapse bg-white text-left"
      >
        <thead className="bg-slate-100/80 text-xs uppercase">
          <tr>
            <th
              scope="col"
              className="border-b border-slate-200 px-4 py-3 font-semibold tracking-wide text-slate-700"
            >
              Prop
            </th>
            <th
              scope="col"
              className="border-b border-slate-200 px-4 py-3 font-semibold tracking-wide text-slate-700"
            >
              Type
            </th>
            <th
              scope="col"
              className="border-b border-slate-200 px-4 py-3 font-semibold tracking-wide text-slate-700"
            >
              Default
            </th>
            <th
              scope="col"
              className="border-b border-slate-200 px-4 py-3 font-semibold tracking-wide text-slate-700"
            >
              Description
            </th>
            <th
              scope="col"
              className="border-b border-slate-200 px-4 py-3 font-semibold tracking-wide text-slate-700"
            >
              Playground
            </th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => {
            const control = controls?.[prop.name];

            return (
              <tr key={prop.name}>
                <td
                  data-label="Property"
                  className="border-b border-slate-200 px-4 py-3 align-middle text-sm font-medium text-slate-900"
                >
                  <code>{prop.name}</code>
                </td>
                <td
                  data-label="Type"
                  className="border-b border-slate-200 px-4 py-3 align-middle text-xs text-slate-700"
                >
                  <code>{prop.type}</code>
                </td>
                <td
                  data-label="Default"
                  className="border-b border-slate-200 px-4 py-3 align-middle text-xs text-slate-700"
                >
                  <code>{prop.defaultValue}</code>
                </td>
                <td
                  data-label="Description"
                  className="border-b border-slate-200 px-4 py-3 align-middle text-sm text-slate-700"
                >
                  {prop.description}
                </td>
                <td
                  data-label="Playground"
                  className="border-b border-slate-200 px-4 py-3 align-middle text-sm text-slate-700"
                >
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
                      <span className="text-xs text-slate-500">-</span>
                    )
                  ) : (
                    <span className="text-xs text-slate-500">-</span>
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

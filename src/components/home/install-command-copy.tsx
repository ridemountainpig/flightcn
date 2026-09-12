"use client";

import { Terminal } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import {
  PACKAGE_MANAGERS,
  buildInstallCommand,
  usePackageManager,
} from "@/lib/package-manager";
import { cn } from "@/lib/utils";

export function InstallCommandCopy({
  item,
  className,
  codeClassName,
}: {
  /** Registry item to install, e.g. "@flightcn/flight". */
  item: string;
  className?: string;
  codeClassName?: string;
}) {
  const [pm, setPm] = usePackageManager();
  const command = buildInstallCommand(pm, item);

  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-inherit bg-slate-50/80 px-3 py-1.5">
        <Terminal
          className="size-4 shrink-0 text-slate-500"
          aria-hidden="true"
        />
        <div
          role="group"
          aria-label="Package manager"
          className="flex flex-1 gap-1"
        >
          {PACKAGE_MANAGERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPm(option)}
              aria-pressed={pm === option}
              className={cn(
                "pressable rounded-md border px-2.5 py-1 font-mono text-xs font-medium",
                pm === option
                  ? "border-slate-200 bg-white text-slate-950 shadow-[0_1px_4px_#20252214]"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <CopyButton
          key={command}
          text={command}
          label="Copy install command"
          className="text-slate-500 hover:bg-slate-100"
        />
      </div>
      <code
        tabIndex={0}
        aria-label="Install command"
        className={cn(
          "scrollbar-none block min-w-0 overflow-x-auto px-3.5 py-3.5 font-mono text-[11px] whitespace-nowrap text-slate-700 sm:text-xs",
          codeClassName,
        )}
      >
        {command}
      </code>
    </div>
  );
}

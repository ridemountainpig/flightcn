"use client";

import { Terminal } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

export function InstallCommandCopy({
  command,
  className,
  codeClassName,
}: {
  command: string;
  className?: string;
  codeClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2",
        className,
      )}
    >
      <Terminal className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
      <code
        tabIndex={0}
        aria-label="Install command"
        className={cn(
          "min-w-0 flex-1 py-1 font-mono text-[11px] break-words whitespace-normal text-slate-700 sm:text-xs",
          codeClassName,
        )}
      >
        {command}
      </code>
      <CopyButton
        key={command}
        text={command}
        label="Copy install command"
        className="text-slate-500 hover:bg-slate-100"
      />
    </div>
  );
}

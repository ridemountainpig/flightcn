"use client";

import { useEffect, useState } from "react";

import { codeToHtml } from "@/lib/shiki-highlight";
import { cn } from "@/lib/utils";

type ShikiCodeBlockProps = {
  code: string;
  className?: string;
};

export function ShikiCodeBlock({ code, className }: ShikiCodeBlockProps) {
  const [highlight, setHighlight] = useState<{
    code: string;
    html: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const out = await codeToHtml(code, {
          lang: "tsx",
          theme: "material-theme-darker",
        });
        if (!cancelled) setHighlight({ code, html: out });
      } catch {
        if (!cancelled) setHighlight(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  const html = highlight?.code === code ? highlight.html : null;

  if (html === null) {
    return (
      <pre
        className={cn("font-mono text-xs leading-6 text-slate-100", className)}
      >
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className={cn(
        "shiki-code-block [&_pre]:m-0! [&_pre]:bg-transparent! [&_pre]:p-0! [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-6",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

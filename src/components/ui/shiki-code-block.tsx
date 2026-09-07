"use client";

import { useEffect, useState } from "react";

import { codeToHtml } from "@/lib/shiki-highlight";
import { cn } from "@/lib/utils";

type ShikiCodeBlockProps = {
  code: string;
  className?: string;
  theme?: "material-theme-darker" | "github-light";
};

export function ShikiCodeBlock({
  code,
  className,
  theme = "material-theme-darker",
}: ShikiCodeBlockProps) {
  const [highlight, setHighlight] = useState<{
    theme: string;
    code: string;
    html: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const out = await codeToHtml(code, {
          lang: "tsx",
          theme,
        });
        if (!cancelled) setHighlight({ code, theme, html: out });
      } catch {
        if (!cancelled) setHighlight(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, theme]);

  const html =
    highlight?.code === code && highlight.theme === theme
      ? highlight.html
      : null;

  if (html === null) {
    return (
      <pre
        className={cn(
          "font-mono text-xs leading-6",
          theme === "github-light" ? "text-slate-800" : "text-slate-100",
          className,
        )}
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

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Defers mounting children until the block is near the viewport so multiple
 * MapLibre instances on the docs page do not all initialize at once.
 */
export function DocsMapMountWhenVisible({
  children,
  className,
  placeholderClassName,
}: {
  children: ReactNode;
  className?: string;
  placeholderClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {visible ? (
        children
      ) : (
        <div
          className={
            placeholderClassName ??
            "flex h-80 w-full items-center justify-center bg-[#d9d8d6] text-sm text-slate-500 sm:h-96"
          }
          aria-hidden
        >
          Map preview loads when in view
        </div>
      )}
    </div>
  );
}

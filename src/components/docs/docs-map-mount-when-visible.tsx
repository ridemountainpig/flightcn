"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Mounts children only while the block is near the viewport, and unmounts
 * them again once it scrolls far away. Browsers cap the number of live
 * WebGL contexts per page (~16 in Chrome, fewer in Safari); keeping every
 * MapLibre instance mounted after first view exceeds that cap on map-heavy
 * pages and blanks the oldest canvases.
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
  const [lastHeight, setLastHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        } else {
          // Remember the rendered height so swapping in the placeholder
          // does not collapse the slot and shift the scroll position.
          const height = el.offsetHeight;
          if (height > 0) setLastHeight(height);
          setVisible(false);
        }
      },
      { rootMargin: "600px 0px", threshold: 0 },
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
          style={lastHeight !== null ? { minHeight: lastHeight } : undefined}
          aria-hidden
        >
          Map preview loads when in view
        </div>
      )}
    </div>
  );
}

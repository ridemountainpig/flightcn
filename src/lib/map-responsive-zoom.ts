import { useEffect, useState } from "react";

/**
 * Docs / marketing maps are tuned on a wide layout (~desktop). At the same
 * zoom, a narrow viewport shows a smaller horizontal slice of the world.
 * We only correct below `MAP_ZOOM_RESPONSIVE_MAX_WIDTH_PX` so tablets and
 * desktops keep the authored `baseZoom`; wider screens are unchanged.
 */
export const MAP_ZOOM_REFERENCE_WIDTH_PX = 1100;

/** Viewports at or above this width use `baseZoom` with no adjustment. */
export const MAP_ZOOM_RESPONSIVE_MAX_WIDTH_PX = 768;

export function clampMapZoom(zoom: number): number {
  return Math.min(22, Math.max(0.2, zoom));
}

export function getResponsiveZoom(baseZoom: number, widthPx: number): number {
  if (widthPx >= MAP_ZOOM_RESPONSIVE_MAX_WIDTH_PX) {
    return baseZoom;
  }
  const w = Math.max(280, widthPx);
  const delta = Math.log2(w / MAP_ZOOM_REFERENCE_WIDTH_PX);
  return clampMapZoom(baseZoom + delta);
}

/**
 * Returns a zoom level adjusted for the current window width. SSR / first
 * paint uses `baseZoom` until `window` is measured.
 */
export function useResponsiveZoom(baseZoom: number): number {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    function measure() {
      setWidth(window.innerWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  if (width == null) return baseZoom;
  return getResponsiveZoom(baseZoom, width);
}

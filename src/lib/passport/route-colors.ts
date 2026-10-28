/**
 * Route colors offered on the passport page. Each reads clearly on the light
 * basemap and on the cream share images; the first is flightcn's accent.
 */
export const ROUTE_COLORS = [
  { name: "Orange", value: "#c65d24" },
  { name: "Red", value: "#dc2626" },
  { name: "Pink", value: "#db2777" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Blue", value: "#2563eb" },
  { name: "Teal", value: "#0d9488" },
  { name: "Green", value: "#16a34a" },
  { name: "Ink", value: "#1e293b" },
] as const;

export const DEFAULT_ROUTE_COLOR: string = ROUTE_COLORS[0].value;

const HEX_COLOR_PATTERN = /^#?([0-9a-f]{6})$/i;

/** "#2563eb" for a six-digit hex color, with or without "#"; otherwise undefined. */
export function normalizeRouteColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = HEX_COLOR_PATTERN.exec(value.trim());
  return match ? `#${match[1].toLowerCase()}` : undefined;
}

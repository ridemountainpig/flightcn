// No "use client" — server components (e.g. the footer) import these too.
export type ProductKey = "flight" | "satellite";

/** Shared by both playground pages so the switcher points the same way from either side. */
export const PLAYGROUND_HREFS: Record<ProductKey, string> = {
  flight: "/playground",
  satellite: "/satellite-playground",
};

import {
  decodeBase64UrlJson,
  encodeBase64UrlJson,
} from "@/components/playground/playground-share";

import {
  DEFAULT_SATELLITE_ORBIT_PLAYGROUND,
  LABEL_POSITIONS,
  LINE_STYLES,
  type SatelliteOrbitPlayground,
} from "./satellite-orbit-playground-controls";

type SharedState = {
  v: 1;
  orbit: Partial<SatelliteOrbitPlayground>;
};

export function encodeSatellitePlaygroundState(
  playground: SatelliteOrbitPlayground,
): string {
  const state: SharedState = { v: 1, orbit: playground };
  return encodeBase64UrlJson(state);
}

const ENUM_KEYS = {
  orbitLineStyle: LINE_STYLES,
  groundTrackLineStyle: LINE_STYLES,
  connectorLineStyle: LINE_STYLES,
  labelPosition: LABEL_POSITIONS,
} as const;

export function decodeSatellitePlaygroundState(
  encoded: string,
): SatelliteOrbitPlayground | null {
  const state = decodeBase64UrlJson(encoded) as SharedState | null;
  if (
    !state ||
    state.v !== 1 ||
    typeof state.orbit !== "object" ||
    state.orbit === null
  ) {
    return null;
  }

  // Merge shared values over fresh defaults so links survive schema drift;
  // only accept values whose type (and enum membership) matches the default.
  const merged = { ...DEFAULT_SATELLITE_ORBIT_PLAYGROUND };
  for (const key of Object.keys(merged) as (keyof SatelliteOrbitPlayground)[]) {
    const incoming = state.orbit[key];
    if (incoming === undefined || typeof incoming !== typeof merged[key]) {
      continue;
    }
    if (key in ENUM_KEYS) {
      const allowed: readonly string[] =
        ENUM_KEYS[key as keyof typeof ENUM_KEYS];
      if (!allowed.includes(incoming as string)) continue;
    }
    (merged as Record<string, unknown>)[key] = incoming;
  }
  return merged;
}

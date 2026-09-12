import { createLayer, type PlaygroundLayer } from "./playground-layers";
import {
  DEFAULT_MAP_CONFIG,
  type PlaygroundMapConfig,
} from "./playground-share";

export type PlaygroundPreset = {
  id: string;
  name: string;
  description: string;
  build: () => { layers: PlaygroundLayer[]; mapConfig: PlaygroundMapConfig };
};

/** Creates a layer from the palette defaults, then overrides selected props. */
function presetLayer<Type extends PlaygroundLayer["type"]>(
  type: Type,
  overrides: Partial<Extract<PlaygroundLayer, { type: Type }>["props"]>,
): PlaygroundLayer {
  const layer = createLayer(type) as Extract<PlaygroundLayer, { type: Type }>;
  return { ...layer, props: { ...layer.props, ...overrides } };
}

export const PLAYGROUND_PRESETS: readonly PlaygroundPreset[] = [
  {
    id: "live-tracker",
    name: "Live flight tracker",
    description: "Trans-Pacific flight in progress with an info card",
    build: () => ({
      layers: [
        presetLayer("flight-tracker", {
          from: "TPE",
          to: "LAX",
          progress: 0.58,
          completedColor: "#c65d24",
          remainingColor: "#94a3b8",
        }),
      ],
      mapConfig: { ...DEFAULT_MAP_CONFIG },
    }),
  },
  {
    id: "airline-network",
    name: "Airline network",
    description: "Weighted hub-and-spoke network out of TPE",
    build: () => ({
      layers: [
        presetLayer("flight-network", {
          routes: [
            { from: "TPE", to: "HND", value: 42 },
            { from: "TPE", to: "NRT", value: 35 },
            { from: "TPE", to: "ICN", value: 28 },
            { from: "TPE", to: "HKG", value: 38 },
            { from: "TPE", to: "SIN", value: 24 },
            { from: "TPE", to: "BKK", value: 21 },
            { from: "TPE", to: "KIX", value: 26 },
            { from: "TPE", to: "LAX", value: 17 },
            { from: "TPE", to: "SYD", value: 8 },
          ],
          highlightColor: "#c65d24",
        }),
      ],
      mapConfig: { ...DEFAULT_MAP_CONFIG },
    }),
  },
  {
    id: "flight-replay",
    name: "Flight replay",
    description: "Recorded descent track replayed by altitude",
    build: () => ({
      layers: [
        presetLayer("aircraft-trail", {
          playing: true,
          duration: 10000,
        }),
      ],
      mapConfig: { ...DEFAULT_MAP_CONFIG },
    }),
  },
  {
    id: "global-traffic",
    name: "Global traffic",
    description: "Animated long-haul flow on a dark globe",
    build: () => ({
      layers: [
        presetLayer("flight-flow", {
          routes: [
            { from: "TPE", to: "LAX", value: 12 },
            { from: "TPE", to: "SFO", value: 9 },
            { from: "TPE", to: "CDG", value: 7 },
            { from: "TPE", to: "LHR", value: 8 },
            { from: "TPE", to: "SYD", value: 6 },
            { from: "TPE", to: "DXB", value: 7 },
            { from: "TPE", to: "JFK", value: 5 },
          ],
          aircraftCount: 32,
          duration: 16000,
        }),
      ],
      mapConfig: { projection: "globe", theme: "dark" },
    }),
  },
];

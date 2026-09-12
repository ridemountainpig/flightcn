import {
  createLayer,
  layerComponentName,
  layerSnippetLines,
  type PlaygroundLayer,
  type PlaygroundLayerType,
} from "./playground-layers";

export type PlaygroundMapConfig = {
  theme: "light" | "dark";
  projection: "mercator" | "globe";
};

export const DEFAULT_MAP_CONFIG: PlaygroundMapConfig = {
  theme: "light",
  projection: "mercator",
};

const KNOWN_LAYER_TYPES: readonly PlaygroundLayerType[] = [
  "flight-route",
  "flight-multi-route",
  "flight-tracker",
  "flight-route-label",
  "flight-network",
  "flight-flow",
  "flight-range",
  "aircraft-trail",
  "flight-airport",
];

/* ------------------------------------------------------------------ */
/* Combined code generation                                            */
/* ------------------------------------------------------------------ */

export function buildPlaygroundSnippet(
  layers: readonly PlaygroundLayer[],
  mapConfig: PlaygroundMapConfig,
): string {
  const visibleLayers = layers.filter((layer) => layer.visible);

  const componentNames = [
    ...new Set(visibleLayers.map((layer) => layerComponentName(layer))),
  ];
  const importLines = [`import { Map } from "@/components/ui/map";`];
  if (componentNames.length > 0) {
    importLines.push(
      `import { ${componentNames.join(", ")} } from "@/components/ui/flight";`,
    );
  }

  const mapProps = [
    mapConfig.theme === "dark" ? `theme="dark"` : null,
    mapConfig.projection === "globe" ? `projection={{ type: "globe" }}` : null,
  ].filter((prop): prop is string => prop !== null);
  const mapOpenTag =
    mapProps.length > 0 ? `<Map ${mapProps.join(" ")}>` : "<Map>";

  if (visibleLayers.length === 0) {
    return `${importLines[0]}\n\n${mapOpenTag}</Map>`;
  }

  const body = visibleLayers
    .flatMap((layer) => layerSnippetLines(layer))
    .map((line) => `  ${line}`)
    .join("\n");

  return `${importLines.join("\n")}\n\n${mapOpenTag}\n${body}\n</Map>`;
}

/* ------------------------------------------------------------------ */
/* URL sharing                                                         */
/* ------------------------------------------------------------------ */

type SharedState = {
  v: 1;
  map: PlaygroundMapConfig;
  layers: { type: PlaygroundLayerType; visible: boolean; props: unknown }[];
};

export function encodePlaygroundState(
  layers: readonly PlaygroundLayer[],
  mapConfig: PlaygroundMapConfig,
): string {
  const state: SharedState = {
    v: 1,
    map: mapConfig,
    layers: layers.map((layer) => ({
      type: layer.type,
      visible: layer.visible,
      props: layer.props,
    })),
  };
  return encodeBase64UrlJson(state);
}

/** Encodes a JSON-serializable value as URL-safe base64 for `?s=` params. */
export function encodeBase64UrlJson(value: unknown): string {
  const json = JSON.stringify(value);
  return btoa(String.fromCharCode(...new TextEncoder().encode(json)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

/** Decodes a `?s=` param produced by {@link encodeBase64UrlJson}; null on garbage. */
export function decodeBase64UrlJson(encoded: string): unknown {
  try {
    const base64 = encoded.replaceAll("-", "+").replaceAll("_", "/");
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function decodePlaygroundState(encoded: string): {
  layers: PlaygroundLayer[];
  mapConfig: PlaygroundMapConfig;
} | null {
  const state = decodeBase64UrlJson(encoded) as SharedState | null;
  if (!state || state.v !== 1 || !Array.isArray(state.layers)) return null;

  try {
    const layers: PlaygroundLayer[] = [];
    for (const entry of state.layers) {
      if (!KNOWN_LAYER_TYPES.includes(entry.type)) continue;
      // Merge shared props over fresh defaults so links survive schema drift.
      const layer = createLayer(entry.type);
      layers.push({
        ...layer,
        visible: entry.visible !== false,
        props: {
          ...layer.props,
          ...(typeof entry.props === "object" && entry.props !== null
            ? entry.props
            : {}),
        },
      } as PlaygroundLayer);
    }

    const mapConfig: PlaygroundMapConfig = {
      theme: state.map?.theme === "dark" ? "dark" : "light",
      projection: state.map?.projection === "globe" ? "globe" : "mercator",
    };

    return { layers, mapConfig };
  } catch {
    return null;
  }
}

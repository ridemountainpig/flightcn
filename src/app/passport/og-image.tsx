import { ImageResponse } from "next/og";

import { OG_SIZE, OgCard, OgSceneLabel, loadOgFonts } from "@/lib/og/og-card";
import { buildGlobeScene, renderMapSvg } from "@/lib/og/passport-og";
import { builtInLookup } from "@/lib/passport/airport-lookup";
import {
  resolveFlights,
  SAMPLE_PASSPORT_FLIGHTS,
} from "@/registry/blocks/flight-passport/flight-passport-stats";

export { OG_SIZE };

/**
 * Card for the passport page itself (and the fallback for broken share
 * links): the sample passport drawn on the globe.
 */
export async function renderPassportPageOgImage(
  headers?: Record<string, string>,
) {
  const { flights } = resolveFlights(SAMPLE_PASSPORT_FLIGHTS, builtInLookup);
  // Same sphere as OgGlobe, so the layout matches the other section cards.
  const scene = buildGlobeScene(
    flights,
    { cx: 870, cy: 310, r: 325 },
    { maxLabels: 4, labelMinLeft: 640 },
  );
  return new ImageResponse(
    <OgCard
      kicker="FLIGHTCN · PASSPORT"
      title="passport"
      sub={[
        { text: "Map every flight you've taken —" },
        { text: "lifetime stats", accent: true },
        { text: "and a year in review." },
      ]}
      command="npx shadcn add @flightcn/flight-passport"
    >
      {renderMapSvg(scene, OG_SIZE)}
      {scene.labels.map((label) => (
        <OgSceneLabel key={label.code} left={label.left} top={label.top}>
          {label.code}
        </OgSceneLabel>
      ))}
    </OgCard>,
    { ...OG_SIZE, fonts: await loadOgFonts(), headers },
  );
}

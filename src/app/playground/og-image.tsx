import { ImageResponse } from "next/og";

import {
  OG_SIZE,
  OgCard,
  OgGlobe,
  ogOrbit,
  OgSceneLabel,
  loadOgFonts,
} from "@/lib/og/og-card";

export { OG_SIZE };

/**
 * Shared card renderer for the playground's opengraph-image and twitter-image
 * routes, drawn in the style of the static site OG image.
 */
export async function renderPlaygroundOgImage() {
  return new ImageResponse(
    <OgCard
      kicker="FLIGHTCN · PLAYGROUND"
      title="playground"
      sub={[
        { text: "Stack" },
        { text: "routes, trackers & orbits", accent: true },
        { text: "on one map, then copy the code." },
      ]}
      command="npx shadcn@latest add @flightcn/flight"
    >
      <OgGlobe>
        {ogOrbit}
        {/* flight routes */}
        <path
          d="M 848 98 Q 1010 120 1090 240"
          fill="none"
          stroke="#cf7a45"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 715 435 Q 880 515 1005 480"
          fill="none"
          stroke="#c65d24"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M 715 435 Q 920 120 1090 240"
          fill="none"
          stroke="#c65d24"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        {/* airports — orange hubs with halos, dark outstations */}
        <circle cx="848" cy="98" r="8" fill="#1d241c" />
        <circle cx="1005" cy="480" r="8" fill="#1d241c" />
        <circle cx="715" cy="435" r="17" fill="#c65d2440" />
        <circle cx="715" cy="435" r="10" fill="#c65d24" />
        <circle cx="1090" cy="240" r="17" fill="#c65d2440" />
        <circle cx="1090" cy="240" r="10" fill="#c65d24" />
      </OgGlobe>
      <OgSceneLabel left={775} top={66}>
        NRT
      </OgSceneLabel>
      <OgSceneLabel left={634} top={418}>
        TPE
      </OgSceneLabel>
      <OgSceneLabel left={1112} top={256}>
        SFO
      </OgSceneLabel>
      <OgSceneLabel left={1030} top={496}>
        SIN
      </OgSceneLabel>
    </OgCard>,
    { ...OG_SIZE, fonts: await loadOgFonts() },
  );
}

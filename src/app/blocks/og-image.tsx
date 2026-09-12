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

/** Floating mini UI card, suggesting a prebuilt block over the map. */
function MiniBlock({
  left,
  top,
  width,
  height,
  bars,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  bars: number[];
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        border: "2px solid #e5e1d3",
        borderRadius: 16,
        padding: "14px 16px",
        boxShadow: "0 12px 28px rgba(70, 58, 34, 0.10)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: 11,
            height: 11,
            borderRadius: 8,
            backgroundColor: "#c65d24",
          }}
        />
        <div
          style={{
            marginLeft: 9,
            width: width * 0.4,
            height: 9,
            borderRadius: 5,
            backgroundColor: "#d9d5c6",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          marginTop: "auto",
        }}
      >
        {bars.map((barHeight, index) => (
          <div
            key={index}
            style={{
              width: (width - 32 - (bars.length - 1) * 8) / bars.length,
              height: barHeight,
              marginRight: index === bars.length - 1 ? 0 : 8,
              borderRadius: 4,
              backgroundColor: index === 1 ? "#c65d24" : "#e0dccd",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Shared card renderer for the blocks page's opengraph-image and
 * twitter-image routes, drawn in the style of the static site OG image.
 */
export async function renderBlocksOgImage() {
  return new ImageResponse(
    <OgCard
      kicker="FLIGHTCN · BLOCKS"
      title="blocks"
      sub={[
        { text: "Prebuilt" },
        { text: "flight map blocks", accent: true },
        { text: "for React — install & restyle." },
      ]}
      command="npx shadcn@latest add @flightcn/<block>"
    >
      <OgGlobe>
        {ogOrbit}
        {/* flight route */}
        <path
          d="M 700 430 Q 900 150 1070 235"
          fill="none"
          stroke="#c65d24"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <circle cx="700" cy="430" r="17" fill="#c65d2440" />
        <circle cx="700" cy="430" r="10" fill="#c65d24" />
        <circle cx="1070" cy="235" r="17" fill="#c65d2440" />
        <circle cx="1070" cy="235" r="10" fill="#c65d24" />
      </OgGlobe>
      <OgSceneLabel left={632} top={440}>
        TPE
      </OgSceneLabel>
      <OgSceneLabel left={1092} top={250}>
        SFO
      </OgSceneLabel>
      <MiniBlock
        left={655}
        top={80}
        width={195}
        height={118}
        bars={[22, 44, 30, 38]}
      />
      <MiniBlock
        left={975}
        top={412}
        width={205}
        height={128}
        bars={[30, 48, 24, 40, 34]}
      />
    </OgCard>,
    { ...OG_SIZE, fonts: await loadOgFonts() },
  );
}

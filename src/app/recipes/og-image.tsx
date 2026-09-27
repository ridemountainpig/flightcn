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

/** Floating numbered-steps card, suggesting a step-by-step recipe. */
function StepsCard({
  left,
  top,
  steps,
}: {
  left: number;
  top: number;
  steps: string[];
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        border: "2px solid #e5e1d3",
        borderRadius: 16,
        padding: "16px 20px",
        boxShadow: "0 12px 28px rgba(70, 58, 34, 0.10)",
      }}
    >
      {steps.map((step, index) => (
        <div
          key={step}
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: index === 0 ? 0 : 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: 9,
              backgroundColor: index === 0 ? "#c65d24" : "#efe9da",
              color: index === 0 ? "#ffffff" : "#4a4437",
              fontFamily: "Geist Mono",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {index + 1}
          </div>
          <div
            style={{
              marginLeft: 11,
              fontFamily: "Geist Mono",
              fontSize: 15,
              fontWeight: 500,
              color: "#221d12",
            }}
          >
            {step}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Shared card renderer for the recipes pages' opengraph-image and
 * twitter-image routes, drawn in the style of the static site OG image.
 */
export async function renderRecipesOgImage() {
  return new ImageResponse(
    <OgCard
      kicker="FLIGHTCN · RECIPES"
      title="recipes"
      sub={[
        { text: "Real flight features," },
        { text: "step by step", accent: true },
        { text: "— demo, data, full code." },
      ]}
      command="npx shadcn@latest add @flightcn/flight"
    >
      <OgGlobe>
        {ogOrbit}
        {/* tracked flight route: completed + remaining */}
        <path
          d="M 700 430 Q 830 260 940 265"
          fill="none"
          stroke="#c65d24"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <path
          d="M 940 265 Q 1010 270 1070 320"
          fill="none"
          stroke="#c65d24"
          strokeWidth="5.5"
          strokeDasharray="2 12"
          strokeLinecap="round"
        />
        <circle cx="700" cy="430" r="17" fill="#c65d2440" />
        <circle cx="700" cy="430" r="10" fill="#c65d24" />
        <circle cx="940" cy="265" r="20" fill="#c65d2433" />
        <circle cx="940" cy="265" r="12" fill="#c65d24" />
        <circle cx="1070" cy="320" r="17" fill="#c65d2440" />
        <circle cx="1070" cy="320" r="10" fill="#c65d24" />
      </OgGlobe>
      <OgSceneLabel left={632} top={440}>
        TPE
      </OgSceneLabel>
      <OgSceneLabel left={1092} top={335}>
        NRT
      </OgSceneLabel>
      <StepsCard
        left={935}
        top={68}
        steps={["Live tracker", "Route network", "Flight history"]}
      />
    </OgCard>,
    { ...OG_SIZE, fonts: await loadOgFonts() },
  );
}

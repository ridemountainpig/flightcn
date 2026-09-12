import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";

export const OG_SIZE = { width: 1200, height: 630 };

const FONTS_DIR = path.join(process.cwd(), "src/lib/og/fonts");

/** Font set for ImageResponse — Geist + Geist Mono, matching the site. */
export async function loadOgFonts() {
  const files = [
    ["geist-latin-400-normal.woff", "Geist", 400],
    ["geist-latin-500-normal.woff", "Geist", 500],
    ["geist-latin-700-normal.woff", "Geist", 700],
    ["geist-mono-latin-500-normal.woff", "Geist Mono", 500],
    ["geist-mono-latin-600-normal.woff", "Geist Mono", 600],
  ] as const;
  return Promise.all(
    files.map(async ([file, name, weight]) => ({
      name,
      weight,
      style: "normal" as const,
      data: (await readFile(path.join(FONTS_DIR, file))).buffer as ArrayBuffer,
    })),
  );
}

export type OgSubSegment = { text: string; accent?: boolean };

const INK = "#221d12";
const MUTED = "#4a4437";
const ACCENT = "#c65d24";

/** Lucide "plane" glyph, used in the badge next to the kicker. */
function PlaneBadge() {
  return (
    <div
      style={{
        width: 58,
        height: 58,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
        background: "linear-gradient(160deg, #d3692b, #bd5820)",
      }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="#ffffff">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    </div>
  );
}

/**
 * Shared 1200x630 card in the style of the static site OG image: dotted-grid
 * cream background, a graticule globe scene on the right (passed as
 * children), and the badge / kicker / title / subtitle / command column on
 * the left.
 */
export function OgCard({
  kicker,
  title,
  sub,
  command,
  children,
}: {
  kicker: string;
  title: string;
  sub: OgSubSegment[];
  command: string;
  children: ReactNode;
}) {
  const words = sub.flatMap((segment) =>
    segment.text
      .split(" ")
      .filter(Boolean)
      .map((word) => ({ word, accent: segment.accent })),
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "#faf9f3",
        backgroundImage:
          "radial-gradient(circle, #ddd8c6 2.2px, transparent 2.2px)",
        backgroundSize: "40px 40px",
        fontFamily: "Geist",
      }}
    >
      {children}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          paddingLeft: 80,
          width: 690,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <PlaneBadge />
          <div
            style={{
              marginLeft: 22,
              fontSize: 21,
              letterSpacing: 7,
              fontWeight: 500,
              color: "#6b7565",
            }}
          >
            {kicker}
          </div>
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: title.length > 7 ? 84 : 100,
            fontWeight: 700,
            letterSpacing: -5,
            color: INK,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexWrap: "wrap",
            width: 520,
            fontSize: 31,
          }}
        >
          {words.map(({ word, accent }, index) => (
            <span
              key={index}
              style={{
                marginRight: 9,
                marginBottom: 8,
                color: accent ? ACCENT : MUTED,
                fontWeight: accent ? 700 : 400,
              }}
            >
              {word}
            </span>
          ))}
        </div>
        <div
          style={{
            marginTop: 32,
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            backgroundColor: "#ffffff",
            border: "2px solid #e6e2d4",
            borderRadius: 14,
            padding: "17px 26px",
            fontFamily: "Geist Mono",
            fontWeight: 500,
            fontSize: 21,
            color: "#2c2a22",
            boxShadow: "0 10px 24px rgba(70, 58, 34, 0.08)",
          }}
        >
          <span style={{ color: ACCENT, marginRight: 16 }}>$</span>
          <span style={{ whiteSpace: "nowrap" }}>{command}</span>
        </div>
      </div>
    </div>
  );
}

/** Graticule globe backdrop shared by the OG scenes. */
export function OgGlobe({ children }: { children?: ReactNode }) {
  return (
    <svg
      width="1200"
      height="630"
      viewBox="0 0 1200 630"
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <circle
        cx="870"
        cy="310"
        r="325"
        fill="#ecede6"
        stroke="#d2d6ca"
        strokeWidth="2.5"
      />
      <ellipse
        cx="870"
        cy="310"
        rx="110"
        ry="325"
        fill="none"
        stroke="#d7dbcf"
        strokeWidth="2"
      />
      <ellipse
        cx="870"
        cy="310"
        rx="215"
        ry="325"
        fill="none"
        stroke="#d7dbcf"
        strokeWidth="2"
      />
      <ellipse
        cx="870"
        cy="310"
        rx="300"
        ry="325"
        fill="none"
        stroke="#dee2d6"
        strokeWidth="1.5"
      />
      <path
        d="M 631 90 Q 870 13 1109 90"
        fill="none"
        stroke="#d7dbcf"
        strokeWidth="2"
      />
      <path
        d="M 564 200 Q 870 162 1176 200"
        fill="none"
        stroke="#d7dbcf"
        strokeWidth="2"
      />
      <path d="M 545 310 L 1195 310" stroke="#d7dbcf" strokeWidth="2" />
      <path
        d="M 564 420 Q 870 458 1176 420"
        fill="none"
        stroke="#d7dbcf"
        strokeWidth="2"
      />
      <path
        d="M 631 530 Q 870 607 1109 530"
        fill="none"
        stroke="#d7dbcf"
        strokeWidth="2"
      />
      {children}
    </svg>
  );
}

/**
 * Dotted satellite orbit — a tilted ellipse around the globe (center
 * 860,330 / 400x190 / -18°) — with the satellite badge riding it at the
 * globe's right edge. Exported as a pre-built element (not a component):
 * satori can't resolve function components nested inside an <svg>.
 */
export const ogOrbit = (
  <g>
    <path
      d="M 479.6 453.6 A 400 190 -18 0 1 1240.4 206.4 A 400 190 -18 0 1 479.6 453.6"
      fill="none"
      stroke="#d3692b"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeDasharray="1 15"
    />
    <circle
      cx="1170"
      cy="370"
      r="24"
      fill="#ffffff"
      stroke="#e3dfd2"
      strokeWidth="2"
    />
    <path
      d="M 1154 370 L 1186 370"
      stroke="#c65d24"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <circle cx="1170" cy="370" r="7" fill="#c65d24" />
  </g>
);

/** Mono uppercase IATA-style label, absolutely positioned over the scene. */
export function OgSceneLabel({
  left,
  top,
  children,
}: {
  left: number;
  top: number;
  children: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        fontFamily: "Geist Mono",
        fontWeight: 600,
        fontSize: 23,
        letterSpacing: 1,
        color: "#241f14",
      }}
    >
      {children}
    </div>
  );
}

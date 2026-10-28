import {
  geoDistance,
  geoGraticule10,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import { ImageResponse } from "next/og";

import landData from "@/data/world-land-110m.json";
import { DEFAULT_FOOTER_TEXT } from "@/lib/passport/footer-text";
import {
  CARD_MAP_BOX,
  CARD_SIZE,
  centroid,
  DEG,
  layoutFlatMap,
  lngLat,
  MAP_STYLE,
  rankAirports,
  routeGeometry,
  routeWidths,
  type Box,
} from "@/lib/passport/passport-geo";
import {
  computePassportStats,
  computeYearInReview,
  convertDistance,
  formatAroundEarth,
  formatCompactNumber,
  formatFlightDate,
  formatInteger,
  type DistanceUnit,
  type ResolvedFlight,
} from "@/registry/blocks/flight-passport/flight-passport-stats";

import { loadCountryFlags } from "./flags";
import {
  OG_COLORS,
  OG_SIZE,
  OgSceneLabel,
  PlaneBadge,
  loadOgFonts,
  ogBackgroundStyle,
} from "./og-card";

const LAND = landData as unknown as GeoPermissibleObjects;
const GRATICULE = geoGraticule10() as GeoPermissibleObjects;
/** Lucide "plane" glyph. */
const PLANE_PATH =
  "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z";

const COLORS = {
  sphere: "#ecede6",
  sphereStroke: "#d2d6ca",
  land: "#ddd8c5",
  landStroke: "#cbc5ae",
  graticule: "#d9dcd0",
  label: "#6b7565",
  mrz: "#7b7563",
  band: "#f1eee3",
  rule: "#e2ddcc",
};

type Circle = { cx: number; cy: number; r: number };
type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Mixes `amount` (0–1) of `other` into `color`; both are "#rrggbb". */
function mixColors(color: string, other: string, amount: number) {
  const from = hexToRgb(color);
  const to = hexToRgb(other);
  return `#${from
    .map((channel, index) =>
      Math.round(channel + (to[index] - channel) * amount)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function relativeLuminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The route color as text color: darkened toward ink until it has 3:1
 * contrast with the background, so a pale custom color stays legible.
 */
function readableAccent(color: string, background: string) {
  const backgroundLuminance = relativeLuminance(background);
  for (let step = 0; step <= 10; step += 1) {
    const candidate = mixColors(color, OG_COLORS.ink, step / 10);
    if (
      (backgroundLuminance + 0.05) / (relativeLuminance(candidate) + 0.05) >=
      3
    ) {
      return candidate;
    }
  }
  return OG_COLORS.ink;
}

export type MapScene = {
  land: string;
  graticule?: string;
  routes: { d: string; width: number }[];
  dots: { x: number; y: number; r: number; home: boolean }[];
  labels: { code: string; left: number; top: number }[];
  /** Globe scenes are clipped to this circle. */
  circle?: Circle;
};

/**
 * The flights on an orthographic globe that turns toward their airports and
 * zooms in when they sit close together.
 */
export function buildGlobeScene(
  flights: readonly ResolvedFlight[],
  circle: Circle,
  {
    maxLabels = 4,
    labelMinLeft = 0,
  }: { maxLabels?: number; labelMinLeft?: number } = {},
): MapScene {
  const ranked = rankAirports(flights);
  const center = centroid(ranked);
  const farthest = Math.max(
    0,
    ...ranked.map(({ airport }) => geoDistance(center, lngLat(airport))),
  );
  const radius =
    farthest > 0 && farthest < 89 * DEG
      ? Math.min(
          3.2 * circle.r,
          Math.max(circle.r, (0.85 * circle.r) / Math.sin(farthest)),
        )
      : circle.r;
  const projection = geoOrthographic()
    .rotate([-center[0], -center[1]])
    .scale(radius)
    .translate([circle.cx, circle.cy])
    .clipAngle(90);
  const path = geoPath(projection);

  const routes = routeWidths(flights, 2, 3.5)
    .map(({ route, width }) => ({
      d: path(routeGeometry(route.a, route.b)) ?? "",
      width,
    }))
    .filter((route) => route.d);

  const maxVisits = Math.max(1, ranked[0]?.visits ?? 1);
  const home = ranked[0]?.airport.code;
  const dots: MapScene["dots"] = [];
  const positions = new Map<string, [number, number]>();
  for (const { airport, visits } of ranked) {
    if (geoDistance(center, lngLat(airport)) > Math.PI / 2 - 0.01) continue;
    const point = projection(lngLat(airport));
    if (!point) continue;
    const [x, y] = point;
    if (Math.hypot(x - circle.cx, y - circle.cy) > circle.r - 4) continue;
    positions.set(airport.code, [x, y]);
    dots.push({
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      r: 4 + 4 * Math.sqrt(visits / maxVisits),
      home: airport.code === home,
    });
  }

  // Among airports with equal visits, label the farthest from the globe's
  // center first: a trip abroad says more than another nearby hop.
  const labelOrder = [...ranked]
    .filter(({ airport }) => positions.has(airport.code))
    .sort(
      (a, b) =>
        b.visits - a.visits ||
        geoDistance(center, lngLat(b.airport)) -
          geoDistance(center, lngLat(a.airport)),
    );
  const labels: MapScene["labels"] = [];
  for (const { airport } of labelOrder) {
    if (labels.length >= maxLabels) break;
    const [x, y] = positions.get(airport.code) ?? [0, 0];
    const left = Math.round(x + 12);
    const top = Math.round(y - 36);
    const overlaps = labels.some(
      (label) =>
        Math.abs(label.left - left) < 70 && Math.abs(label.top - top) < 30,
    );
    if (left >= labelMinLeft && !overlaps) {
      labels.push({ code: airport.code, left, top });
    }
  }

  return {
    land: path(LAND) ?? "",
    graticule: path(GRATICULE) ?? "",
    routes,
    dots: dots.reverse(),
    labels,
    circle,
  };
}

/**
 * The flights on the passport page's flat map. A plate has only the land:
 * the video draws the routes and airports over it as they fly.
 */
export function buildFlatScene(
  flights: readonly ResolvedFlight[],
  box: Box,
  { plate = false }: { plate?: boolean } = {},
): MapScene {
  const layout = layoutFlatMap(flights, box);
  return {
    land: geoPath(layout.projection)(LAND) ?? "",
    routes: plate ? [] : layout.routes.map(({ d, width }) => ({ d, width })),
    dots: plate
      ? []
      : layout.dots.map(({ x, y, r, home }) => ({ x, y, r, home })),
    labels: [],
  };
}

/**
 * SVG for a scene: land, graticule (globes only), routes, airports. Groups
 * use <g>, not fragments: satori serializes <svg> children by tag name and
 * can't handle fragments or components in there.
 */
export function renderMapSvg(
  scene: MapScene,
  size: { width: number; height: number },
  routeColor: string = OG_COLORS.accent,
) {
  const clipId = "passport-map-clip";
  const content = (
    <g>
      {scene.graticule ? (
        <path
          d={scene.graticule}
          fill="none"
          stroke={COLORS.graticule}
          strokeWidth="1.2"
        />
      ) : null}
      <path
        d={scene.land}
        fill={COLORS.land}
        stroke={COLORS.landStroke}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {scene.routes.map((route, index) => (
        <path
          key={`route-${index}`}
          d={route.d}
          fill="none"
          stroke={routeColor}
          strokeWidth={route.width.toFixed(1)}
          strokeOpacity={MAP_STYLE.routeOpacity}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {scene.dots.map((dot, index) => (
        <circle
          key={`dot-${index}`}
          cx={dot.x}
          cy={dot.y}
          r={dot.r.toFixed(1)}
          fill={dot.home ? routeColor : MAP_STYLE.dotFill}
          stroke={MAP_STYLE.dotStroke}
          strokeWidth={MAP_STYLE.dotStrokeWidth}
        />
      ))}
    </g>
  );

  return (
    <svg
      width={size.width}
      height={size.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      {scene.circle ? (
        <defs>
          <clipPath id={clipId}>
            <circle
              cx={scene.circle.cx}
              cy={scene.circle.cy}
              r={scene.circle.r - 1.5}
            />
          </clipPath>
        </defs>
      ) : null}
      {scene.circle ? (
        <circle
          cx={scene.circle.cx}
          cy={scene.circle.cy}
          r={scene.circle.r}
          fill={COLORS.sphere}
          stroke={COLORS.sphereStroke}
          strokeWidth="2.5"
        />
      ) : null}
      {scene.circle ? <g clipPath={`url(#${clipId})`}>{content}</g> : content}
    </svg>
  );
}

function plural(count: number, word: string, pluralWord = `${word}s`) {
  return `${formatInteger(count)} ${count === 1 ? word : pluralWord}`;
}

/** "84h" for short totals, "8d 1h" from two days up. */
function formatFlightTime(hours: number) {
  const total = Math.round(hours);
  if (total < 48) return `${total}h`;
  return `${Math.floor(total / 24)}d ${total % 24}h`;
}

/** Text in machine-readable-zone style: capitals, digits and dots, with "<" between words. */
function mrzText(text: string) {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9.]+/g, "<")
    .replace(/^<+|<+$/g, "");
}

/** Machine-readable-zone style lines, padded with "<" to equal length. */
function buildMrz(lines: string[]) {
  const clean = (line: string) =>
    line.toUpperCase().replace(/[^A-Z0-9.<]+/g, "<");
  const cleaned = lines.map(clean);
  const width = Math.max(44, ...cleaned.map((line) => line.length));
  return cleaned.map((line) => line.padEnd(width, "<"));
}

export type PassportSummary = {
  kicker: string;
  /** Headline for the landscape card, e.g. "My 2026 in flights". */
  title: string;
  /** Headline for the portrait card, e.g. "2026 in flights". */
  cardTitle: string;
  flights: number;
  distance: { value: string; unit: string };
  flightTime: string;
  airports: number;
  countries: number;
  subline: string;
  countryNames: string[];
  stampCodes: string[];
  details: { label: string; value: string }[];
  mrz: string[];
  scopeFlights: ResolvedFlight[];
  /** The year is still going, so "so far" turns into "in review" on Jan 1. */
  timeSensitive: boolean;
};

/** Everything the share images say about a passport or one year of it. */
export function summarizePassport({
  flights,
  year,
  unit,
  footer,
}: {
  flights: readonly ResolvedFlight[];
  year?: number;
  unit: DistanceUnit;
  /** The owner's text for the end of the bottom line. */
  footer?: string;
}): PassportSummary {
  const review = year ? computeYearInReview(flights, year) : null;
  const scopeFlights = review
    ? flights.filter((flight) => flight.year === review.year)
    : [...flights];
  const stats = review?.stats ?? computePassportStats(scopeFlights);
  const lifetime = review ? computePassportStats(flights) : stats;
  const home = lifetime.home;
  const distance = convertDistance(stats.distanceKm, unit);
  const scopeLabel = review
    ? `${review.year} ${review.isCurrentYear ? "so far" : "in review"}`
    : "all time";
  const valid =
    stats.first && stats.last
      ? `${formatFlightDate(stats.first.date?.slice(0, 7))} – ${formatFlightDate(
          stats.last.date?.slice(0, 7),
        )}`
      : undefined;

  return {
    kicker: `FLIGHTCN · ${scopeLabel.toUpperCase()}`,
    title: review ? `My ${review.year} in flights` : "My flight passport",
    cardTitle: review ? `${review.year} in flights` : "Flight passport",
    flights: stats.flights,
    distance: { value: formatCompactNumber(distance), unit },
    flightTime: formatFlightTime(stats.hours),
    airports: stats.airportVisits.length,
    countries: stats.countries.length,
    subline: [
      review && !review.firstYearOnRecord && review.newAirports.length > 0
        ? `+${plural(review.newAirports.length, "new airport")}`
        : null,
      formatAroundEarth(stats.aroundEarth),
    ]
      .filter(Boolean)
      .join(" · "),
    countryNames: stats.countries.map((entry) => entry.country),
    stampCodes: stats.airportVisits
      .slice(0, 7)
      .map((entry) => entry.airport.code),
    details: [
      { label: "Issued by", value: "flightcn" },
      ...(home ? [{ label: "Home airport", value: home.code }] : []),
      ...(valid ? [{ label: "Valid", value: valid }] : []),
      ...(stats.longest
        ? [
            {
              label: "Longest flight",
              value: `${stats.longest.from.code} – ${stats.longest.to.code}`,
            },
          ]
        : []),
    ],
    mrz: buildMrz([
      `P<${home?.code ?? "XXX"}FLIGHT<PASSPORT<<${scopeLabel}`,
      `${stats.flights}FLT<${Math.round(distance)}${unit}<${stats.airportVisits.length}APT<${stats.countries.length}CTY<<${
        mrzText(footer ?? "") || mrzText(DEFAULT_FOOTER_TEXT)
      }`,
    ]),
    scopeFlights,
    timeSensitive: review?.isCurrentYear ?? false,
  };
}

type Flag = { iso: string; src: string };

function FlagRow({
  flags,
  total,
  size,
  max,
}: {
  flags: Flag[];
  total: number;
  size: number;
  max: number;
}) {
  const shown = flags.slice(0, max);
  const more = total - shown.length;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map((flag) => (
        // eslint-disable-next-line @next/next/no-img-element -- satori renders plain <img>
        <img
          key={flag.iso}
          src={flag.src}
          width={size}
          height={size}
          alt=""
          style={{ marginRight: Math.round(size * 0.22) }}
        />
      ))}
      {more > 0 ? (
        <span
          style={{
            fontFamily: "Geist Mono",
            fontWeight: 600,
            fontSize: Math.round(size * 0.5),
            color: COLORS.label,
          }}
        >
          +{more}
        </span>
      ) : null}
    </div>
  );
}

function PlaneIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d={PLANE_PATH} />
    </svg>
  );
}

function PassportOgCard({
  summary,
  scene,
  flags,
  routeColor,
}: {
  summary: PassportSummary;
  scene: MapScene;
  flags: Flag[];
  routeColor: string;
}) {
  const stats = [
    { label: "Flights", value: formatInteger(summary.flights) },
    {
      label: "Distance",
      value: summary.distance.value,
      unit: summary.distance.unit,
    },
    { label: "Airports", value: formatInteger(summary.airports) },
    { label: "Countries", value: formatInteger(summary.countries) },
  ];
  const mrzFont = Math.min(
    20,
    Math.floor((1056 / summary.mrz[0].length - 4) / 0.6),
  );
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        ...ogBackgroundStyle,
        fontFamily: "Geist",
      }}
    >
      {renderMapSvg(scene, OG_SIZE, routeColor)}
      {scene.labels.map((label) => (
        <OgSceneLabel key={label.code} left={label.left} top={label.top}>
          {label.code}
        </OgSceneLabel>
      ))}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          paddingLeft: 72,
          paddingTop: 44,
          width: 620,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <PlaneBadge />
          <div
            style={{
              marginLeft: 20,
              fontSize: 18,
              letterSpacing: 5,
              fontWeight: 500,
              color: COLORS.label,
            }}
          >
            {summary.kicker}
          </div>
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 54,
            fontWeight: 700,
            letterSpacing: -2.5,
            color: OG_COLORS.ink,
          }}
        >
          {summary.title}
        </div>
        <div
          style={{
            marginTop: 20,
            display: "flex",
            flexWrap: "wrap",
            width: 500,
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                width: 240,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span
                  style={{
                    fontFamily: "Geist Mono",
                    fontWeight: 600,
                    fontSize: 40,
                    color: OG_COLORS.ink,
                  }}
                >
                  {stat.value}
                </span>
                {stat.unit ? (
                  <span
                    style={{
                      marginLeft: 8,
                      fontFamily: "Geist Mono",
                      fontWeight: 500,
                      fontSize: 19,
                      color: OG_COLORS.muted,
                    }}
                  >
                    {stat.unit}
                  </span>
                ) : null}
              </div>
              <span
                style={{
                  fontSize: 15,
                  letterSpacing: 3,
                  fontWeight: 500,
                  color: COLORS.label,
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
        {flags.length > 0 ? (
          <div style={{ marginTop: 4, display: "flex" }}>
            <FlagRow
              flags={flags}
              total={summary.countryNames.length}
              size={34}
              max={10}
            />
          </div>
        ) : null}
        <div
          style={{
            marginTop: 16,
            fontSize: 24,
            fontWeight: 700,
            color: readableAccent(
              routeColor,
              ogBackgroundStyle.backgroundColor,
            ),
          }}
        >
          {summary.subline}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 78,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 72,
          backgroundColor: COLORS.band,
          borderTop: `2px solid ${COLORS.rule}`,
          fontFamily: "Geist Mono",
          fontWeight: 500,
          fontSize: mrzFont,
          letterSpacing: 4,
          color: COLORS.mrz,
        }}
      >
        <div style={{ display: "flex" }}>{summary.mrz[0]}</div>
        <div style={{ display: "flex", marginTop: 4 }}>{summary.mrz[1]}</div>
      </div>
    </div>
  );
}

function PassportCard({
  summary,
  scene,
  flags,
  routeColor,
}: {
  summary: PassportSummary;
  scene: MapScene;
  flags: Flag[];
  routeColor: string;
}) {
  const { width } = CARD_SIZE;
  const stats = [
    {
      label: "Distance",
      value: summary.distance.value,
      unit: summary.distance.unit,
    },
    { label: "Flight time", value: summary.flightTime },
    { label: "Airports", value: formatInteger(summary.airports) },
    { label: "Countries", value: formatInteger(summary.countries) },
  ];
  // Geist Mono advances ~0.6em per character, plus the letter spacing.
  const mrzFont = Math.min(
    30,
    Math.floor(((width - 112) / summary.mrz[0].length - 3) / 0.6),
  );
  const stamps = summary.stampCodes.slice(0, 6);
  const stampColor = readableAccent(routeColor, COLORS.band);
  const stampTint = mixColors(routeColor, COLORS.band, 0.55);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        ...ogBackgroundStyle,
        fontFamily: "Geist",
      }}
    >
      {renderMapSvg(scene, CARD_SIZE, routeColor)}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 92,
          padding: "0 52px",
          backgroundColor: COLORS.band,
          borderBottom: `2px dashed ${COLORS.rule}`,
        }}
      >
        <PlaneIcon size={28} color={stampColor} />
        {stamps.map((code, index) => (
          <div key={code} style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "Geist Mono",
                fontWeight: 600,
                fontSize: 30,
                letterSpacing: 2,
                color: index % 2 === 0 ? stampColor : "#b3a37f",
              }}
            >
              {code}
            </span>
            <div style={{ display: "flex", marginLeft: 22 }}>
              <PlaneIcon
                size={24}
                color={index % 2 === 0 ? stampTint : "#cfc4a8"}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", height: 538 }} />

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          height: 70,
          alignItems: "center",
        }}
      >
        <FlagRow
          flags={flags}
          total={summary.countryNames.length}
          size={46}
          max={12}
        />
      </div>

      <div
        style={{
          display: "flex",
          margin: "8px 52px 0",
          borderTop: `3px dashed ${COLORS.rule}`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "30px 64px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <PlaneBadge />
          <div
            style={{
              marginLeft: 20,
              fontSize: 22,
              letterSpacing: 6,
              fontWeight: 500,
              color: COLORS.label,
            }}
          >
            {summary.kicker}
          </div>
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 70,
            fontWeight: 700,
            letterSpacing: -3,
            color: OG_COLORS.ink,
          }}
        >
          {summary.cardTitle}
        </div>
        <div style={{ display: "flex", marginTop: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 360 }}>
            <span
              style={{
                fontFamily: "Geist Mono",
                fontWeight: 600,
                fontSize: 108,
                lineHeight: 1,
                color: OG_COLORS.ink,
              }}
            >
              {formatInteger(summary.flights)}
            </span>
            <span
              style={{ marginTop: 6, fontSize: 32, color: OG_COLORS.muted }}
            >
              {summary.flights === 1 ? "flight" : "flights"}
            </span>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", marginTop: 6 }}
          >
            {summary.details.map((detail) => (
              <div
                key={detail.label}
                style={{ display: "flex", marginBottom: 8 }}
              >
                <span style={{ width: 190, fontSize: 24, color: COLORS.label }}>
                  {detail.label}
                </span>
                <span
                  style={{
                    fontFamily: "Geist Mono",
                    fontWeight: 500,
                    fontSize: 24,
                    color: OG_COLORS.ink,
                  }}
                >
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 28 }}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{ display: "flex", flexDirection: "column", width: 238 }}
            >
              <span style={{ fontSize: 22, color: COLORS.label }}>
                {stat.label}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "Geist Mono",
                    fontWeight: 600,
                    fontSize: 40,
                    color: OG_COLORS.ink,
                  }}
                >
                  {stat.value}
                </span>
                {stat.unit ? (
                  <span
                    style={{
                      marginLeft: 6,
                      fontFamily: "Geist Mono",
                      fontSize: 20,
                      color: OG_COLORS.muted,
                    }}
                  >
                    {stat.unit}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 122,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 56,
          backgroundColor: COLORS.band,
          borderTop: `2px solid ${COLORS.rule}`,
          fontFamily: "Geist Mono",
          fontWeight: 500,
          fontSize: mrzFont,
          letterSpacing: 3,
          color: COLORS.mrz,
        }}
      >
        <div style={{ display: "flex" }}>{summary.mrz[0]}</div>
        <div style={{ display: "flex", marginTop: 6 }}>{summary.mrz[1]}</div>
      </div>
    </div>
  );
}

const LANDSCAPE_GLOBE: Circle = { cx: 880, cy: 274, r: 262 };

/**
 * A share link always renders the same image, so routes cache it for good,
 * except when a flag failed to load (retry soon) or the image says "so far"
 * (it changes when the year ends).
 */
function settleCacheControl(
  headers: Record<string, string> | undefined,
  { complete, timeSensitive }: { complete: boolean; timeSensitive: boolean },
) {
  if (!headers?.["Cache-Control"]?.includes("immutable")) return headers;
  if (!complete) return { ...headers, "Cache-Control": "public, max-age=300" };
  if (timeSensitive) {
    return {
      ...headers,
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    };
  }
  return headers;
}

type RenderInput = {
  flights: readonly ResolvedFlight[];
  year?: number;
  unit: DistanceUnit;
  /** Route color as "#rrggbb" (default flightcn orange). */
  color?: string;
  /** The owner's text for the end of the bottom line. */
  footer?: string;
};

type CardRenderInput = RenderInput & {
  /** Leave the routes and airports off the map, for the video to draw. */
  plate?: boolean;
};

/** 1200×630 link preview for a shared passport. */
export async function renderPassportOgImage(
  input: RenderInput,
  headers?: Record<string, string>,
) {
  // Build everything before ImageResponse starts streaming, so a bad link
  // can never produce a half-written image.
  const summary = summarizePassport(input);
  const scene = buildGlobeScene(summary.scopeFlights, LANDSCAPE_GLOBE, {
    maxLabels: 4,
    labelMinLeft: 640,
  });
  const [{ flags, complete }, fonts] = await Promise.all([
    loadCountryFlags(summary.countryNames.slice(0, 10)),
    loadOgFonts(),
  ]);
  return new ImageResponse(
    <PassportOgCard
      summary={summary}
      scene={scene}
      flags={flags}
      routeColor={input.color ?? OG_COLORS.accent}
    />,
    {
      ...OG_SIZE,
      fonts,
      headers: settleCacheControl(headers, {
        complete,
        timeSensitive: summary.timeSensitive,
      }),
    },
  );
}

/** 1080×1350 passport page, the image people download and post. */
export async function renderPassportCardImage(
  input: CardRenderInput,
  headers?: Record<string, string>,
) {
  const summary = summarizePassport(input);
  const scene = buildFlatScene(summary.scopeFlights, CARD_MAP_BOX, {
    plate: input.plate,
  });
  const [{ flags, complete }, fonts] = await Promise.all([
    loadCountryFlags(summary.countryNames.slice(0, 12)),
    loadOgFonts(),
  ]);
  return new ImageResponse(
    <PassportCard
      summary={summary}
      scene={scene}
      flags={flags}
      routeColor={input.color ?? OG_COLORS.accent}
    />,
    {
      ...CARD_SIZE,
      fonts,
      headers: settleCacheControl(headers, {
        complete,
        timeSensitive: summary.timeSensitive,
      }),
    },
  );
}

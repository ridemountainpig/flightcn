import { geoInterpolate } from "d3-geo";
import {
  BufferTarget,
  CanvasSource,
  getFirstEncodableVideoCodec,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  WebMOutputFormat,
} from "mediabunny";

import {
  CARD_MAP_BOX,
  CARD_SIZE,
  layoutFlatMap,
  lngLat,
  MAP_STYLE,
} from "@/lib/passport/passport-geo";
import {
  easeFlight,
  PLANE_ICON_PATH,
  scheduleReplay,
  type ResolvedFlight,
} from "@/registry/blocks/flight-passport/flight-passport-stats";

/**
 * The passport video: the passport card with its flights replayed one by
 * one, ending on the finished card. The server renders the card without
 * routes (the plate); each frame draws the routes over it with the same
 * projection the card uses, then WebCodecs encodes the frames in the
 * browser, so making a video costs the server one image.
 */

const FPS = 30;
/** How long a landed flight's trail and ping take to fade, as on the map. */
const LANDING_FADE_MS = 600;
/** The finished passport stays on screen this long at the end. */
const END_HOLD_MS = 2500;
const TRAIL_WIDTH = 5;
const TRAIL_GLOW = 14;
const PLANE_SIZE = 40;
const PING_RADIUS = [8, 34] as const;
/** Great-circle samples per 1,000 km of a flight, so long arcs stay smooth. */
const SAMPLES_PER_1000_KM = 8;
const MIN_SAMPLES = 16;

type Point = [number, number];

type VideoLeg = {
  routeKey: string;
  from: string;
  to: string;
  /** Projected path; a new piece starts where it crosses the map's edge. */
  points: Point[];
  pieceStarts: Set<number>;
  /** Length along the path at each point, not counting jumps between pieces. */
  lengths: number[];
  start: number;
  end: number;
};

export class PassportVideoUnsupportedError extends Error {
  constructor() {
    super("This browser can't encode video.");
    this.name = "PassportVideoUnsupportedError";
  }
}

export type PassportVideo = { blob: Blob; extension: string };

function routeKey(from: string, to: string) {
  return from < to ? `${from}-${to}` : `${to}-${from}`;
}

/** A flight's great circle in card pixels, split where it leaves one edge of the map for the other. */
function projectLeg(
  flight: ResolvedFlight,
  project: (point: [number, number]) => [number, number] | null,
) {
  const interpolate = geoInterpolate(lngLat(flight.from), lngLat(flight.to));
  const samples = Math.max(
    MIN_SAMPLES,
    Math.ceil((flight.distanceKm / 1000) * SAMPLES_PER_1000_KM),
  );
  const points: Point[] = [];
  const pieceStarts = new Set<number>([0]);
  const lengths: number[] = [];
  for (let index = 0; index <= samples; index += 1) {
    const point = project(interpolate(index / samples));
    if (!point) continue;
    const previous = points[points.length - 1];
    if (!previous) {
      lengths.push(0);
    } else if (Math.abs(point[0] - previous[0]) > CARD_MAP_BOX.width / 2) {
      pieceStarts.add(points.length);
      lengths.push(lengths[lengths.length - 1]);
    } else {
      lengths.push(
        lengths[lengths.length - 1] +
          Math.hypot(point[0] - previous[0], point[1] - previous[1]),
      );
    }
    points.push(point);
  }
  return { points, pieceStarts, lengths };
}

/** Traces the leg's path up to `length` and returns where the plane is and which way it points. */
function traceLeg(
  context: CanvasRenderingContext2D,
  leg: VideoLeg,
  length: number,
) {
  const { points, pieceStarts, lengths } = leg;
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  let head = points[0];
  let heading = 0;
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    if (pieceStarts.has(index)) {
      if (lengths[index] > length) break;
      context.moveTo(point[0], point[1]);
      head = point;
      continue;
    }
    const previous = points[index - 1];
    const span = lengths[index] - lengths[index - 1];
    const fraction =
      lengths[index] <= length || span === 0
        ? 1
        : (length - lengths[index - 1]) / span;
    head = [
      previous[0] + (point[0] - previous[0]) * fraction,
      previous[1] + (point[1] - previous[1]) * fraction,
    ];
    if (span > 0) {
      heading = Math.atan2(point[0] - previous[0], previous[1] - point[1]);
    }
    context.lineTo(head[0], head[1]);
    if (fraction < 1) break;
  }
  return { head, heading };
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The passport image didn't load."));
    image.src = url;
  });
}

/**
 * Renders the passport video for flights in one scope (a year or all
 * time). `plateUrl` is the card image without routes for the same scope.
 */
export async function createPassportVideo({
  flights,
  plateUrl,
  color,
  onProgress,
  signal,
}: {
  flights: readonly ResolvedFlight[];
  plateUrl: string;
  color: string;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}): Promise<PassportVideo> {
  const { width, height } = CARD_SIZE;
  const codec =
    typeof VideoEncoder === "undefined"
      ? null
      : await getFirstEncodableVideoCodec(["avc", "vp9", "vp8"], {
          width,
          height,
          frameRate: FPS,
          quality: QUALITY_HIGH,
        });
  if (!codec) throw new PassportVideoUnsupportedError();
  // Cancelled while the encoder loaded; skip rendering the plate.
  signal?.throwIfAborted();
  const plate = await loadImage(plateUrl);
  signal?.throwIfAborted();

  // The same layout as the card, so the last frame matches the image.
  const layout = layoutFlatMap(flights, CARD_MAP_BOX);
  const routePaths = layout.routes.map((route) => ({
    key: route.route.key,
    path: new Path2D(route.d),
    width: route.width,
  }));
  const ordered = [...flights].sort((a, b) => a.order - b.order);
  const slots = scheduleReplay(ordered.map((flight) => flight.distanceKm));
  const legs: VideoLeg[] = ordered.map((flight, index) => ({
    routeKey: routeKey(flight.from.code, flight.to.code),
    from: flight.from.code,
    to: flight.to.code,
    ...projectLeg(flight, (point) => layout.projection(point)),
    ...slots[index],
  }));

  // When each route and airport first appears: a route once its first
  // flight lands, an airport at its first takeoff or landing.
  const routeRevealAt = new Map<string, number>();
  const airportRevealAt = new Map<string, number>();
  const reveal = (map: Map<string, number>, key: string, time: number) =>
    map.set(key, Math.min(map.get(key) ?? Infinity, time));
  for (const leg of legs) {
    reveal(routeRevealAt, leg.routeKey, leg.end);
    reveal(airportRevealAt, leg.from, leg.start);
    reveal(airportRevealAt, leg.to, leg.end);
  }
  const landed = legs.reduce((latest, leg) => Math.max(latest, leg.end), 0);
  const frameCount = Math.ceil(
    ((landed + LANDING_FADE_MS + END_HOLD_MS) / 1000) * FPS,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new PassportVideoUnsupportedError();
  const plane = new Path2D(PLANE_ICON_PATH);

  const drawFrame = (time: number) => {
    context.drawImage(plate, 0, 0, width, height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = color;

    context.globalAlpha = MAP_STYLE.routeOpacity;
    for (const route of routePaths) {
      if ((routeRevealAt.get(route.key) ?? Infinity) > time) continue;
      context.lineWidth = route.width;
      context.stroke(route.path);
    }

    const flying: { head: Point; heading: number }[] = [];
    const pings: { point: Point; fade: number }[] = [];
    for (const leg of legs) {
      if (leg.start > time) break;
      const landedFor = time - leg.end;
      if (landedFor >= LANDING_FADE_MS) continue;
      const total = leg.lengths[leg.lengths.length - 1] ?? 0;
      const progress =
        landedFor < 0
          ? easeFlight((time - leg.start) / (leg.end - leg.start))
          : 1;
      const fade = landedFor < 0 ? 1 : 1 - landedFor / LANDING_FADE_MS;
      const traced = traceLeg(context, leg, progress * total);
      context.globalAlpha = fade;
      context.lineWidth = TRAIL_WIDTH;
      context.shadowColor = color;
      context.shadowBlur = TRAIL_GLOW;
      context.stroke();
      context.shadowBlur = 0;
      if (landedFor < 0) flying.push(traced);
      else pings.push({ point: leg.points[leg.points.length - 1], fade });
    }

    context.globalAlpha = 1;
    context.lineWidth = MAP_STYLE.dotStrokeWidth;
    context.strokeStyle = MAP_STYLE.dotStroke;
    for (const dot of layout.dots) {
      if ((airportRevealAt.get(dot.code) ?? Infinity) > time) continue;
      context.beginPath();
      context.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      context.fillStyle = dot.home ? color : MAP_STYLE.dotFill;
      context.fill();
      context.stroke();
    }

    context.strokeStyle = color;
    context.lineWidth = 3;
    for (const ping of pings) {
      context.globalAlpha = 0.85 * ping.fade;
      context.beginPath();
      context.arc(
        ping.point[0],
        ping.point[1],
        PING_RADIUS[0] + (PING_RADIUS[1] - PING_RADIUS[0]) * (1 - ping.fade),
        0,
        Math.PI * 2,
      );
      context.stroke();
    }

    context.globalAlpha = 1;
    context.fillStyle = color;
    context.strokeStyle = "#ffffff";
    context.lineWidth = 1.5;
    for (const { head, heading } of flying) {
      context.save();
      context.translate(head[0], head[1]);
      context.rotate(heading);
      context.scale(PLANE_SIZE / 24, PLANE_SIZE / 24);
      context.translate(-12, -12);
      context.stroke(plane);
      context.fill(plane);
      context.restore();
    }
  };

  const format =
    codec === "avc"
      ? new Mp4OutputFormat({ fastStart: "in-memory" })
      : new WebMOutputFormat();
  const output = new Output({ format, target: new BufferTarget() });
  const source = new CanvasSource(canvas, { codec, quality: QUALITY_HIGH });
  output.addVideoTrack(source, { frameRate: FPS });
  try {
    await output.start();
    for (let frame = 0; frame < frameCount; frame += 1) {
      signal?.throwIfAborted();
      drawFrame((frame * 1000) / FPS);
      await source.add(frame / FPS, 1 / FPS);
      onProgress?.((frame + 1) / frameCount);
    }
    await output.finalize();
  } catch (error) {
    if (output.state !== "finalized") await output.cancel().catch(() => {});
    throw error;
  }
  const buffer = output.target.buffer;
  if (!buffer) throw new Error("The video came out empty.");
  return {
    blob: new Blob([buffer], { type: format.mimeType }),
    extension: format.fileExtension.replace(/^\./, ""),
  };
}

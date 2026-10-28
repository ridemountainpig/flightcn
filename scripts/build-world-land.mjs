#!/usr/bin/env node
/**
 * Builds src/data/world-land-110m.json: one compact MultiPolygon of the
 * world's land, drawn on the passport share images.
 *
 * Data: Natural Earth 1:110m land, public domain — https://www.naturalearthdata.com/
 *
 * Usage:
 *   curl -o ne_110m_land.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson
 *   node scripts/build-world-land.mjs ne_110m_land.geojson
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geoArea } from "d3-geo";

const [inputPath] = process.argv.slice(2);
if (!inputPath) {
  console.error(
    "Usage: node scripts/build-world-land.mjs <ne_110m_land.geojson>",
  );
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const outputPath = path.join(root, "src/data/world-land-110m.json");
const source = JSON.parse(readFileSync(inputPath, "utf8"));

const round = (value) => Math.round(value * 100) / 100;

function cleanRing(ring) {
  const cleaned = [];
  for (const [longitude, latitude] of ring) {
    const point = [round(longitude), round(latitude)];
    const previous = cleaned[cleaned.length - 1];
    if (!previous || previous[0] !== point[0] || previous[1] !== point[1]) {
      cleaned.push(point);
    }
  }
  return cleaned;
}

const polygons = [];
for (const feature of source.features) {
  const geometry = feature.geometry;
  const parts =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const part of parts) {
    // Antarctica only takes room at the bottom of a flat world map.
    if (part[0].every(([, latitude]) => latitude < -60)) continue;
    let polygon = part.map(cleanRing).filter((ring) => ring.length >= 4);
    if (polygon.length === 0) continue;
    // d3-geo reads rings by winding: a polygon covering more than half the
    // sphere is the inside-out version of the land, so flip it.
    if (geoArea({ type: "Polygon", coordinates: polygon }) > 2 * Math.PI) {
      polygon = polygon.map((ring) => [...ring].reverse());
    }
    polygons.push(polygon);
  }
}

writeFileSync(
  outputPath,
  `${JSON.stringify({ type: "MultiPolygon", coordinates: polygons })}\n`,
);
console.log(
  `Wrote ${polygons.length} land polygons to ${path.relative(root, outputPath)}`,
);

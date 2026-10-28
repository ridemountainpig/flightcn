import type { NextRequest } from "next/server";

import { renderPassportCardImage } from "@/lib/og/passport-og";
import { builtInLookup } from "@/lib/passport/airport-lookup";
import { readShareParams } from "@/lib/passport/share-codec";
import { loadSharedPassport } from "@/lib/passport/shared-passport.server";
import {
  resolveFlights,
  SAMPLE_PASSPORT_FLIGHTS,
} from "@/registry/blocks/flight-passport/flight-passport-stats";

// loadOgFonts reads the font files from disk.
export const runtime = "nodejs";

/**
 * The 1080×1350 passport page for a share link — what "Download image"
 * saves. With `plate=1` the map has only the land, and the passport video
 * draws the routes over it. Like the link preview, the same query always
 * renders the same image, so it is cached for good.
 */
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const { d, year, unit, color, footer } = readShareParams({
    d: search.get("d"),
    year: search.get("year"),
    u: search.get("u"),
    c: search.get("c"),
    t: search.get("t"),
  });
  const shared = loadSharedPassport(d, year, unit);
  if (!shared && search.get("plate") === "1") {
    // The video draws its own routes over the plate; drawing them over the
    // sample passport would be wrong, so let the video fail instead.
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "public, max-age=300" },
    });
  }
  if (!shared) {
    return renderPassportCardImage(
      {
        flights: resolveFlights(SAMPLE_PASSPORT_FLIGHTS, builtInLookup).flights,
        unit,
        color,
        footer,
      },
      { "Cache-Control": "public, max-age=300" },
    );
  }

  const headers: Record<string, string> = {
    "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
  };
  if (search.get("download") === "1") {
    const filename = shared.year
      ? `flight-passport-${shared.year}.png`
      : "flight-passport.png";
    headers["Content-Disposition"] = `attachment; filename="${filename}"`;
  }
  return renderPassportCardImage(
    {
      flights: shared.resolved,
      year: shared.year,
      unit: shared.unit,
      color,
      footer,
      plate: search.get("plate") === "1",
    },
    headers,
  );
}

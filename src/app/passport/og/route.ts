import type { NextRequest } from "next/server";

import { renderPassportOgImage } from "@/lib/og/passport-og";
import { readShareParams } from "@/lib/passport/share-codec";
import { loadSharedPassport } from "@/lib/passport/shared-passport.server";

import { renderPassportPageOgImage } from "../og-image";

// loadOgFonts reads the font files from disk.
export const runtime = "nodejs";

/**
 * Share image for a passport link. The flights live in the URL, so the same
 * query always renders the same image and can be cached for good.
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
  if (!shared) {
    return renderPassportPageOgImage({
      "Cache-Control": "public, max-age=300",
    });
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
  return renderPassportOgImage(
    {
      flights: shared.resolved,
      year: shared.year,
      unit: shared.unit,
      color,
      footer,
    },
    headers,
  );
}

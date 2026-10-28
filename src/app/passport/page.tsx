import type { Metadata } from "next";

import { PassportPage } from "@/components/passport/passport-page";
import { JsonLd } from "@/components/seo/json-ld";
import {
  buildShareImagePath,
  buildShareQuery,
  readShareParams,
} from "@/lib/passport/share-codec";
import { loadSharedPassport } from "@/lib/passport/shared-passport.server";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";

type PassportRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const title = "Flight Passport: Map Every Flight You've Taken";
const description =
  "Paste your flight log to get a lifetime flight map, travel stats, and a year in review. Free, no sign-up, and open source. Share it as a link or an image.";

const passportJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "flightcn flight passport",
    description,
    url: absoluteUrl("/passport"),
    applicationCategory: "TravelApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  },
  buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Passport", path: "/passport" },
  ]),
];

async function loadPassport({ searchParams }: PassportRouteProps) {
  const params = await searchParams;
  const { d, year, unit, color, footer } = readShareParams(params);
  return {
    shared: loadSharedPassport(d, year, unit),
    color,
    footer,
    requestedShare: params.d !== undefined,
  };
}

export async function generateMetadata(
  props: PassportRouteProps,
): Promise<Metadata> {
  const { shared, color, footer } = await loadPassport(props);
  if (!shared) {
    return buildPageMetadata({
      title,
      description,
      path: "/passport",
      keywords: [
        "flight history map",
        "my flight map",
        "personal flight log",
        "flight passport",
        "flights year in review",
        "travel stats map",
      ],
      ogImage: {
        url: "/passport/opengraph-image",
        alt: "flightcn flight passport — map every flight you've taken",
      },
    });
  }

  // Shared passports are personal, so they stay out of search results. Each
  // link names itself as og:url and canonical: Facebook merges links that
  // share one, which would give every passport the same preview.
  const params = {
    d: shared.d,
    year: shared.year,
    unit: shared.unit,
    color,
    footer,
  };
  const sharePath = `/passport?${buildShareQuery(params)}`;
  const metadata = buildPageMetadata({
    title: shared.title,
    description: shared.description,
    path: sharePath,
    ogImage: { url: buildShareImagePath(params), alt: shared.title },
  });
  return {
    ...metadata,
    robots: { index: false, follow: true },
  };
}

export default async function PassportRoute(props: PassportRouteProps) {
  const { shared, color, footer, requestedShare } = await loadPassport(props);
  return (
    <>
      <JsonLd id="passport-jsonld" data={passportJsonLd} />
      <PassportPage
        key={
          shared
            ? `shared-${shared.d}-${shared.year ?? "all"}-${color}-${footer ?? ""}`
            : "editor"
        }
        shared={
          shared
            ? {
                flights: shared.flights,
                d: shared.d,
                year: shared.year,
                unit: shared.unit,
                color,
                footer,
                extraAirports: shared.extraAirports,
                headline: shared.review
                  ? `${shared.review.year} in flights`
                  : "A flight passport",
                description: shared.description,
              }
            : null
        }
        invalidShare={requestedShare && !shared}
      />
    </>
  );
}

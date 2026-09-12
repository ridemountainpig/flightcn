import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { BlocksPage } from "@/components/blocks/blocks-page";
import { blocksConfig } from "@/components/blocks/blocks-config";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Flight Map Blocks",
  description:
    "Prebuilt flight map blocks for React — dashboards, route pickers, network views, and orbit trackers you can install with one shadcn command.",
  path: "/blocks",
  keywords: [
    "flight map blocks",
    "shadcn blocks",
    "react flight dashboard",
    "maplibre ui blocks",
  ],
  ogImage: {
    url: "/blocks/opengraph-image",
    alt: "flightcn blocks — prebuilt flight map blocks for React",
  },
});

const blocksJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "flightcn blocks",
    description:
      "Prebuilt flight map blocks composed from flightcn components, installable with the shadcn CLI.",
    url: absoluteUrl("/blocks"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: blocksConfig.map((block, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: block.title,
        url: absoluteUrl(`/blocks#${block.id}`),
      })),
    },
  },
  buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blocks", path: "/blocks" },
  ]),
];

export default function BlocksRoute() {
  return (
    <>
      <JsonLd id="blocks-jsonld" data={blocksJsonLd} />
      <BlocksPage />
    </>
  );
}

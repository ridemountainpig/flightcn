import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { ComponentDocsPage } from "@/components/docs/component-docs-page";
import { componentDocs } from "@/components/docs/component-docs-config";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Documentation",
  description:
    "Read the API reference, props tables, and live examples for the flightcn flight route components built for mapcn.",
  path: "/docs",
  keywords: ["flightcn docs", "flight route component API", "mapcn examples"],
});

const docsJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "flightcn documentation",
    description:
      "API reference and live component previews for the flightcn component set.",
    url: absoluteUrl("/docs"),
    mainEntity: componentDocs.map((component) => ({
      "@type": "TechArticle",
      headline: component.name,
      description: component.description,
      url: absoluteUrl(`/docs#${component.id}`),
    })),
  },
  buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Documentation", path: "/docs" },
  ]),
];

export default function DocsPage() {
  return (
    <>
      <JsonLd id="docs-jsonld" data={docsJsonLd} />
      <ComponentDocsPage />
    </>
  );
}

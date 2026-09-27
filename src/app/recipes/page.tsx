import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { RecipesPage } from "@/components/recipes/recipes-page";
import { recipesConfig } from "@/components/recipes/recipes-config";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Flight Map Recipes",
  description:
    "Step-by-step recipes for building flight features in React — a live flight tracker, an airline route map, and a personal flight history map, each with a working demo and full code.",
  path: "/recipes",
  keywords: [
    "react flight tracker tutorial",
    "how to build flight map react",
    "airline route map react",
    "flight history map",
  ],
  ogImage: {
    url: "/recipes/opengraph-image",
    alt: "flightcn recipes — step-by-step flight features for React",
  },
});

const recipesJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "flightcn recipes",
    description:
      "Step-by-step recipes for building flight visualization features with flightcn components.",
    url: absoluteUrl("/recipes"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: recipesConfig.map((recipe, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: recipe.title,
        url: absoluteUrl(`/recipes/${recipe.slug}`),
      })),
    },
  },
  buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Recipes", path: "/recipes" },
  ]),
];

export default function RecipesRoute() {
  return (
    <>
      <JsonLd id="recipes-jsonld" data={recipesJsonLd} />
      <RecipesPage />
    </>
  );
}

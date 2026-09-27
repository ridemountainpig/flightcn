import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { RecipePage } from "@/components/recipes/recipe-page";
import {
  getRecipeBySlug,
  recipesConfig,
} from "@/components/recipes/recipes-config";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  personJsonLd,
} from "@/lib/seo";

type RecipeRouteParams = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return recipesConfig.map((recipe) => ({ slug: recipe.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: RecipeRouteParams): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) return {};

  return buildPageMetadata({
    title: recipe.title,
    description: recipe.description,
    path: `/recipes/${recipe.slug}`,
    keywords: recipe.keywords,
    ogImage: {
      url: "/recipes/opengraph-image",
      alt: "flightcn recipes — step-by-step flight features for React",
    },
  });
}

export default async function RecipeRoute({ params }: RecipeRouteParams) {
  const { slug } = await params;
  const recipe = getRecipeBySlug(slug);
  if (!recipe) notFound();

  const recipeJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: recipe.title,
      description: recipe.description,
      url: absoluteUrl(`/recipes/${recipe.slug}`),
      inLanguage: "en",
      author: personJsonLd,
      tool: recipe.components.map((component) => ({
        "@type": "HowToTool",
        name: `flightcn ${component.name}`,
      })),
      step: recipe.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.title,
        text: step.body.replaceAll("\n\n", " "),
        url: absoluteUrl(`/recipes/${recipe.slug}`),
      })),
    },
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Recipes", path: "/recipes" },
      { name: recipe.navTitle, path: `/recipes/${recipe.slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd id={`recipe-${recipe.slug}-jsonld`} data={recipeJsonLd} />
      <RecipePage recipe={recipe} />
    </>
  );
}

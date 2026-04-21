import type { Metadata } from "next";

export const siteConfig = {
  name: "flightcn",
  url: "https://flightcn.yencheng.dev",
  description:
    "Flight route and satellite orbit visualization components for mapcn and MapLibre, with airport lookup, great-circle paths, orbital overlays, and animated globe markers.",
  creator: {
    name: "ridemountainpig",
    url: "https://github.com/ridemountainpig",
  },
  githubUrl: "https://github.com/ridemountainpig/flightcn",
  ogImage: "/flightcn-og.png",
} as const;

export const defaultKeywords = [
  "flightcn",
  "mapcn",
  "MapLibre",
  "flight route visualization",
  "satellite orbit visualization",
  "IATA airport codes",
  "globe overlay",
  "shadcn registry",
  "React map components",
] as const;

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: readonly string[];
};

export function absoluteUrl(path: string) {
  return new URL(path, siteConfig.url).toString();
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords = [],
}: PageMetadataOptions): Metadata {
  const openGraphTitle =
    title === siteConfig.name
      ? siteConfig.name
      : `${title} | ${siteConfig.name}`;

  return {
    title,
    description,
    keywords: [...defaultKeywords, ...keywords],
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      url: absoluteUrl(path),
      title: openGraphTitle,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: openGraphTitle,
      description,
      creator: "@ridemountainpig",
      images: [siteConfig.ogImage],
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: ReadonlyArray<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export const personJsonLd = {
  "@type": "Person",
  name: siteConfig.creator.name,
  url: siteConfig.creator.url,
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  inLanguage: "en",
  creator: personJsonLd,
};

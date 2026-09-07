import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo";

const lastModified = new Date("2026-09-07");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteConfig.url}/`,
      lastModified,
      priority: 1,
    },
    {
      url: `${siteConfig.url}/docs`,
      lastModified,
      priority: 0.95,
    },
    {
      url: `${siteConfig.url}/docs/flight`,
      lastModified,
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/docs/satellite`,
      lastModified,
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/docs/install`,
      lastModified,
      priority: 0.85,
    },
    {
      url: `${siteConfig.url}/docs/install/flight`,
      lastModified,
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/docs/install/satellite`,
      lastModified,
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/airports`,
      lastModified,
      priority: 0.7,
    },
  ];
}

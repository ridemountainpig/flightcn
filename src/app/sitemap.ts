import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteConfig.url}/`,
      priority: 1,
    },
    {
      url: `${siteConfig.url}/docs`,
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/docs/install`,
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/airports`,
      priority: 0.7,
    },
  ];
}

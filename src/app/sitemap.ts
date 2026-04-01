import type { MetadataRoute } from "next";

const BASE_URL = "https://flightcn.yencheng.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      priority: 1,
    },
    {
      url: `${BASE_URL}/docs`,
      lastModified: now,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/docs/install`,
      lastModified: now,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/airports`,
      lastModified: now,
      priority: 0.7,
    },
  ];
}

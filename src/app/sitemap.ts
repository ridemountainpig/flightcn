import { execSync } from "node:child_process";
import { statSync } from "node:fs";

import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo";

/**
 * Resolved at build time: the last commit touching any of the route's source
 * paths, falling back to filesystem mtime for files not yet committed.
 */
function lastModifiedOf(...paths: string[]): Date {
  try {
    const iso = execSync(`git log -1 --format=%cI -- ${paths.join(" ")}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (iso) return new Date(iso);
  } catch {
    // git unavailable — fall through to filesystem mtimes
  }
  const mtimes = paths.map((path) => {
    try {
      return statSync(path).mtimeMs;
    } catch {
      return 0;
    }
  });
  const latest = Math.max(0, ...mtimes);
  return latest > 0 ? new Date(latest) : new Date();
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteConfig.url}/`,
      lastModified: lastModifiedOf("src/app/page.tsx", "src/components/home"),
      priority: 1,
    },
    {
      url: `${siteConfig.url}/docs`,
      lastModified: lastModifiedOf(
        "src/app/docs/page.tsx",
        "src/components/docs",
      ),
      priority: 0.95,
    },
    {
      url: `${siteConfig.url}/playground`,
      lastModified: lastModifiedOf(
        "src/app/playground",
        "src/components/playground",
      ),
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/satellite-playground`,
      lastModified: lastModifiedOf(
        "src/app/satellite-playground",
        "src/components/satellite",
      ),
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/blocks`,
      lastModified: lastModifiedOf(
        "src/app/blocks",
        "src/components/blocks",
        "src/registry/blocks",
      ),
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/docs/flight`,
      lastModified: lastModifiedOf(
        "src/app/docs/flight",
        "src/components/docs",
      ),
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/docs/satellite`,
      lastModified: lastModifiedOf(
        "src/app/docs/satellite",
        "src/components/docs",
      ),
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/docs/install`,
      lastModified: lastModifiedOf("src/app/docs/install/page.tsx"),
      priority: 0.85,
    },
    {
      url: `${siteConfig.url}/docs/install/flight`,
      lastModified: lastModifiedOf(
        "src/app/docs/install/flight",
        "src/components/docs/install-guide.tsx",
        "src/components/home/install-command-copy.tsx",
      ),
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/docs/install/satellite`,
      lastModified: lastModifiedOf(
        "src/app/docs/install/satellite",
        "src/components/docs/install-guide.tsx",
        "src/components/home/install-command-copy.tsx",
      ),
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/airports`,
      lastModified: lastModifiedOf(
        "src/app/airports",
        "src/components/airports",
      ),
      priority: 0.7,
    },
  ];
}

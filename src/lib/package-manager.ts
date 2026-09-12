"use client";

import { useSyncExternalStore } from "react";

export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

const DEFAULT_PM: PackageManager = "npm";
const STORAGE_KEY = "flightcn-package-manager";

/** shadcn CLI runner per package manager, matching the official docs. */
const RUNNER_BY_PM: Record<PackageManager, string> = {
  npm: "npx",
  pnpm: "pnpm dlx",
  yarn: "yarn dlx",
  bun: "bunx --bun",
};

export function buildInstallCommand(pm: PackageManager, item: string) {
  return `${RUNNER_BY_PM[pm]} shadcn@latest add ${item}`;
}

function readStored(): PackageManager {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if ((PACKAGE_MANAGERS as readonly string[]).includes(stored ?? "")) {
      return stored as PackageManager;
    }
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
  }
  return DEFAULT_PM;
}

let current: PackageManager =
  typeof window === "undefined" ? DEFAULT_PM : readStored();
const listeners = new Set<() => void>();

function setPackageManager(pm: PackageManager) {
  current = pm;
  try {
    window.localStorage.setItem(STORAGE_KEY, pm);
  } catch {
    // Preference just won't persist.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Site-wide package manager preference for install commands. Shared across
 * every instance on the page and persisted to localStorage.
 */
export function usePackageManager() {
  const pm = useSyncExternalStore(
    subscribe,
    () => current,
    () => DEFAULT_PM,
  );
  return [pm, setPackageManager] as const;
}

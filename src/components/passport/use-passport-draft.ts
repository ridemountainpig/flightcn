"use client";

import { useSyncExternalStore } from "react";

/**
 * A string kept in localStorage and shared by every component that reads
 * it. The hook returns null during the server render and hydration.
 */
function createStoredString(storageKey: string) {
  /** null until read on the client, so the server render stays empty. */
  let current: string | null = null;
  const listeners = new Set<() => void>();

  /** null when storage is unavailable (private mode, blocked cookies). */
  function readStored() {
    try {
      return window.localStorage.getItem(storageKey) ?? "";
    } catch {
      return null;
    }
  }

  function getSnapshot() {
    current ??= readStored() ?? "";
    return current;
  }

  function getServerSnapshot() {
    return null;
  }

  function subscribe(listener: () => void) {
    // No storage events reach the cache while nothing is mounted, so a page
    // that comes back (client-side navigation) catches up on other tabs.
    if (listeners.size === 0) {
      const stored = readStored();
      if (stored !== null && stored !== current) {
        current = stored;
        listener();
      }
    }
    listeners.add(listener);
    // Another tab saved a newer value; take it so this tab doesn't write
    // its older copy back over it.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      current = event.newValue ?? "";
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function setStored(value: string) {
    current = value;
    try {
      window.localStorage.setItem(storageKey, value);
    } catch {
      // The value just won't survive a reload.
    }
    listeners.forEach((listener) => listener());
  }

  return function useStoredString() {
    const value = useSyncExternalStore<string | null>(
      subscribe,
      getSnapshot,
      getServerSnapshot,
    );
    return [value, setStored] as const;
  };
}

/** The flight log being edited, kept so it survives reloads. */
export const usePassportDraft = createStoredString("flightcn-passport-draft");

/** The route color picked on the passport page, as "#rrggbb" or "". */
export const usePassportColor = createStoredString("flightcn-passport-color");

/** The owner's text for the passport's bottom line, or "" for the default. */
export const usePassportFooter = createStoredString("flightcn-passport-footer");

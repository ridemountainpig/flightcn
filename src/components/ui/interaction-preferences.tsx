"use client";

import { useEffect } from "react";

/** Keep keyboard navigation immediate, including CSS-driven UI transitions. */
export function InteractionPreferences() {
  useEffect(() => {
    const root = document.documentElement;
    const keyboard = () => {
      root.dataset.input = "keyboard";
    };
    const pointer = () => {
      root.dataset.input = "pointer";
    };
    keyboard();
    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("pointerdown", pointer, true);
    return () => {
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("pointerdown", pointer, true);
    };
  }, []);
  return null;
}

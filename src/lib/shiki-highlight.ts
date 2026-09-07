import {
  createBundledHighlighter,
  createSingletonShorthands,
} from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

const createHighlighter = createBundledHighlighter({
  langs: {
    tsx: () => import("@shikijs/langs/tsx"),
  },
  themes: {
    "github-light": () => import("@shikijs/themes/github-light"),
    "material-theme-darker": () =>
      import("@shikijs/themes/material-theme-darker"),
  },
  engine: () => createOnigurumaEngine(import("shiki/wasm")),
});

export const { codeToHtml } = createSingletonShorthands(createHighlighter);

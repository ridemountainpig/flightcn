/**
 * The passport's bottom line ends with the site's address unless the owner
 * prints their own text there, like a name or a handle. The line is set in
 * a Latin-only font, so the text is limited to what it can print.
 */
export const DEFAULT_FOOTER_TEXT = "flightcn.yencheng.dev";
export const FOOTER_TEXT_MAX_LENGTH = 24;

const FOOTER_TEXT_PATTERN = /^[A-Za-z0-9 .@_-]+$/;

/** Drops characters the passport can't print, as the owner types. */
export function cleanFooterInput(value: string) {
  return value
    .replace(/[^A-Za-z0-9 .@_-]/g, "")
    .slice(0, FOOTER_TEXT_MAX_LENGTH);
}

/** The owner's footer text from a link or storage; undefined means the default. */
export function normalizeFooterText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (
    !text ||
    text.length > FOOTER_TEXT_MAX_LENGTH ||
    !FOOTER_TEXT_PATTERN.test(text) ||
    text.toLowerCase() === DEFAULT_FOOTER_TEXT
  ) {
    return undefined;
  }
  return text;
}

import countryCodes from "@/data/country-codes.json";

/**
 * Twemoji flag artwork (CC-BY 4.0, https://github.com/jdecked/twemoji),
 * pinned so share images never change underneath a cached URL.
 */
const TWEMOJI_BASE =
  "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/";
const FETCH_TIMEOUT_MS = 2500;

const codesByCountry: Readonly<Record<string, string>> = countryCodes;
const flagCache = new Map<string, Promise<string | null>>();

/** ISO 3166-1 alpha-2 code for a country name from the airport data. */
export function countryIsoCode(country: string) {
  return codesByCountry[country];
}

function flagFileName(iso: string) {
  return `${[...iso]
    .map((letter) => (0x1f1e6 + letter.charCodeAt(0) - 65).toString(16))
    .join("-")}.svg`;
}

function loadFlag(iso: string) {
  let pending = flagCache.get(iso);
  if (!pending) {
    pending = fetch(TWEMOJI_BASE + flagFileName(iso), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
      .then((response) => (response.ok ? response.text() : null))
      .then((svg) =>
        svg
          ? `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
          : null,
      )
      .catch(() => null);
    flagCache.set(iso, pending);
    // A failed fetch should be retried by the next image, not cached.
    void pending.then((src) => {
      if (!src) flagCache.delete(iso);
    });
  }
  return pending;
}

/**
 * Flag images for countries, as data URIs satori can draw. Flags that fail
 * to load are skipped, so a slow CDN never breaks a share image; `complete`
 * says whether any were, so the image isn't cached for good without them.
 */
export async function loadCountryFlags(countries: readonly string[]) {
  const isoCodes = [
    ...new Set(
      countries
        .map(countryIsoCode)
        .filter((iso): iso is string => /^[A-Z]{2}$/.test(iso ?? "")),
    ),
  ];
  const flags = await Promise.all(
    isoCodes.map(async (iso) => ({ iso, src: await loadFlag(iso) })),
  );
  const loaded = flags.filter(
    (flag): flag is { iso: string; src: string } => flag.src !== null,
  );
  return { flags: loaded, complete: loaded.length === flags.length };
}

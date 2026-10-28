import { bytesToBase64Url, SHARE_DEFLATE, SHARE_PLAIN } from "./share-codec";

/** Compresses a share body for the `d` parameter (browser only). */
export async function encodeShareBody(body: string) {
  const bytes = new TextEncoder().encode(body);
  try {
    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new CompressionStream("deflate-raw"));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return SHARE_DEFLATE + bytesToBase64Url(compressed);
  } catch {
    // Older browsers without "deflate-raw" still get a working, longer link.
    return SHARE_PLAIN + bytesToBase64Url(bytes);
  }
}

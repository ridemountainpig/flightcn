import { OG_SIZE, renderBlocksOgImage } from "./og-image";

export const alt = "flightcn blocks — prebuilt flight map blocks for React";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderBlocksOgImage();
}

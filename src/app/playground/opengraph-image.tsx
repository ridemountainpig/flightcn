import { OG_SIZE, renderPlaygroundOgImage } from "./og-image";

export const alt = "flightcn playground — compose flight visualizations";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderPlaygroundOgImage();
}

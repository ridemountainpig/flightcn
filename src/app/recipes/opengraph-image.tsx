import { OG_SIZE, renderRecipesOgImage } from "./og-image";

export const alt = "flightcn recipes — step-by-step flight features for React";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderRecipesOgImage();
}

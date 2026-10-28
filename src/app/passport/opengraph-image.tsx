import { OG_SIZE, renderPassportPageOgImage } from "./og-image";

export const alt =
  "flightcn flight passport — map every flight you've taken, with lifetime stats and a year in review";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderPassportPageOgImage();
}

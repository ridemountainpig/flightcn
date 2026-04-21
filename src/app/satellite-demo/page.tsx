import type { Metadata } from "next";

import { SatelliteDemoPage } from "@/components/satellite/satellite-demo-page";

export const metadata: Metadata = {
  title: "Satellite Demo",
  description:
    "Internal satellite orbit playground for previewing orbital overlay controls.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <SatelliteDemoPage />;
}

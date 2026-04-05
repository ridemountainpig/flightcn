import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://flightcn.yencheng.dev"),
  title: {
    default: "flightcn",
    template: "%s | flightcn",
  },
  description:
    "Flight route visualizations for mapcn, with airport lookup and route rendering from IATA codes.",
  applicationName: "flightcn",
  keywords: [
    "flightcn",
    "mapcn",
    "maplibre",
    "flight route",
    "iata",
    "shadcn registry",
  ],
  alternates: {
    canonical: "/",
  },
  authors: [
    {
      name: "ridemountainpig",
      url: "https://www.github.com/ridemountainpig",
    },
  ],
  openGraph: {
    type: "website",
    url: "https://flightcn.yencheng.dev",
    title: "flightcn",
    description:
      "Flight route visualizations for mapcn, with airport lookup and route rendering from IATA codes.",
    siteName: "flightcn",
    images: [
      {
        url: "/flightcn-og.png",
        alt: "flightcn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "flightcn",
    description:
      "Flight route visualizations for mapcn, with airport lookup and route rendering from IATA codes.",
    creator: "@ridemountainpig",
    images: ["/flightcn-og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics gaId="G-D5P23L59BL" />
        {children}
      </body>
    </html>
  );
}

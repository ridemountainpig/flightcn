import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { InteractionPreferences } from "@/components/ui/interaction-preferences";

import { defaultKeywords, siteConfig } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...defaultKeywords],
  authors: [
    {
      name: siteConfig.creator.name,
      url: siteConfig.creator.url,
    },
  ],
  icons: {
    icon: [{ url: "/flightcn-icon.svg", type: "image/svg+xml" }],
    apple: "/flightcn-icon.png",
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        alt: siteConfig.ogImageAlt,
        width: siteConfig.ogImageWidth,
        height: siteConfig.ogImageHeight,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    creator: "@ridemountainpig",
    images: [siteConfig.ogImage],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafaf8",
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
        <InteractionPreferences />
        <a
          href="#page-content"
          className="fixed top-3 left-3 z-[2000] -translate-y-24 rounded-lg bg-slate-950 px-4 py-3 text-sm text-white focus:translate-y-0"
        >
          Skip to content
        </a>
        <GoogleAnalytics gaId="G-D5P23L59BL" />
        {children}
      </body>
    </html>
  );
}

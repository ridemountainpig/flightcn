import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Passport share images render on request (the other OG images render at
  // build time), so the function needs the font files traced in.
  outputFileTracingIncludes: {
    "/passport/og": ["./src/lib/og/fonts/**/*"],
    "/passport/card": ["./src/lib/og/fonts/**/*"],
  },
  async redirects() {
    return [
      {
        // The satellite playground originally shipped at /satellite-demo.
        source: "/satellite-demo",
        destination: "/satellite-playground",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

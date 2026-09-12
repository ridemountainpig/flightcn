import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

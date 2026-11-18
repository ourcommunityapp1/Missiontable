import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  experimental: {
    // Table photos are shrunk in the browser, but allow headroom for originals.
    serverActions: { bodySizeLimit: '6mb' },
  },
};

export default nextConfig;

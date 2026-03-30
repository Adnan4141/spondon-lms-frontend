import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // allow private/dev-hosted assets (partners/logos) without remote allowlist issues
  },
};

export default nextConfig;

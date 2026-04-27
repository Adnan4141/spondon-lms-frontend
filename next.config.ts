import type { NextConfig } from "next";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // allow private/dev-hosted assets (partners/logos) without remote allowlist issues
  },
  async redirects() {
    return [
      {
        source: '/admin/academic-records/attendance-sheet',
        destination: '/admin/attendance-sheet',
        permanent: false,
      },
      {
        source: '/admin/academic-records/attendance-sheet/:path*',
        destination: '/admin/attendance-sheet/:path*',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${API_ORIGIN}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

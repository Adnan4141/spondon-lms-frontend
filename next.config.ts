import type { NextConfig } from 'next';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const apiHost = (() => {
  try {
    return new URL(API_ORIGIN).hostname;
  } catch {
    return 'localhost';
  }
})();

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: apiHost, pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'spondonedu.com', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'api.spondonedu.com', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
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
        source: '/uploads/:path*',
        destination: `${API_ORIGIN}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

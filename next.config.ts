import type { NextConfig } from 'next';

const BACKEND_ORIGIN = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api'
).replace(/\/api\/?$/, '');

const API_ORIGIN = BACKEND_ORIGIN;

const apiHost = (() => {
  try {
    return new URL(API_ORIGIN).hostname;
  } catch {
    return 'localhost';
  }
})();

const nextConfig: NextConfig = {
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
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
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
        source: '/api/:path*',
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${API_ORIGIN}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

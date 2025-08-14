// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      {
        source: '/_api/:path*',
        destination: 'https://backend-production-1beb9.up.railway.app/:path*',
      },
    ];
  },
};

export default nextConfig;


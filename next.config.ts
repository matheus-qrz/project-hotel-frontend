// next.config.ts
import { NextConfig as FullNextConfig } from 'next';

const nextConfig: FullNextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://seugarcom-prod.backend.railway.app/:path*',
      },
    ];
  },
};

export default nextConfig;

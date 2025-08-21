// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // (opcional; mantenha simples por enquanto)
  images: {
    formats: ['image/avif', 'image/webp'],
    // se você em algum lugar usar URL ABSOLUTA do backend:
    remotePatterns: [
      { protocol: 'https', hostname: 'backend-production-1beb9.up.railway.app', pathname: '/**' },
    ],
  },

  async rewrites() {
    return [
      // já existia
      { source: '/api/:path*', destination: '/api/:path*' },
      { source: '/_api/:path*', destination: 'https://backend-production-1beb9.up.railway.app/:path*' },

      // 👇 NOVO: faz /uploads/* apontar para o backend
      { source: '/uploads/:path*', destination: 'https://backend-production-1beb9.up.railway.app/uploads/:path*' },
    ];
  },
};

export default nextConfig;

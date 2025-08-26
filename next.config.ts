// next.config.ts
import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ['image/avif', 'image/webp'],
    // se você em algum lugar usar URL ABSOLUTA do backend:
    remotePatterns: [
      { protocol: 'https', hostname: 'backend-production-1beb9.up.railway.app', pathname: '/**' },
      { protocol: 'https', hostname: 'seugarcom-frontend-a2wf99iwv-seugarcomprods-projects.vercel.app', pathname: '/**' }
    ],
  },

  webpack: (config) => {
    // ✅ alias absoluto: '@/...' -> 'src/...'
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  deploymentId: process.env.NODE_ENV !== 'production' ? 'dev-v3' : undefined,

  // Drastically reduce client JS bundle size by treeshaking icon and utility barrel files
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'clsx',
      'tailwind-merge',
    ],
  },

  // Image optimization with modern next-gen formats
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache for optimized images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // HTTP Performance, Caching, and Security Headers
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif|ico|woff|woff2|ttf)',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev ? 'no-cache' : 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev ? 'no-store, must-revalidate' : 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          ...(isDev
            ? [
                {
                  key: 'Clear-Site-Data',
                  value: '"cache"',
                },
              ]
            : []),
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;


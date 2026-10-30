import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JobMatch AI',
    short_name: 'JobMatch',
    description: 'AI-Powered ATS Resume Builder, Diagnostic Scanner & Cover Letter Generator',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F4',
    theme_color: '#0F5C4D',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ayonne.skin',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
    ],
    unoptimized: true, // Bypass Next.js image optimization - use CDN images directly
  },
  output: 'standalone',
};

export default nextConfig;

import type { NextConfig } from 'next';

/**
 * Security headers are set here rather than in Express: the API serves JSON only,
 * while these protect the rendered site (ARCHITECTURE §6.3).
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next generates an AGENTS.md on dev start; we keep the repo's files deliberate.
  agentRules: false,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Instagram CDN assets are mirrored to our own media store, but during
      // development the original host is permitted so sync output is viewable.
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },

  experimental: {
    // Keeps the reading route's first-load JS inside the §12 budget.
    optimizePackageImports: ['@triyan/shared'],
  },
};

export default nextConfig;

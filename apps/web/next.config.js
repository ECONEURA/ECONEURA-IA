/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Bundle optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@econeura/shared', '@econeura/sdk'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // API rewrites
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        { source: "/v1/:path*", destination: "http://localhost:4000/v1/:path*" },
      ];
    }
    return [];
  },
};
module.exports = nextConfig;
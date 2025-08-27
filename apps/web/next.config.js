/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  
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
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
    NEXT_PUBLIC_APP_NAME: 'EcoNeura',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Experimental features
  experimental: {
    typedRoutes: false,
  },

  // Image optimization
  images: {
    domains: [],
    dangerouslyAllowSVG: false,
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Development-specific configurations
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
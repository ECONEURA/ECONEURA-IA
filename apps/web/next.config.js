/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuración para Azure App Service
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  images: {
    unoptimized: false,
    domains: ['localhost'],
  },
  // Configuración de headers para seguridad
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
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        { source: "/v1/:path*", destination: "http://localhost:4000/v1/:path*" },
      ];
    }
    return [];
  },
  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
  },
};

export default nextConfig;
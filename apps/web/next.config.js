/** @type {import('next').NextConfig} */
const nextConfig = {
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
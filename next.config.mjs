/** @type {import('next').NextConfig} */
const apiTarget = process.env.NEXT_PUBLIC_API_TARGET ?? "http://127.0.0.1:3001";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;


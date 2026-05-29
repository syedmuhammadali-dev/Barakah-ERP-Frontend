/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV !== "production";
const apiTarget =
  process.env.NEXT_PUBLIC_API_TARGET?.trim() ||
  (isDevelopment ? "http://127.0.0.1:3001" : "");

if (!apiTarget) {
  throw new Error(
    "NEXT_PUBLIC_API_TARGET must be configured in production so /api requests do not fall back to localhost.",
  );
}

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

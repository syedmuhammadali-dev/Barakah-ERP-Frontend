/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV !== "production";
const apiTarget =
  process.env.NEXT_PUBLIC_API_TARGET?.trim() ||
  (isDevelopment ? "http://127.0.0.1:3002" : "");

if (!apiTarget) {
  throw new Error(
    "NEXT_PUBLIC_API_TARGET must be configured in production so /api requests do not fall back to localhost.",
  );
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The desktop app sets BUILD_STANDALONE=true to get a self-contained
  // server bundle it can ship inside the installer. Left unset for the
  // normal web deployment, so Vercel's build is completely unchanged.
  ...(process.env.BUILD_STANDALONE === "true" ? { output: "standalone" } : {}),
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

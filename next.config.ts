import type { NextConfig } from "next";

// Same-origin /api rewrites so the browser never touches the backend host
// directly (no CORS issues, cookies keep working). /api/auth/* is served by
// the local Better Auth route handler below, so only backend-owned prefixes
// are proxied.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
const BACKEND_PREFIXES = [
  "services",
  "categories",
  "vendor",
  "customer",
  "bookings",
  "users",
  "subscriptions",
  "uploads",
  "admin",
  "payment",
  "webhooks",
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return BACKEND_PREFIXES.map((prefix) => ({
      source: `/api/${prefix}/:path*`,
      destination: `${BACKEND_URL}/api/${prefix}/:path*`,
    }));
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "iili.io" },
      { protocol: "https", hostname: "**.ibb.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
